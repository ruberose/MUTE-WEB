"""
MUTE-WEB 기본 앰비언트 사운드 합성기

외부 음원 없이 9개 테마 사운드를 절차적으로 합성해 assets/sounds/*.mp3 로 저장합니다.
모든 파일은 끝과 처음이 자연스럽게 이어지는 루프로 만들어집니다.

필요 패키지: numpy, scipy, lameenc
실행: python tools/generate_sounds.py
"""
import os
import numpy as np
import lameenc
from scipy import signal

SR = 44100
LOOP_SEC = 40
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'sounds')
rng = np.random.default_rng(20261011)
N = SR * LOOP_SEC


# --------------------------------------------------------------------------
# 공통 유틸
# --------------------------------------------------------------------------
def white(n):
    return rng.standard_normal(n)


def brown(n):
    x = np.cumsum(white(n))
    x = signal.lfilter([1, -1], [1, -0.995], x)  # DC 제거
    return x / np.max(np.abs(x))


def pink(n):
    # Paul Kellet 근사 필터
    b = [0.049922035, -0.095993537, 0.050612699, -0.004408786]
    a = [1, -2.494956002, 2.017265875, -0.522189400]
    return signal.lfilter(b, a, white(n))


def _circ_filter(sos, x):
    """끝부분을 앞에 덧대고 필터링해서, 루프 버퍼의 경계에서도 필터 상태가 이어지게 합니다."""
    pad = min(len(x), SR)
    y = signal.sosfilt(sos, np.concatenate([x[-pad:], x]))
    return y[pad:]


def band(x, lo, hi, order=2):
    return _circ_filter(signal.butter(order, [lo, hi], btype='band', fs=SR, output='sos'), x)


def lowpass(x, f, order=2):
    return _circ_filter(signal.butter(order, f, btype='low', fs=SR, output='sos'), x)


def highpass(x, f, order=2):
    return _circ_filter(signal.butter(order, f, btype='high', fs=SR, output='sos'), x)


def slow_lfo(n, rate_hz, depth, phase=None):
    """루프 길이에 정확히 맞아떨어지는 느린 사인 LFO (루프 경계에서 연속)"""
    cycles = max(1, round(rate_hz * LOOP_SEC))
    t = np.arange(n) / n
    ph = rng.uniform(0, 2 * np.pi) if phase is None else phase
    return 1 - depth + depth * (0.5 + 0.5 * np.sin(2 * np.pi * cycles * t + ph))


def periodic_noise_env(n, n_points, smooth=True):
    """루프 경계에서 이어지는 랜덤 엔벨로프 (주기적 보간)"""
    pts = rng.uniform(0, 1, n_points)
    pts = np.append(pts, pts[0])
    xs = np.linspace(0, n, n_points + 1)
    env = np.interp(np.arange(n), xs, pts)
    if smooth:
        # 0.5초 원형 이동평균 (누적합으로 계산 — 직접 convolve는 수 분이 걸림)
        k = int(SR * 0.5)
        padded = np.concatenate([env[-k:], env, env[:k]])
        c = np.cumsum(np.insert(padded, 0, 0.0))
        avg = (c[k:] - c[:-k]) / k
        start = k - k // 2
        env = avg[start:start + n]
    return env


def make_loop(fn, xfade_sec=4.0):
    """fn(n)으로 루프+크로스페이드 길이만큼 생성한 뒤 끝을 처음에 겹쳐 이음매를 없앱니다."""
    c = int(SR * xfade_sec)
    x = fn(N + c)
    t = np.linspace(0, np.pi / 2, c)
    out = x[:N].copy()
    out[:c] = x[:c] * np.sin(t) + x[N:N + c] * np.cos(t)  # equal-power
    return out


def place_circular(buf, event, pos):
    """이벤트를 루프 버퍼에 배치하되 끝을 넘으면 앞부분으로 감아 넣습니다."""
    n = len(buf)
    idx = (pos + np.arange(len(event))) % n
    np.add.at(buf, idx, event)


def circular_reverb(x, decay_sec=2.5, mix=0.35, lp=6000):
    """루프 전체에 대한 원형(circular) 컨볼루션 리버브 — 꼬리가 처음으로 자연스럽게 감깁니다."""
    n = len(x)
    ir_len = int(SR * decay_sec)
    ir = white(ir_len) * np.exp(-np.linspace(0, 7, ir_len))
    ir = lowpass(ir, lp)
    ir /= np.sqrt(np.sum(ir ** 2))
    ir_full = np.zeros(n)
    ir_full[:ir_len] = ir
    wet = np.real(np.fft.ifft(np.fft.fft(x) * np.fft.fft(ir_full)))
    return (1 - mix) * x + mix * wet / (np.max(np.abs(wet)) + 1e-9) * np.max(np.abs(x))


def poisson_times(rate_per_sec, n):
    count = rng.poisson(rate_per_sec * n / SR)
    return np.sort(rng.integers(0, n, count))


def normalize(x, rms_db=-21.0, ceiling_db=-1.0):
    """파일끼리 체감 음량이 비슷하도록 RMS 기준으로 맞추고, 튀는 피크는 부드럽게 눌러줍니다."""
    x = x - np.mean(x)
    x = x / (np.sqrt(np.mean(x ** 2)) + 1e-9) * (10 ** (rms_db / 20))
    ceil = 10 ** (ceiling_db / 20)
    return ceil * np.tanh(x / ceil)


LOOP_PAD_SEC = 0.25  # js/script.js 의 GENERATED_LOOP 값과 맞춰야 합니다


def save_mp3(name, x, bitrate=96):
    x = normalize(x)
    # mp3는 앞뒤에 짧은 무음(인코더 지연)이 붙어 그대로 반복하면 끊깁니다.
    # 루프 앞뒤로 반대쪽 끝 0.25초를 덧붙여 두고, 재생기는 [0.25초, 40.25초] 구간만 반복합니다.
    # (무음이 수 ms 밀려도 그 구간은 항상 이음매 없는 40초짜리 루프가 됩니다)
    pad = int(SR * LOOP_PAD_SEC)
    x = np.concatenate([x[-pad:], x, x[:pad]])
    pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    enc = lameenc.Encoder()
    enc.set_bit_rate(bitrate)
    enc.set_in_sample_rate(SR)
    enc.set_channels(1)
    enc.set_quality(2)
    data = enc.encode(pcm.tobytes()) + enc.flush()
    os.makedirs(OUT_DIR, exist_ok=True)
    path = os.path.join(OUT_DIR, f'{name}.mp3')
    with open(path, 'wb') as f:
        f.write(data)
    print(f'  {name}.mp3  {len(data) / 1024:.0f} KB')


# --------------------------------------------------------------------------
# NATURE
# --------------------------------------------------------------------------
def rain():
    def gen(n):
        bed = band(pink(n), 500, 9000) * 0.6
        bed += lowpass(brown(n), 400) * 0.15
        bed *= slow_lfo(n, 0.05, 0.25)
        drops = np.zeros(n)
        for p in poisson_times(140, n):
            L = int(SR * rng.uniform(0.004, 0.015))
            d = white(L) * np.exp(-np.linspace(0, 6, L)) * rng.uniform(0.05, 0.4)
            place_circular(drops, d, p)
        drops = band(drops, 1500, 7000)
        return bed / np.std(bed) + drops / (np.std(drops) + 1e-9) * 0.5
    return make_loop(gen)


def campfire():
    n = N
    base = make_loop(lambda m: lowpass(brown(m), 250) * 1.0 + band(pink(m), 200, 1200) * 0.15)
    base = base / np.std(base) * 0.35
    base *= slow_lfo(n, 0.1, 0.3)
    crackle = np.zeros(n)
    for p in poisson_times(9, n):
        L = int(SR * rng.uniform(0.002, 0.012))
        c = white(L) * np.exp(-np.linspace(0, 8, L)) * rng.uniform(0.2, 1.0)
        place_circular(crackle, c, p)
    for p in poisson_times(0.6, n):  # 큰 '탁' 소리
        L = int(SR * 0.04)
        c = white(L) * np.exp(-np.linspace(0, 10, L)) * 2.5
        place_circular(crackle, c, p)
    crackle = highpass(crackle, 900)
    return base + crackle * 0.9


def stream():
    def gen(n):
        out = np.zeros(n)
        for lo, hi, rate in [(250, 900, 3.0), (700, 2200, 5.0), (1800, 5000, 7.0)]:
            mod = lowpass(np.abs(white(n)), rate) * 6
            out += band(white(n), lo, hi) * (0.4 + mod)
        bubbles = np.zeros(n)
        for p in poisson_times(25, n):
            L = int(SR * rng.uniform(0.01, 0.04))
            t = np.arange(L) / SR
            f0 = rng.uniform(400, 1400)
            f = f0 * (1 + 12 * t)
            b = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 90) * rng.uniform(0.1, 0.5)
            place_circular(bubbles, b, p)
        return out / np.std(out) + bubbles * 1.2
    return make_loop(gen)


# --------------------------------------------------------------------------
# FANTASY
# --------------------------------------------------------------------------
def choir():
    """은하수 성가대: 'ah' 포먼트를 입힌 코러스 패드 + 원형 리버브"""
    n = N
    xfade = int(SR * 4)
    total = n + xfade  # make_loop 방식으로 끝을 처음에 겹치기 위해 조금 더 길게 합성
    t = np.arange(total) / SR
    # D장조 계열의 느린 코드 진행 (각 10초, 4개 = 40초)
    chords = [
        [146.83, 220.00, 293.66, 369.99],  # D
        [123.47, 185.00, 246.94, 293.66],  # Bm
        [98.00, 196.00, 246.94, 293.66],   # G
        [110.00, 164.81, 220.00, 277.18],  # A
    ]
    seg = n // len(chords)
    formants = [(700, 110), (1220, 120), (2600, 160)]
    out = np.zeros(total)
    for ci, chord in enumerate(chords):
        env = np.zeros(n)
        start = ci * seg
        L = seg + int(SR * 3)
        e = np.ones(L)
        a = int(SR * 3)
        e[:a] = np.sin(np.linspace(0, np.pi / 2, a)) ** 2
        e[-a:] = np.cos(np.linspace(0, np.pi / 2, a)) ** 2
        idx = (start - int(SR * 1.5) + np.arange(L)) % n
        np.add.at(env, idx, e)
        env = env[np.arange(total) % n]  # 루프 길이 이후는 처음 엔벨로프를 그대로 반복
        for f in chord:
            for voice in range(3):
                det = f * (1 + rng.uniform(-0.004, 0.004))
                vib = 1 + 0.004 * np.sin(2 * np.pi * rng.uniform(4.5, 5.5) * t + rng.uniform(0, 6))
                phase = 2 * np.pi * np.cumsum(det * vib) / SR
                v = np.zeros(total)
                for h in range(1, 14):
                    fh = det * h
                    amp = sum(np.exp(-((fh - F) ** 2) / (2 * B ** 2)) * g
                              for (F, B), g in zip(formants, [1.0, 0.5, 0.25])) + 0.02 / h
                    v += amp * np.sin(h * phase)
                out += v * env
    out = lowpass(out, 5000)
    ct = np.linspace(0, np.pi / 2, xfade)
    looped = out[:n].copy()
    looped[:xfade] = out[:xfade] * np.sin(ct) + out[n:n + xfade] * np.cos(ct)
    out = looped
    air = band(pink(n), 2000, 8000)
    out += air / np.std(air) * np.std(out) * 0.05  # 숨결 같은 공기감
    return circular_reverb(out, decay_sec=4.0, mix=0.55)


def glass_chimes():
    """유리 풍경: 펜타토닉 비정수배 배음의 맑은 타격음"""
    n = N
    out = np.zeros(n)
    scale = [1046.5, 1174.7, 1318.5, 1568.0, 1760.0, 2093.0, 2349.3]
    ratios = [1.0, 2.76, 5.40, 8.93]
    times = poisson_times(1.2, n)
    for p in times:
        f = rng.choice(scale)
        L = int(SR * rng.uniform(2.5, 4.5))
        tt = np.arange(L) / SR
        s = np.zeros(L)
        for i, r in enumerate(ratios):
            s += np.sin(2 * np.pi * f * r * tt + rng.uniform(0, 6)) * np.exp(-tt * (1.2 + i * 2.5)) / (i + 1)
        s *= rng.uniform(0.2, 0.8)
        place_circular(out, s, p)
    air = band(pink(n), 300, 3000)
    air = air / np.std(air) * 0.02 * slow_lfo(n, 0.05, 0.6)
    return circular_reverb(out, decay_sec=3.0, mix=0.4) + air


def potion():
    """마법 물약 보글보글: 상승 주파수 버블 + 낮은 끓는 소리"""
    n = N
    simmer = make_loop(lambda m: lowpass(brown(m), 300))
    simmer = simmer / np.std(simmer) * 0.15
    bubbles = np.zeros(n)
    # 모여서 터지는 버블 군집
    for c in poisson_times(1.5, n):
        for _ in range(rng.integers(3, 12)):
            p = c + int(rng.exponential(0.25) * SR)
            L = int(SR * rng.uniform(0.02, 0.07))
            t = np.arange(L) / SR
            f0 = rng.uniform(180, 700)
            f = f0 * (1 + rng.uniform(6, 20) * t)
            b = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * rng.uniform(40, 90)) * rng.uniform(0.2, 1.0)
            place_circular(bubbles, b, p)
    return circular_reverb(simmer + bubbles * 0.7, decay_sec=0.8, mix=0.25)


# --------------------------------------------------------------------------
# EERIE NIGHT
# --------------------------------------------------------------------------
def spooky_wind():
    def gen(n):
        out = np.zeros(n)
        base = pink(n)
        gust = periodic_noise_env(n, 14) * 0.8 + 0.2
        # 중심 주파수가 천천히 움직이는 공명 대역 = 휘파람 같은 바람
        for fc, q, g in [(320, 6, 1.0), (650, 9, 0.6), (1100, 14, 0.35)]:
            mod = 1 + 0.35 * (periodic_noise_env(n, 10) - 0.5)
            seg = SR // 20
            y = np.zeros(n)
            zi = np.zeros(2)  # 구간이 바뀌어도 필터 상태를 이어받아 끊김/잡음 방지
            for i in range(0, n, seg):
                f = fc * mod[i]
                b, a = signal.iirpeak(f, q, fs=SR)
                y[i:i + seg], zi = signal.lfilter(b, a, base[i:i + seg], zi=zi)
            out += lowpass(y, 3000) * g
        rumble = lowpass(brown(n), 120) * 0.6
        return out / np.std(out) * gust + rumble
    # 구간별 필터라 경계가 거칠 수 있어 부드럽게 마무리
    return lowpass(make_loop(gen, xfade_sec=5.0), 4000)


def creaky_door():
    """문 삐걱임: 마찰(stick-slip) 펄스열을 나무 공명으로 걸러낸 소리 + 고요한 방 소리"""
    n = N
    room = make_loop(lambda m: lowpass(brown(m), 200))
    room = room / np.std(room) * 0.06
    out = np.zeros(n)
    starts = [int(SR * s) for s in (3, 17, 29)]
    for st in starts:
        dur = rng.uniform(1.8, 3.2)
        L = int(SR * dur)
        tt = np.arange(L) / SR
        # 마찰 주파수가 불규칙하게 오르내림
        pitch = 40 + 70 * periodic_noise_env(L, 8, smooth=False) + 20 * np.sin(2 * np.pi * 0.7 * tt)
        phase = np.cumsum(pitch / SR)
        pulses = (np.diff(np.floor(phase), prepend=0) > 0).astype(float)
        pulses *= rng.uniform(0.5, 1.0, L)
        creak = np.zeros(L)
        for fc, q, g in [(420, 12, 1.0), (980, 15, 0.7), (1850, 18, 0.4), (2900, 20, 0.2)]:
            b, a = signal.iirpeak(fc, q, fs=SR)
            creak += signal.lfilter(b, a, pulses) * g
        env = np.sin(np.linspace(0, np.pi, L)) ** 0.6
        place_circular(out, creak * env, st)
    out = out / (np.max(np.abs(out)) + 1e-9) * 0.8
    return circular_reverb(out, decay_sec=1.6, mix=0.3) + room


def footsteps():
    """무거운 발소리: 나무 바닥 위 느린 걸음 몇 차례 + 빈 공간 울림"""
    n = N
    room = make_loop(lambda m: lowpass(brown(m), 150))
    room = room / np.std(room) * 0.05
    out = np.zeros(n)
    for walk_start in (2.0, 16.0, 28.5):
        steps = rng.integers(5, 8)
        interval = rng.uniform(0.75, 0.95)
        for i in range(steps):
            p = int(SR * (walk_start + i * interval + rng.uniform(-0.03, 0.03)))
            L = int(SR * 0.35)
            t = np.arange(L) / SR
            thud = np.sin(2 * np.pi * rng.uniform(55, 75) * t) * np.exp(-t * 18)
            body = lowpass(white(L), 600) * np.exp(-t * 30) * 0.8
            grit = highpass(white(L), 2000) * np.exp(-t * 60) * 0.15
            # 걸음마다 마룻바닥이 조금 삐걱
            board = np.zeros(L)
            if rng.random() < 0.4:
                b, a = signal.iirpeak(rng.uniform(500, 900), 20, fs=SR)
                board = signal.lfilter(b, a, white(L) * np.exp(-t * 12)) * 0.3
            step = (thud + body + grit + board) * rng.uniform(0.7, 1.0)
            place_circular(out, step, p)
    out = lowpass(out, 4000)
    return circular_reverb(out, decay_sec=1.8, mix=0.4) + room


# --------------------------------------------------------------------------
# OCEAN
# --------------------------------------------------------------------------
WAVE_PERIOD_SEC = 8  # 40초 루프에 파도 5번


def wave_envelope(n, lag=0.0, sharp=3.0):
    """파도가 밀려왔다 빠지는 주기 엔벨로프 (루프 길이에 정확히 맞음). lag는 주기 비율 단위 지연."""
    t = np.arange(n) / SR
    phase = (t / WAVE_PERIOD_SEC - lag) % 1.0
    # 빠르게 차오르고 천천히 빠지는 모양
    rise = np.clip(phase / 0.25, 0, 1)
    fall = np.exp(-np.clip(phase - 0.25, 0, None) * sharp)
    return rise ** 2 * fall


def ocean_waves():
    n = N
    body = make_loop(lambda m: lowpass(brown(m), 700) * 0.7 + band(pink(m), 150, 2500) * 0.5)
    foam = make_loop(lambda m: band(pink(m), 1500, 9000))
    env = wave_envelope(n)
    foam_env = wave_envelope(n, lag=0.04, sharp=5.0)
    out = body / np.std(body) * (0.25 + env) + foam / np.std(foam) * foam_env * 0.6
    return out


def pebbles():
    """몽돌 구르는 소리: 파도가 빠질 때 자갈이 쓸려 내려가며 내는 잔 달그락거림"""
    n = N
    env = wave_envelope(n, lag=0.12, sharp=2.0)
    clicks = np.zeros(n)
    times = poisson_times(400, n)
    keep = rng.random(len(times)) < env[times]  # 파도가 빠지는 구간에 몰리도록
    for p in times[keep]:
        L = int(SR * rng.uniform(0.002, 0.008))
        c = white(L) * np.exp(-np.linspace(0, 7, L)) * rng.uniform(0.1, 1.0)
        place_circular(clicks, c, p)
    clicks = band(clicks, 1800, 7000)
    wash = make_loop(lambda m: band(pink(m), 800, 5000))
    wash = wash / np.std(wash) * 0.15 * env
    return clicks / (np.std(clicks) + 1e-9) * 0.5 + wash


def sea_breeze():
    """바닷바람: 휘파람 없이 넓게 부는 부드러운 바람"""
    def gen(m):
        base = band(pink(m), 120, 2500)
        gust = periodic_noise_env(m, 10) * 0.7 + 0.3
        return base / np.std(base) * gust + lowpass(brown(m), 150) * 0.4
    return make_loop(gen, xfade_sec=5.0)


# --------------------------------------------------------------------------
# DEEP SPACE
# --------------------------------------------------------------------------
def engine_hum():
    """우주선 엔진 험: 낮은 드론 + 미세한 맥놀이 + 깊은 진동"""
    n = N
    t = np.arange(n) / SR
    out = np.zeros(n)
    # 40초 안에 정확히 정수 번 도는 주파수만 사용 (f = k / 40) → 루프 경계에서 위상이 이어짐
    for f, g in [(55.0, 1.0), (55.1, 0.6), (110.0, 0.35), (165.025, 0.15), (220.05, 0.08)]:
        out += g * np.sin(2 * np.pi * f * t)
    out *= slow_lfo(n, 0.1, 0.15)
    rumble = make_loop(lambda m: lowpass(brown(m), 90))
    hiss = make_loop(lambda m: band(pink(m), 2000, 6000))
    return out / np.std(out) + rumble / np.std(rumble) * 0.35 + hiss / np.std(hiss) * 0.03


def radio_static():
    """전파 잡음: 띄엄띄엄 들어오는 지직거림과 주파수를 맞추는 듯한 휘파람"""
    n = N
    static = make_loop(lambda m: band(white(m), 400, 4000))
    burst_env = periodic_noise_env(n, 24) ** 3
    out = static / np.std(static) * (0.08 + burst_env * 0.9)
    for p in poisson_times(0.2, n):  # 튜닝 휘파람
        L = int(SR * rng.uniform(1.0, 2.5))
        tt = np.arange(L) / SR
        f = rng.uniform(600, 1400) + 300 * np.sin(2 * np.pi * rng.uniform(0.3, 0.8) * tt)
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.linspace(0, np.pi, L)) * 0.25
        place_circular(out, s, p)
    return out


def star_signals():
    """별빛 신호: 먼 곳에서 오는 듯한 부드러운 핑 소리 + 긴 잔향"""
    n = N
    out = np.zeros(n)
    notes = [523.25, 659.25, 783.99, 880.0, 1046.5, 1318.5]
    for p in poisson_times(0.45, n):
        f = rng.choice(notes)
        L = int(SR * 2.5)
        tt = np.arange(L) / SR
        ping = (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * f * 2.01 * tt)) * np.exp(-tt * 2.2)
        ping *= np.minimum(1, tt / 0.01) * rng.uniform(0.3, 0.9)
        place_circular(out, ping, p)
    pad = make_loop(lambda m: lowpass(pink(m), 400))
    return circular_reverb(out, decay_sec=4.5, mix=0.6) + pad / np.std(pad) * 0.04


SOUNDS = {
    'rain': rain,
    'campfire': campfire,
    'stream': stream,
    'choir': choir,
    'glass_chimes': glass_chimes,
    'potion': potion,
    'spooky_wind': spooky_wind,
    'creaky_door': creaky_door,
    'footsteps': footsteps,
    'ocean_waves': ocean_waves,
    'pebbles': pebbles,
    'sea_breeze': sea_breeze,
    'engine_hum': engine_hum,
    'radio_static': radio_static,
    'star_signals': star_signals,
}

if __name__ == '__main__':
    import sys
    targets = sys.argv[1:] or list(SOUNDS)
    print(f'출력 폴더: {os.path.normpath(OUT_DIR)}')
    for name in targets:
        save_mp3(name, SOUNDS[name]())
