/**
 * ==========================================================================
 * MUTE-WEB — Ambient Sound Mixer
 * ==========================================================================
 *
 * 테마 선택 → 테마별 사운드 레이어 믹서(개별/마스터 볼륨), 취침 타이머(10초 페이드아웃),
 * 몰입 모드(전체화면 캔버스 비주얼), 테마별 설정 LocalStorage 저장, 웹 공유를 담당합니다.
 */

// ==========================================================================
// 0. 테마별 메타데이터 정의
// ==========================================================================

/**
 * @typedef {Object} SoundInfo
 * @property {string} id - 사운드 고유 식별자 (DOM 생성 및 오디오 바인딩용)
 * @property {string} name - 한글 표시용 이름
 * @property {string} url - 음원 경로 (assets/sounds/, tools/generate_sounds.py로 생성)
 * @property {number[]} [loop] - [시작초, 끝초] 반복 구간. 없으면 파일 전체를 반복
 */

// tools/generate_sounds.py 로 만든 파일은 앞뒤 0.25초 여유분을 빼고 40초 구간만 반복합니다.
const GENERATED_LOOP = [0.25, 40.25];

/**
 * @typedef {Object} ThemeData
 * @property {string} title - 테마 타이틀
 * @property {string} bgName - 테마의 주 배경 개념
 * @property {string} visualText - 멍 공간에 매핑할 하단 텍스트 설명
 * @property {SoundInfo[]} sounds - 해당 테마가 가지는 3가지 상세 백색소음 목록
 */

/** @type {Object.<string, ThemeData>} 이름·설명은 { ko, en } 으로 두 언어를 함께 둡니다 (js/i18n.js) */
const themeData = {
  nature: {
    title: "NATURE",
    bgName: "RAINY CAMPFIRE",
    visualText: { ko: "나뭇잎에 떨어지는 부드러운 빗소리와 화로의 조용한 불꽃", en: "Soft rain on leaves and the quiet flicker of a campfire" },
    sounds: [
      { id: 'rain', name: { ko: '🌧️ 자갈 빗소리', en: '🌧️ Rain on gravel' }, url: 'assets/sounds/rain.mp3', loop: GENERATED_LOOP },
      { id: 'campfire', name: { ko: '🔥 자작나무 모닥불', en: '🔥 Birch campfire' }, url: 'assets/sounds/campfire.mp3', loop: GENERATED_LOOP },
      { id: 'stream', name: { ko: '🏞️ 숲속 시냇물', en: '🏞️ Forest stream' }, url: 'assets/sounds/stream.mp3', loop: GENERATED_LOOP }
    ]
  },
  fantasy: {
    title: "FANTASY",
    bgName: "ETHER MARKET",
    visualText: { ko: "시간이 정지된 공중 마법 상점의 오묘하고 신비로운 선율", en: "Mysterious melodies in a floating magic shop where time stands still" },
    sounds: [
      { id: 'fantasy_melody', name: { ko: '✨ 은하수 성가대', en: '✨ Milky Way choir' }, url: 'assets/sounds/choir.mp3', loop: GENERATED_LOOP },
      { id: 'clock', name: { ko: '🎐 유리 풍경 소리', en: '🎐 Glass wind chimes' }, url: 'assets/sounds/glass_chimes.mp3', loop: GENERATED_LOOP },
      { id: 'potion', name: { ko: '🧪 마법 물약 보글보글', en: '🧪 Bubbling potion' }, url: 'assets/sounds/potion.mp3', loop: GENERATED_LOOP }
    ]
  },
  horror: {
    title: "EERIE NIGHT",
    bgName: "ABANDONED MANOR",
    visualText: { ko: "짙은 안개 속 버려진 고성의 서늘한 돌풍과 삐걱임", en: "Chill gusts and creaks in an abandoned manor lost in fog" },
    sounds: [
      { id: 'spooky_wind', name: { ko: '💨 안개 낀 강풍', en: '💨 Foggy gale' }, url: 'assets/sounds/spooky_wind.mp3', loop: GENERATED_LOOP },
      { id: 'creaky_door', name: { ko: '🚪 문 삐걱임', en: '🚪 Creaking door' }, url: 'assets/sounds/creaky_door.mp3', loop: GENERATED_LOOP },
      { id: 'footstep', name: { ko: '👣 무거운 발소리', en: '👣 Heavy footsteps' }, url: 'assets/sounds/footsteps.mp3', loop: GENERATED_LOOP }
    ]
  },
  ocean: {
    title: "OCEAN",
    bgName: "MIDNIGHT SHORE",
    visualText: { ko: "달빛 아래 몽돌 해변으로 천천히 밀려왔다 빠지는 밤바다", en: "A night sea rolling slowly over a pebble beach under the moon" },
    sounds: [
      { id: 'ocean_waves', name: { ko: '🌊 밤바다 파도', en: '🌊 Night waves' }, url: 'assets/sounds/ocean_waves.mp3', loop: GENERATED_LOOP },
      { id: 'pebbles', name: { ko: '🪨 몽돌 구르는 소리', en: '🪨 Rolling pebbles' }, url: 'assets/sounds/pebbles.mp3', loop: GENERATED_LOOP },
      { id: 'sea_breeze', name: { ko: '🌬️ 바닷바람', en: '🌬️ Sea breeze' }, url: 'assets/sounds/sea_breeze.mp3', loop: GENERATED_LOOP }
    ]
  },
  space: {
    title: "DEEP SPACE",
    bgName: "ORBITAL STATION",
    visualText: { ko: "별들 사이를 떠도는 정거장의 낮은 엔진음과 먼 곳의 신호", en: "The low engine hum of a station drifting between stars, and distant signals" },
    sounds: [
      { id: 'engine_hum', name: { ko: '🛰️ 정거장 엔진 험', en: '🛰️ Station engine hum' }, url: 'assets/sounds/engine_hum.mp3', loop: GENERATED_LOOP },
      { id: 'radio_static', name: { ko: '📻 전파 잡음', en: '📻 Radio static' }, url: 'assets/sounds/radio_static.mp3', loop: GENERATED_LOOP },
      { id: 'star_signals', name: { ko: '✴️ 별빛 신호', en: '✴️ Starlight signals' }, url: 'assets/sounds/star_signals.mp3', loop: GENERATED_LOOP }
    ]
  }
};

// MY MIX: 모든 테마의 소리를 한곳에 모아 자유롭게 섞는 테마. 배경은 사용자가 고릅니다.
// (group = 원래 테마. 서랍에서 테마별로 묶어 보여줄 때 사용)
const CUSTOM_THEME_ID = 'custom';
themeData[CUSTOM_THEME_ID] = {
  title: "MY MIX",
  bgName: "MY ROOM",
  visualText: { ko: "모든 테마의 소리를 골라 섞는 나만의 공간", en: "Your own room — mix any sound from every theme" },
  isCustom: true,
  sounds: Object.entries(themeData).flatMap(([group, theme]) => theme.sounds.map((s) => ({ ...s, group })))
};
const BACKDROP_THEMES = ['nature', 'fantasy', 'horror', 'ocean', 'space'];
let customBackdrop = 'nature';

/** 테마가 실제로 보여줄 배경(입자·색감·멍 비주얼) */
function backdropFor(themeId) {
  return themeId === CUSTOM_THEME_ID ? customBackdrop : themeId;
}

let asmrSounds = []; 
let currentThemeId = ''; 
let masterVolume = 1.0; 
let timerSecondsRemaining = 0; 
let countdownIntervalId = null; 
let isFadingOut = false; 

// ==========================================================================
// 2. 화면 전환 및 동적 DOM 렌더링 모듈
// ==========================================================================

/**
 * 선택된 테마 정보를 바탕으로 오디오 소스를 갈아끼우고
 * 멍 공간 명칭 및 믹서 라벨을 동적 매핑하는 핵심 셋업 함수
 * 
 * @param {string} themeId - 셋업할 테마 ID
 */
function setupTheme(themeId) {
  const themeInfo = themeData[themeId];
  if (!themeInfo) return;

  currentThemeId = themeId;

  // 1. 오디오 데이터 매핑 (기존 오디오 주소를 새 테마 URL로 완전히 교체 및 초기화)
  // status는 코드값: idle | loading | ready | playing | stopped | failed (표시 문구는 i18n의 status_*)
  asmrSounds = themeInfo.sounds.map(sound => ({
    id: sound.id,
    name: sound.name,  // { ko, en }
    group: sound.group,
    url: sound.url,
    loop: sound.loop,
    buffer: null,   // 디코딩된 AudioBuffer
    gain: null,     // 사운드별 GainNode
    source: null,   // 재생 중인 { src, fader }
    status: 'idle',
    volume: 0.5,
    isPlaying: false
  }));

  renderThemeTexts();
  document.getElementById('backdrop-picker').hidden = !themeInfo.isCustom;

  renderAudioControls();
  // MY MIX는 소리가 15개라 켜는 소리만 그때그때 받습니다 (처음부터 다 받으면 약 7MB)
  initializeAudioSources({ preload: !themeInfo.isCustom });

  // 2. 테마별 캔버스 비주얼 구동
  initCanvasEffect(themeId);
}

/** 믹서 화면의 테마 제목·설명 문구 (언어를 바꿀 때도 다시 호출) */
function renderThemeTexts() {
  const themeInfo = themeData[currentThemeId];
  if (!themeInfo) return;
  document.getElementById('app-title').textContent = `MUTE [${themeInfo.title}]`;
  document.getElementById('current-bg-name').textContent = themeInfo.bgName;
  document.getElementById('theme-visual-text').textContent = localized(themeInfo.visualText);
  document.getElementById('drawer-heading').textContent = t('drawerHeading', { theme: themeInfo.title });
}

/**
 * 가동 중인 오디오, 캔버스 애니메이션 및 취침 예약 타이머를 정지시키는 공통 리셋 모듈
 */
function resetEngine() {
  pausedSoundIds = []; // 다른 테마의 '마지막으로 켜둔 소리' 기록이 섞이지 않도록
  // stopAllSounds()는 '모두 꺼짐'을 저장해버리므로 여기서는 저장 없이 정지만 합니다.
  document.getElementById('btn-play-all').classList.remove('active-play');
  handleCancelTimer();

  // 1. 오디오 소멸 (페이드아웃이 끝난 뒤 노드 해제)
  asmrSounds.forEach((sound) => {
    stopSource(sound);
    const gain = sound.gain;
    if (gain) setTimeout(() => gain.disconnect(), FADE_OUT_STOP_SEC * 1000 + 100);
  });
  asmrSounds = [];

  // 2. 캔버스 루프 애니메이션 일시 정지
  cancelAnimationFrame(canvasAnimId);
}

/**
 * 유저가 첫 화면에서 특정 테마를 선택했을 때 동작하는 이벤트 트리거 및 화면 전환 처리기
 * 
 * @param {string} themeId - 선택된 테마 식별자 ('nature', 'fantasy', 'horror')
 */
function selectTheme(themeId) {
  if (!themeData[themeId]) return;
  const firstVisit = !hasSavedSettings(themeId);
  resetEngine();
  setupTheme(themeId);
  loadSettings();
  renderPresets();
  enableFocusMode(false);
  setAmbientTheme(backdropFor(themeId));
  document.getElementById('backdrop-select').value = customBackdrop;
  rememberLastTheme(themeId);

  document.getElementById('theme-select-page').style.display = 'none';
  document.getElementById('mixer-page').style.display = 'flex';

  // MY MIX를 처음 열면 소리가 모두 꺼져 있으므로 서랍을 열어 고르도록 안내
  if (themeData[themeId].isCustom && firstVisit) {
    toggleSettingsDrawer(true);
    showToast(t('customHint'));
  }
}

function hasSavedSettings(themeId) {
  try { return localStorage.getItem(`mute_settings_${themeId}`) !== null; } catch (e) { return false; }
}

/** MY MIX의 배경을 바꿉니다. */
function changeCustomBackdrop(themeId) {
  if (!BACKDROP_THEMES.includes(themeId)) return;
  customBackdrop = themeId;
  if (currentThemeId === CUSTOM_THEME_ID) {
    setAmbientTheme(themeId);
    saveSettings();
  }
}

// ==========================================================================
// 2-2. 이어 듣기 (마지막으로 들은 테마를 첫 화면에서 바로 열기)
// ==========================================================================
const LAST_THEME_KEY = 'mute_last_theme';

function rememberLastTheme(themeId) {
  try { localStorage.setItem(LAST_THEME_KEY, themeId); } catch (e) { /* 무시 */ }
}

function renderResumeButton() {
  const btn = document.getElementById('btn-resume-last');
  let last = null;
  try { last = localStorage.getItem(LAST_THEME_KEY); } catch (e) { /* 무시 */ }
  btn.hidden = !themeData[last];
  if (!themeData[last]) return;
  btn.dataset.theme = last;
  document.getElementById('resume-last-text').textContent = t('resumeLast', { theme: themeData[last].title });
}


/**
 * 메인 믹서 화면에서 좌측 상단 복귀 버튼 클릭 시 
 * 작동 중인 모든 리소스를 안전하게 강제 자동 저장한 후 초기 테마 선택 화면으로 복귀합니다.
 */
function goToThemeSelectPage() {
  saveSettings();
  resetEngine();
  enableFocusMode(false);
  setAmbientTheme('');
  currentThemeId = '';
  updateMediaSession();

  document.getElementById('theme-select-page').style.display = 'flex';
  document.getElementById('mixer-page').style.display = 'none';
  toggleSettingsDrawer(false);
  renderResumeButton();
}

/**
 * 선택된 테마의 sounds 배열 데이터를 바탕으로 
 * 설정 서랍 내의 `#sounds-list` 영역에 개별 오디오 제어 UI 엘리먼트들을 동적으로 주입합니다.
 */
function renderAudioControls() {
  const soundsList = document.getElementById('sounds-list');
  if (!soundsList) return;
  soundsList.innerHTML = '';

  let lastGroup = null;
  asmrSounds.forEach((sound) => {
    // MY MIX: 원래 테마별로 소제목을 붙여 묶어 보여줌
    if (sound.group && sound.group !== lastGroup) {
      lastGroup = sound.group;
      const heading = document.createElement('li');
      heading.className = 'sound-group-heading';
      heading.setAttribute('role', 'presentation');
      heading.textContent = themeData[sound.group].title;
      soundsList.appendChild(heading);
    }

    const name = localized(sound.name);
    const spokenName = name.replace(/^\S+\s+/, ''); // 화면 낭독기가 앞의 이모지를 읽지 않도록
    const li = document.createElement('li');
    li.className = 'audio-control-item';
    li.id = `item-${sound.id}`;

    const label = document.createElement('span');
    label.className = 'sound-label';
    label.id = `label-${sound.id}`;
    label.textContent = name;

    const row = document.createElement('div');
    row.className = 'audio-control-row';

    const slider = document.createElement('input');
    Object.assign(slider, { type: 'range', className: 'volume-slider', id: `volume-${sound.id}`, min: 0, max: 1, step: 0.01, value: sound.volume });
    slider.setAttribute('aria-label', t('soundVolume', { name: spokenName }));
    slider.addEventListener('input', (e) => updateVolume(sound.id, parseFloat(e.target.value)));

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'btn-toggle-switch';
    toggle.id = `btn-switch-${sound.id}`;
    toggle.setAttribute('aria-label', t('soundToggle', { name: spokenName }));
    toggle.addEventListener('click', () => toggleSoundSwitch(sound.id));

    const status = document.createElement('span');
    status.className = 'sound-status';
    status.id = `status-${sound.id}`;
    status.setAttribute('aria-hidden', 'true'); // 켜짐/꺼짐은 버튼의 aria-pressed로 전달

    row.append(slider, toggle, status);
    li.append(label, row);
    soundsList.appendChild(li);
  });
  renderStatus();
}

// ==========================================================================
// 3. Web Audio 엔진 (끊김 없는 반복 재생)
// ==========================================================================
// <audio loop>는 반복 지점에서 짧게 끊기므로, 파일을 메모리에 디코딩한 뒤
// AudioBufferSourceNode의 loopStart/loopEnd로 샘플 단위로 이어 붙여 반복합니다.

let audioCtx = null;
let offlineNoticeShown = false;
/** @type {Map<string, Promise<AudioBuffer>>} 테마를 오가도 다시 받지 않도록 캐시 */
const bufferCache = new Map();

/** 첫 사용자 클릭 시점에 AudioContext를 만들고, 일시정지 상태면 깨웁니다. */
function getAudioContext() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function loadBuffer(url) {
  if (!bufferCache.has(url)) {
    const promise = fetch(url)
      .then((res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.arrayBuffer(); })
      .then((data) => getAudioContext().decodeAudioData(data));
    promise.catch(() => bufferCache.delete(url)); // 실패한 요청은 다음에 다시 시도
    bufferCache.set(url, promise);
  }
  return bufferCache.get(url);
}

// 페이드 시간 상수 (setTargetAtTime의 시간상수: 약 3배 시간이 지나면 95% 도달)
const FADE_IN_TAU = 0.5;     // 켤 때 약 1.5초에 걸쳐 커짐
const FADE_OUT_TAU = 0.3;    // 끌 때 약 1초에 걸쳐 작아짐
const FADE_OUT_STOP_SEC = 1.5;
const VOLUME_TAU = 0.05;     // 슬라이더 조작은 즉각 반응

/**
 * 각 사운드의 볼륨용 GainNode를 만들고 음원을 불러옵니다.
 * 불러오기가 끝났을 때 켜짐 상태라면 그때 재생을 시작합니다.
 *
 * 연결 구조: BufferSource → fader(켜고 끄는 페이드, 재생마다 새로 생성) → gain(볼륨) → 출력
 */
function initializeAudioSources({ preload = true } = {}) {
  const ctx = getAudioContext();
  asmrSounds.forEach((sound) => {
    sound.gain = ctx.createGain();
    sound.gain.gain.value = getCalculatedVolume(sound);
    sound.gain.connect(ctx.destination);
    if (preload) ensureBuffer(sound);
  });
  renderStatus();
}

/** 음원을 아직 안 받았으면 받기 시작합니다. 다 받았을 때 켜짐 상태면 바로 재생. */
function ensureBuffer(sound) {
  if (sound.buffer || sound.status === 'loading') return;
  sound.status = 'loading';
  loadBuffer(sound.url)
    .then((buffer) => {
      if (!asmrSounds.includes(sound)) return; // 그 사이 테마가 바뀐 경우
      sound.buffer = buffer;
      if (sound.isPlaying) startSource(sound);
      else sound.status = 'ready';
      renderStatus();
    })
    .catch((err) => {
      console.error(`[사운드 불러오기 실패] ${sound.url}`, err);
      sound.status = 'failed';
      sound.isPlaying = false;
      renderStatus();
      if (!navigator.onLine && !offlineNoticeShown) {
        offlineNoticeShown = true;
        showToast(t('offlineNotice'));
      }
    });
}

function startSource(sound) {
  if (!sound.buffer || sound.source) return;
  const ctx = getAudioContext();
  const src = ctx.createBufferSource();
  src.buffer = sound.buffer;
  src.loop = true;
  let offset = 0;
  if (sound.loop) {
    [src.loopStart, src.loopEnd] = sound.loop;
    offset = sound.loop[0];
  }
  const fader = ctx.createGain();
  fader.gain.value = 0;
  fader.gain.setTargetAtTime(1, ctx.currentTime, FADE_IN_TAU);
  src.connect(fader).connect(sound.gain);
  src.start(0, offset);
  sound.source = { src, fader };
  sound.status = 'playing';
  applyGain(sound);
}

/** 페이드아웃 후 정지합니다. 곧바로 다시 켜도 새 소스는 별도 fader를 쓰므로 겹치지 않습니다. */
function stopSource(sound) {
  if (!sound.source) return;
  const ctx = getAudioContext();
  const { src, fader } = sound.source;
  fader.gain.setTargetAtTime(0, ctx.currentTime, FADE_OUT_TAU);
  src.stop(ctx.currentTime + FADE_OUT_STOP_SEC);
  src.onended = () => { src.disconnect(); fader.disconnect(); };
  sound.source = null;
}

/** 볼륨 변화도 부드럽게 따라가도록 setTargetAtTime으로 적용합니다. */
function applyGain(sound, tau = VOLUME_TAU) {
  if (!sound.gain) return;
  sound.gain.gain.setTargetAtTime(getCalculatedVolume(sound), getAudioContext().currentTime, tau);
}

/** 사운드 켜기/끄기의 단일 진입점 (불러오는 중이면 완료 후 자동 재생) */
function setSoundPlaying(sound, on) {
  if (on && sound.status === 'failed') sound.status = 'idle'; // 실패했던 소리는 다시 켤 때 재시도
  sound.isPlaying = on;
  if (on) {
    if (sound.buffer) startSource(sound);
    else ensureBuffer(sound);
  } else {
    stopSource(sound);
    if (sound.buffer) sound.status = 'stopped';
  }
}

// ==========================================================================
// 4. LocalStorage 유저 설정 저장 및 로드 모듈 (테마별 독립 격리 공간)
// ==========================================================================

/**
 * 테마별 개별 독립 Key 기반의 LocalStorage 자동 저장 함수
 */
function saveSettings() {
  if (!currentThemeId) return;
  try {
    const storageKey = `mute_settings_${currentThemeId}`;
    const userSettings = {
      masterVolume: masterVolume,
      sounds: asmrSounds.map((sound) => ({ id: sound.id, volume: sound.volume, isPlaying: sound.isPlaying }))
    };
    if (currentThemeId === CUSTOM_THEME_ID) userSettings.backdrop = customBackdrop;
    localStorage.setItem(storageKey, JSON.stringify(userSettings));
  } catch (error) { console.error(error); }
}

/**
 * 격리 키 로드 및 미경험 유저 기본값(볼륨 0.5, 모두 ON) 예외 처리 로드 함수
 */
function loadSettings() {
  if (!currentThemeId) return;
  try {
    const storageKey = `mute_settings_${currentThemeId}`;
    const rawData = localStorage.getItem(storageKey);
    
    const isCustom = currentThemeId === CUSTOM_THEME_ID;

    if (!rawData) {
      // 처음 여는 테마: 볼륨 0.5로 모두 켬. 단, MY MIX는 15개가 한꺼번에 나지 않도록 모두 끈 채로 시작
      masterVolume = 1.0;
      const masterSlider = document.getElementById('master-volume');
      if (masterSlider) masterSlider.value = 1.0;
      if (isCustom) customBackdrop = 'nature';

      asmrSounds.forEach((sound) => {
        sound.volume = 0.5;
        const sliderElement = document.getElementById(`volume-${sound.id}`);
        if (sliderElement) sliderElement.value = 0.5;
        setSoundPlaying(sound, !isCustom);
      });
      renderStatus();
      return;
    }

    const themeSettings = JSON.parse(rawData);
    if (isCustom && BACKDROP_THEMES.includes(themeSettings.backdrop)) customBackdrop = themeSettings.backdrop;
    if (typeof themeSettings.masterVolume === 'number') {
      masterVolume = themeSettings.masterVolume;
      const masterSlider = document.getElementById('master-volume');
      if (masterSlider) masterSlider.value = masterVolume;
    }

    if (Array.isArray(themeSettings.sounds)) {
      themeSettings.sounds.forEach((savedSound) => {
        const sound = asmrSounds.find((s) => s.id === savedSound.id);
        if (sound) {
          sound.volume = savedSound.volume;
          const sliderElement = document.getElementById(`volume-${sound.id}`);
          if (sliderElement) sliderElement.value = sound.volume;
          setSoundPlaying(sound, !!savedSound.isPlaying);
        }
      });
    }
    renderStatus();
  } catch (error) { console.error(error); }
}

// ==========================================================================
// 5. 볼륨 연산 엔진 함수
// ==========================================================================

/**
 * 수학적 볼륨 공식을 기반으로 개별 사운드의 실제 출력 오디오 볼륨을 계산합니다.
 */
function getCalculatedVolume(sound) {
  let fadeRatio = 1.0;
  if (isFadingOut) fadeRatio = Math.max(0, Math.min(1, timerSecondsRemaining / timerFadeWindow));
  return Math.max(0, Math.min(1, sound.volume * masterVolume * fadeRatio));
}

function syncAllAudioVolumes(tau = VOLUME_TAU) {
  asmrSounds.forEach((sound) => applyGain(sound, tau));
}

// ==========================================================================
// 6. UI 렌더링 함수
// ==========================================================================

/**
 * 현재 asmrSounds 배열에 저장된 상태를 화면의 텍스트 라벨과 스위치 텍스트에 반영합니다.
 */
function renderStatus() {
  asmrSounds.forEach((sound) => {
    const labelElement = document.getElementById(`status-${sound.id}`);
    if (labelElement) {
      labelElement.textContent = t(`status_${sound.status}`);
      labelElement.setAttribute('data-status', sound.status);
    }
    const switchBtn = document.getElementById('btn-switch-' + sound.id);
    if (switchBtn) {
      switchBtn.textContent = sound.isPlaying ? t('on') : t('off');
      switchBtn.setAttribute('aria-pressed', String(sound.isPlaying));
      switchBtn.classList.toggle('active-on', sound.isPlaying);
    }
  });
  const btnPlayAll = document.getElementById('btn-play-all');
  if (btnPlayAll) btnPlayAll.classList.toggle('active-play', asmrSounds.some(s => s.isPlaying));
  updateMediaSession();
}

// ==========================================================================
// 6-2. 잠금화면 / 미디어 키 제어 (Media Session API)
// ==========================================================================
// Web Audio만으로는 OS가 '재생 중인 미디어'로 인식하지 않아 잠금화면 컨트롤이 뜨지 않습니다.
// 그래서 소리가 날 때 무음 <audio>를 함께 재생해 미디어로 인식시키고 메타데이터를 넘깁니다.
// (iOS에서 무음 스위치를 켜도 소리가 나도록 하는 효과도 있습니다)

let mediaKeepAlive = null;

/** 길이 10초짜리 무음 WAV를 메모리에서 만들어 URL로 돌려줍니다. */
function createSilentWavUrl(seconds = 10, sampleRate = 8000) {
  const samples = seconds * sampleRate;
  const view = new DataView(new ArrayBuffer(44 + samples * 2));
  const writeText = (offset, text) => [...text].forEach((ch, i) => view.setUint8(offset + i, ch.charCodeAt(0)));
  writeText(0, 'RIFF'); view.setUint32(4, 36 + samples * 2, true); writeText(8, 'WAVE');
  writeText(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  writeText(36, 'data'); view.setUint32(40, samples * 2, true);
  return URL.createObjectURL(new Blob([view.buffer], { type: 'audio/wav' }));
}

function updateMediaSession() {
  const anyPlaying = asmrSounds.some((s) => s.isPlaying);
  const theme = themeData[currentThemeId];

  if (!mediaKeepAlive) {
    mediaKeepAlive = new Audio(createSilentWavUrl());
    mediaKeepAlive.loop = true;
  }
  if (anyPlaying && mediaKeepAlive.paused) mediaKeepAlive.play().catch(() => {});
  if (!anyPlaying && !mediaKeepAlive.paused) mediaKeepAlive.pause();

  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.metadata = theme
    ? new MediaMetadata({
        title: theme.bgName, artist: `MUTE · ${theme.title}`, album: 'MUTE Ambient Mixer',
        artwork: [{ src: 'assets/icons/icon-512.png', sizes: '512x512', type: 'image/png' }]
      })
    : null;
  navigator.mediaSession.playbackState = anyPlaying ? 'playing' : (theme ? 'paused' : 'none');
}

function setupMediaSessionHandlers() {
  if (!('mediaSession' in navigator)) return;
  const handlers = { play: resumePlayback, pause: pausePlayback, stop: pausePlayback };
  Object.entries(handlers).forEach(([action, fn]) => {
    try { navigator.mediaSession.setActionHandler(action, () => fn()); } catch (e) { /* 미지원 액션 */ }
  });
}

// ==========================================================================
// 6-3. 키보드 단축키
// ==========================================================================

function handleShortcutKey(e) {
  if (!currentThemeId) return;                                  // 믹서 화면에서만
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.target.closest && e.target.closest('input, textarea, select')) return; // 타이머 입력·슬라이더 조작 중엔 무시

  // e.code를 쓰는 이유: 한글 입력 상태에서도 F 키가 'ㄹ'로 오지 않도록
  if (e.code === 'Space') {
    // 버튼에 포커스가 있으면 Space는 그 버튼을 누르는 키 (키보드 사용자를 위해 가로채지 않음)
    if (e.target.closest && e.target.closest('button, [role="button"], a')) return;
    e.preventDefault();
    togglePlayback();
  } else if (e.code === 'KeyF') {
    enableFocusMode(!isFocusMode());
  } else if (e.code === 'Escape') {
    const drawer = document.getElementById('settings-drawer');
    if (drawer.classList.contains('active')) toggleSettingsDrawer(false);
    else if (isFocusMode()) enableFocusMode(false);
  } else if (/^Digit[1-9]$/.test(e.code)) {
    const sound = asmrSounds[Number(e.code.slice(5)) - 1];
    if (sound) toggleSoundSwitch(sound.id);
  }
}

// ==========================================================================
// 7. 오디오 제어 핵심 함수
// ==========================================================================

function playAllSounds() {
  if (isFadingOut) resetFadeOutVolume();
  asmrSounds.forEach((sound) => setSoundPlaying(sound, true));
  renderStatus(); saveSettings();
}

/**
 * @param {boolean} [persist=true] - false면 '모두 꺼짐'을 저장하지 않습니다.
 *   (취침 타이머 종료처럼 잠시 멈춘 경우, 다음 방문 때 원래 켜둔 소리가 그대로 나오도록)
 */
function stopAllSounds(persist = true) {
  // 무엇이 켜져 있었는지 기억해 두었다가 Space/재생 키로 그대로 되살림
  const playing = asmrSounds.filter((s) => s.isPlaying).map((s) => s.id);
  if (playing.length) pausedSoundIds = playing;
  asmrSounds.forEach((sound) => setSoundPlaying(sound, false));
  if (isFadingOut) {
    // 타이머 페이드 중이었다면 소리가 완전히 멈춘 뒤에 볼륨을 되돌림 (꺼지는 도중 다시 커지는 것 방지)
    setTimeout(() => { if (!asmrSounds.some((s) => s.isPlaying)) resetFadeOutVolume(); }, FADE_OUT_STOP_SEC * 1000);
  } else {
    resetFadeOutVolume();
  }
  renderStatus();
  if (persist) saveSettings();
}

// 스페이스바 / 잠금화면 재생·일시정지에서 쓰는 '일시정지 → 다시 재생'.
// 전체 재생과 달리, 멈추기 직전에 켜져 있던 소리만 다시 켭니다.
let pausedSoundIds = [];

function pausePlayback() {
  stopAllSounds(false);
}

function resumePlayback() {
  if (!currentThemeId) return;
  if (isFadingOut) resetFadeOutVolume();
  const remembered = pausedSoundIds.filter((id) => asmrSounds.some((s) => s.id === id));
  // 기억한 게 없으면: 일반 테마는 전부 켜고, MY MIX는 15개를 한꺼번에 켜지 않고 고르도록 안내
  if (!remembered.length && currentThemeId === CUSTOM_THEME_ID) {
    toggleSettingsDrawer(true);
    showToast(t('customHint'));
    return;
  }
  const ids = remembered.length ? remembered : asmrSounds.map((s) => s.id);
  asmrSounds.forEach((sound) => { if (ids.includes(sound.id)) setSoundPlaying(sound, true); });
  renderStatus(); saveSettings();
}

function togglePlayback() {
  if (asmrSounds.some((s) => s.isPlaying)) pausePlayback();
  else resumePlayback();
}

function toggleSoundSwitch(soundId) {
  const sound = asmrSounds.find(s => s.id === soundId);
  if (!sound) return;
  if (isFadingOut) resetFadeOutVolume();
  setSoundPlaying(sound, !sound.isPlaying);
  renderStatus(); saveSettings();
}

function updateVolume(soundId, newVolume) {
  const sound = asmrSounds.find(s => s.id === soundId);
  if (sound) {
    sound.volume = newVolume;
    applyGain(sound);
    saveSettings();
  }
}

function updateMasterVolume(newMasterVolume) {
  masterVolume = newMasterVolume;
  syncAllAudioVolumes();
  saveSettings();
}

// ==========================================================================
// 8. 취침 타이머 (직접 입력 + 빠른 선택, 마지막 1분 페이드아웃)
// ==========================================================================

const TIMER_FADE_MAX_SEC = 60;  // 종료 전 최대 60초에 걸쳐 서서히 줄어듦
const TIMER_FADE_TAU = 0.6;     // 1초마다 갱신되는 볼륨을 계단 없이 이어줌
let timerFadeWindow = TIMER_FADE_MAX_SEC;

function handleStartTimer() {
  const timerInput = document.getElementById('timer-input');
  if (!timerInput) return;
  const valueString = timerInput.value.trim();
  if (valueString === '') return;
  const minutes = parseInt(valueString, 10);
  if (isNaN(minutes) || minutes <= 0) return;
  startAudioTimer(minutes);
}

function startAudioTimer(minutes) {
  clearAllIntervals(); resetFadeOutVolume();
  setTimerControlsDisabled(true);
  timerSecondsRemaining = minutes * 60;
  timerFadeWindow = Math.min(TIMER_FADE_MAX_SEC, timerSecondsRemaining);
  timerState = 'running';
  updateTimerDisplay();

  countdownIntervalId = setInterval(() => {
    timerSecondsRemaining--;
    updateTimerDisplay();
    if (timerSecondsRemaining <= timerFadeWindow && timerSecondsRemaining > 0) applyFadeOutEffect();
    if (timerSecondsRemaining <= 0) {
      clearAllIntervals();
      pausePlayback(); // 켜둔 소리 기록은 남겨 두고 정지 (스페이스/재생 키로 그대로 이어 듣기)
      setTimerControlsDisabled(false);
      timerState = 'done';
      updateTimerDisplay();
    }
  }, 1000);
}

function handleCancelTimer() {
  clearAllIntervals(); resetFadeOutVolume();
  setTimerControlsDisabled(false);
  const timerInput = document.getElementById('timer-input');
  if (timerInput) timerInput.value = '';
  timerState = 'idle';
  updateTimerDisplay();
}

function setTimerControlsDisabled(disabled) {
  const timerInput = document.getElementById('timer-input');
  const timerStartBtn = document.getElementById('btn-timer-start');
  if (timerInput) timerInput.disabled = disabled;
  if (timerStartBtn) timerStartBtn.disabled = disabled;
  document.querySelectorAll('.btn-timer-preset').forEach((btn) => { btn.disabled = disabled; });
}

/**
 * 타이머 페이드아웃 적용
 */
function applyFadeOutEffect() { isFadingOut = true; syncAllAudioVolumes(TIMER_FADE_TAU); }
function resetFadeOutVolume() { isFadingOut = false; syncAllAudioVolumes(); }
function clearAllIntervals() { if (countdownIntervalId) { clearInterval(countdownIntervalId); countdownIntervalId = null; } }

function formatTime(totalSeconds) {
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

let timerState = 'idle'; // idle | running | done

function updateTimerDisplay() {
  const displayElement = document.getElementById('timer-display');
  if (!displayElement) return;
  const time = timerState === 'running' ? formatTime(timerSecondsRemaining)
    : t(timerState === 'done' ? 'timerDone' : 'timerIdle');
  displayElement.textContent = t('timeLeft', { time });
}

/**
 * 설정 서랍 열기/닫기. 닫혀 있을 땐 inert로 Tab 포커스가 화면 밖 서랍으로 들어가지 않게 하고,
 * 열면 서랍 안으로, 닫으면 서랍을 열었던 버튼으로 포커스를 돌려줍니다.
 */
let drawerOpener = null;

function toggleSettingsDrawer(isOpen) {
  const drawerElement = document.getElementById('settings-drawer');
  if (!drawerElement) return;
  const open = typeof isOpen === 'boolean' ? isOpen : !drawerElement.classList.contains('active');
  const wasOpen = drawerElement.classList.contains('active');

  drawerElement.classList.toggle('active', open);
  drawerElement.inert = !open;
  ['btn-drawer-toggle', 'btn-drawer-toggle-focus'].forEach((id) => {
    document.getElementById(id).setAttribute('aria-expanded', String(open));
  });

  if (open && !wasOpen) {
    drawerOpener = document.activeElement;
    document.getElementById('btn-drawer-close').focus({ preventScroll: true });
  } else if (!open && wasOpen && drawerOpener && document.contains(drawerOpener)) {
    drawerOpener.focus({ preventScroll: true });
    drawerOpener = null;
  }
}

// ==========================================================================
// 9. Focus Mode (UI 개별 가리기 및 일괄 복구) 제어
// ==========================================================================

/**
 * [디테일 패키지 5] 전체 UI 숨기기 (몰입 모드) 토글 제어 함수
 * @param {boolean} active - 몰입 모드 활성화 여부
 */
function enableFocusMode(active) {
  const mixerPage = document.getElementById('mixer-page');
  const focusOverlay = document.getElementById('focus-overlay-controls');

  if (active) {
    if (mixerPage) mixerPage.classList.add('focus-mode-active');
    if (focusOverlay) focusOverlay.style.display = 'flex';
    // 브라우저 전체화면도 함께 시도 (지원하지 않는 기기에선 화면 안에서만 몰입 모드)
    const root = document.documentElement;
    if (!document.fullscreenElement && root.requestFullscreen) root.requestFullscreen().catch(() => {});
    wakeFocusControls();
  } else {
    if (mixerPage) mixerPage.classList.remove('focus-mode-active', 'ui-idle');
    if (focusOverlay) focusOverlay.style.display = 'none';
    clearTimeout(focusIdleTimer);
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
  }
}

function isFocusMode() {
  return document.getElementById('mixer-page').classList.contains('focus-mode-active');
}

// 몰입 모드에서 마우스/터치가 멈추면 2.5초 뒤 버튼과 커서를 숨깁니다.
const FOCUS_IDLE_MS = 2500;
let focusIdleTimer = null;

function wakeFocusControls() {
  if (!isFocusMode()) return;
  const mixerPage = document.getElementById('mixer-page');
  mixerPage.classList.remove('ui-idle');
  clearTimeout(focusIdleTimer);
  focusIdleTimer = setTimeout(() => mixerPage.classList.add('ui-idle'), FOCUS_IDLE_MS);
}

/**
 * 캔버스 해상도를 실제 표시 크기에 맞춰 왜곡 없이 그려지도록 보정합니다.
 * (몰입 모드에서는 CSS로 멍 공간이 전체화면이 되므로 같은 함수로 처리)
 */
function resizeCanvasToContainer() {
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;
  canvas.width = Math.round(rect.width);
  canvas.height = Math.round(rect.height);
}

// 창 크기 변경, 몰입 모드 전환 애니메이션 등 표시 크기가 바뀔 때마다 자동으로 맞춤
new ResizeObserver(resizeCanvasToContainer).observe(document.getElementById('mung-canvas'));

// ==========================================================================
// 10. 제네러티브 노이즈 라인 웨이브 드로잉 시스템
// ==========================================================================
const canvas = document.getElementById('mung-canvas');
const ctx = canvas.getContext('2d');

let canvasAnimId = null;
let timeRotation = 0;

/**
 * 테마에 최적화된 노이즈 아트 캔버스 루프 시각화를 개시합니다.
 */
function initCanvasEffect(themeId) {
  cancelAnimationFrame(canvasAnimId);
  runCanvasLoop();
}

/**
 * 파형 애니메이션 루프
 */
function runCanvasLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  timeRotation += 0.012;
  ctx.lineWidth = 1.0;
  
  if (ambientTheme === 'nature') {
    // 🌳 자연: 잔잔하게 중첩되어 요동치는 3가닥 유기적 호흡선
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(250, 250, 249, ${0.12 - i * 0.03})`;
      for (let x = 0; x < canvas.width; x++) {
        const wave = Math.sin(x * 0.02 + timeRotation + i * 1.2) * Math.cos(x * 0.006 - timeRotation * 0.4);
        const y = canvas.height / 2 + wave * (40 + i * 12);
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  } else if (ambientTheme === 'fantasy') {
    // 🔮 판타지: 기하학적으로 미세하게 궤도를 회전하는 4중 동심 오라 원선
    ctx.strokeStyle = 'rgba(250, 250, 249, 0.06)';
    for (let r = 0; r < 4; r++) {
      ctx.beginPath();
      const radius = 35 + r * 22 + Math.sin(timeRotation + r) * 5;
      ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.fillStyle = 'rgba(250, 250, 249, 0.25)';
      const oX = canvas.width / 2 + Math.cos(timeRotation + r * 1.3) * radius;
      const oY = canvas.height / 2 + Math.sin(timeRotation + r * 1.3) * radius;
      ctx.arc(oX, oY, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (ambientTheme === 'ocean') {
    // 🌊 바다: 8초 주기로 부풀었다 가라앉는 겹겹의 수평 물결 (사운드의 파도 주기와 동일)
    const swell = 0.6 + 0.4 * Math.sin((performance.now() / 1000) * (Math.PI * 2 / 8));
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(170, 205, 255, ${0.14 - i * 0.022})`;
      const baseY = canvas.height * (0.42 + i * 0.09);
      for (let x = 0; x <= canvas.width; x += 2) {
        const y = baseY + Math.sin(x * (0.012 + i * 0.003) - timeRotation * (1.2 - i * 0.15) + i) * (6 + i * 2) * swell;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  } else if (ambientTheme === 'space') {
    // 🪐 우주: 기울어진 궤도를 도는 위성과 은은한 행성 테두리
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const R = Math.min(canvas.width, canvas.height) * 0.16;
    ctx.strokeStyle = 'rgba(200, 210, 255, 0.10)';
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    for (let o = 0; o < 3; o++) {
      const rx = R * (1.8 + o * 0.7), ry = rx * 0.28, tilt = -0.35 + o * 0.25;
      ctx.beginPath();
      ctx.strokeStyle = `rgba(200, 210, 255, ${0.07 - o * 0.015})`;
      ctx.ellipse(cx, cy, rx, ry, tilt, 0, Math.PI * 2);
      ctx.stroke();
      const a = timeRotation * (0.9 - o * 0.25) + o * 2.1;
      const px = cx + rx * Math.cos(a) * Math.cos(tilt) - ry * Math.sin(a) * Math.sin(tilt);
      const py = cy + rx * Math.cos(a) * Math.sin(tilt) + ry * Math.sin(a) * Math.cos(tilt);
      ctx.beginPath();
      ctx.fillStyle = 'rgba(235, 240, 255, 0.6)';
      ctx.arc(px, py, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // 👻 공포: 중앙에서 날카롭게 심장박동처럼 튀는 노이즈 글리치 맥박선
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.12)';
    const pulseStart = canvas.width * 0.32;
    const pulseEnd = canvas.width * 0.68;
    for (let x = 0; x < canvas.width; x++) {
      let pulseNoise = 0;
      if (x > pulseStart && x < pulseEnd) {
        pulseNoise = Math.sin(x * 0.25 + timeRotation * 10) * Math.cos(x * 0.07) * 16;
      }
      const y = canvas.height / 2 + pulseNoise + (Math.random() - 0.5) * 1.2;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // '동작 줄이기' 설정 사용자에게는 한 장면만 그리고 멈춤
  if (!prefersReducedMotion) canvasAnimId = requestAnimationFrame(runCanvasLoop);
}

// ==========================================================================
// 10-2. 테마별 배경 분위기 입자 (반딧불 / 별·반짝임 / 안개)
// ==========================================================================
const ambientCanvas = document.getElementById('ambient-canvas');
const ambientCtx = ambientCanvas.getContext('2d');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let ambientTheme = '';
let ambientParticles = [];
let ambientAnimId = null;

function rand(min, max) { return min + Math.random() * (max - min); }

function resizeAmbientCanvas() {
  ambientCanvas.width = window.innerWidth;
  ambientCanvas.height = window.innerHeight;
}
window.addEventListener('resize', () => { resizeAmbientCanvas(); spawnAmbientParticles(); });
resizeAmbientCanvas();

/** 화면 넓이에 비례해 입자 수를 정하고 테마별 입자를 새로 뿌립니다. */
function spawnAmbientParticles() {
  const w = ambientCanvas.width, h = ambientCanvas.height;
  const scale = Math.min(1.5, (w * h) / (1280 * 720));
  ambientParticles = [];

  if (ambientTheme === 'nature') {
    // 반딧불: 천천히 떠다니며 깜빡이는 따뜻한 빛
    for (let i = 0; i < Math.round(26 * scale); i++) {
      ambientParticles.push({
        x: rand(0, w), y: rand(h * 0.35, h), r: rand(1.2, 2.4),
        vx: rand(-0.15, 0.15), vy: rand(-0.12, 0.08),
        phase: rand(0, Math.PI * 2), speed: rand(0.6, 1.4)
      });
    }
  } else if (ambientTheme === 'fantasy') {
    // 반짝이는 별(고정) + 위로 떠오르는 마법 가루
    for (let i = 0; i < Math.round(90 * scale); i++) {
      ambientParticles.push({ kind: 'star', x: rand(0, w), y: rand(0, h * 0.6), r: rand(0.4, 1.3), phase: rand(0, 6.3), speed: rand(0.5, 2) });
    }
    const hues = [270, 300, 190];
    for (let i = 0; i < Math.round(28 * scale); i++) {
      ambientParticles.push({
        kind: 'dust', x: rand(0, w), y: rand(0, h), r: rand(0.8, 2),
        vx: rand(-0.1, 0.1), vy: rand(-0.35, -0.1), hue: hues[i % hues.length],
        phase: rand(0, 6.3), speed: rand(0.8, 1.6)
      });
    }
  } else if (ambientTheme === 'ocean') {
    // 하늘의 희미한 별 + 수면 위 달빛 반사 지점에서 반짝이는 물비늘
    for (let i = 0; i < Math.round(50 * scale); i++) {
      ambientParticles.push({ kind: 'star', x: rand(0, w), y: rand(0, h * 0.5), r: rand(0.3, 1), phase: rand(0, 6.3), speed: rand(0.3, 1.2) });
    }
    for (let i = 0; i < Math.round(70 * scale); i++) {
      const depth = rand(0, 1); // 0 = 수평선, 1 = 화면 아래
      ambientParticles.push({
        kind: 'glint', baseX: w * 0.74, spread: w * (0.01 + depth * 0.09),
        y: h * (0.58 + depth * 0.42), r: 0.6 + depth * 1.4,
        offset: rand(-1, 1), phase: rand(0, 6.3), speed: rand(1.5, 4)
      });
    }
  } else if (ambientTheme === 'space') {
    // 세 겹의 별 (멀수록 느리게 흐름) + 가끔 지나가는 별똥별
    for (let i = 0; i < Math.round(220 * scale); i++) {
      const layer = i % 3;
      ambientParticles.push({
        kind: 'star', x: rand(0, w), y: rand(0, h), r: [0.4, 0.8, 1.3][layer],
        vx: [0.02, 0.05, 0.1][layer], phase: rand(0, 6.3), speed: rand(0.3, 1.5),
        hue: [220, 260, 30][i % 3]
      });
    }
  } else if (ambientTheme === 'horror') {
    // 낮게 깔려 흘러가는 안개 덩어리
    for (let i = 0; i < Math.round(9 * scale); i++) {
      ambientParticles.push({ x: rand(-200, w + 200), y: rand(h * 0.45, h * 1.05), r: rand(180, 380), vx: rand(0.08, 0.3) * (Math.random() < 0.5 ? -1 : 1), alpha: rand(0.07, 0.13) });
    }
  }
}

function drawAmbient(time) {
  const w = ambientCanvas.width, h = ambientCanvas.height;
  const t = time / 1000;
  ambientCtx.clearRect(0, 0, w, h);

  if (ambientTheme === 'nature') {
    ambientCtx.globalCompositeOperation = 'lighter';
    ambientParticles.forEach((p) => {
      p.x += p.vx + Math.sin(t * 0.5 + p.phase) * 0.12;
      p.y += p.vy + Math.cos(t * 0.4 + p.phase) * 0.1;
      if (p.x < -10) p.x = w + 10; if (p.x > w + 10) p.x = -10;
      if (p.y < h * 0.25) p.vy = Math.abs(p.vy); if (p.y > h + 10) p.vy = -Math.abs(p.vy);
      const glow = Math.max(0, Math.sin(t * p.speed + p.phase)) ** 2;
      drawGlow(p.x, p.y, p.r * 6, `rgba(210, 255, 140, ${0.22 * glow})`);
      drawDot(p.x, p.y, p.r, `rgba(240, 255, 200, ${0.15 + 0.75 * glow})`);
    });
  } else if (ambientTheme === 'fantasy') {
    ambientCtx.globalCompositeOperation = 'lighter';
    ambientParticles.forEach((p) => {
      const tw = 0.5 + 0.5 * Math.sin(t * p.speed + p.phase);
      if (p.kind === 'star') {
        drawDot(p.x, p.y, p.r, `rgba(235, 225, 255, ${0.15 + 0.6 * tw})`);
      } else {
        p.x += p.vx + Math.sin(t + p.phase) * 0.15;
        p.y += p.vy;
        if (p.y < -10) { p.y = h + 10; p.x = rand(0, w); }
        drawGlow(p.x, p.y, p.r * 5, `hsla(${p.hue}, 90%, 70%, ${0.18 * tw})`);
        drawDot(p.x, p.y, p.r, `hsla(${p.hue}, 100%, 85%, ${0.3 + 0.6 * tw})`);
      }
    });
  } else if (ambientTheme === 'ocean') {
    ambientCtx.globalCompositeOperation = 'lighter';
    ambientParticles.forEach((p) => {
      const tw = Math.max(0, Math.sin(t * p.speed + p.phase));
      if (p.kind === 'star') {
        drawDot(p.x, p.y, p.r, `rgba(220, 230, 255, ${0.1 + 0.4 * tw})`);
      } else {
        // 물결 따라 좌우로 살짝 흔들리는 반짝임
        const x = p.baseX + p.offset * p.spread + Math.sin(t * 0.8 + p.phase) * p.spread * 0.3;
        drawDot(x, p.y, p.r, `rgba(215, 230, 255, ${0.55 * tw ** 3})`);
      }
    });
  } else if (ambientTheme === 'space') {
    ambientCtx.globalCompositeOperation = 'lighter';
    ambientParticles.forEach((p) => {
      p.x -= p.vx;
      if (p.x < -2) p.x = w + 2;
      const tw = 0.55 + 0.45 * Math.sin(t * p.speed + p.phase);
      drawDot(p.x, p.y, p.r, `hsla(${p.hue}, 70%, 88%, ${0.25 + 0.6 * tw})`);
    });
    drawShootingStar(t, w, h);
  } else if (ambientTheme === 'horror') {
    ambientCtx.globalCompositeOperation = 'source-over';
    ambientParticles.forEach((p) => {
      p.x += p.vx;
      if (p.x - p.r > w) p.x = -p.r; if (p.x + p.r < 0) p.x = w + p.r;
      const breathe = 0.75 + 0.25 * Math.sin(t * 0.3 + p.r);
      drawGlow(p.x, p.y, p.r, `rgba(190, 195, 205, ${p.alpha * breathe})`);
    });
  }

  ambientAnimId = requestAnimationFrame(drawAmbient);
}

// 별똥별: 대략 6~14초에 한 번, 0.9초 동안 사선으로 지나감
let shootingStar = null;
let nextShootingStarAt = 0;

function drawShootingStar(t, w, h) {
  if (!shootingStar && t > nextShootingStarAt) {
    shootingStar = { start: t, x: rand(w * 0.2, w), y: rand(0, h * 0.4), len: rand(80, 160), angle: rand(2.4, 2.7) };
    nextShootingStarAt = t + rand(6, 14);
  }
  if (!shootingStar) return;
  const k = (t - shootingStar.start) / 0.9;
  if (k >= 1) { shootingStar = null; return; }
  const dist = k * 260;
  const hx = shootingStar.x + Math.cos(shootingStar.angle) * dist;
  const hy = shootingStar.y + Math.sin(shootingStar.angle) * dist;
  const tx = hx - Math.cos(shootingStar.angle) * shootingStar.len;
  const ty = hy - Math.sin(shootingStar.angle) * shootingStar.len;
  const g = ambientCtx.createLinearGradient(hx, hy, tx, ty);
  const alpha = Math.sin(k * Math.PI) * 0.8;
  g.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
  g.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ambientCtx.strokeStyle = g;
  ambientCtx.lineWidth = 1.2;
  ambientCtx.beginPath(); ambientCtx.moveTo(hx, hy); ambientCtx.lineTo(tx, ty); ambientCtx.stroke();
}

function drawDot(x, y, r, color) {
  ambientCtx.beginPath();
  ambientCtx.fillStyle = color;
  ambientCtx.arc(x, y, r, 0, Math.PI * 2);
  ambientCtx.fill();
}

/** 중심에서 가장자리로 투명해지는 부드러운 빛 덩어리 */
function drawGlow(x, y, r, color) {
  const g = ambientCtx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ambientCtx.fillStyle = g;
  ambientCtx.fillRect(x - r, y - r, r * 2, r * 2);
}

/**
 * 배경 색감(body 클래스)과 입자 레이어를 테마에 맞게 바꿉니다.
 * @param {string} themeId - BACKDROP_THEMES 중 하나 | '' (테마 선택 화면)
 */
function setAmbientTheme(themeId) {
  BACKDROP_THEMES.forEach((id) => document.body.classList.remove(`theme-${id}`));
  if (themeId) document.body.classList.add(`theme-${themeId}`);

  ambientTheme = themeId;
  cancelAnimationFrame(ambientAnimId);
  ambientAnimId = null;
  ambientCtx.clearRect(0, 0, ambientCanvas.width, ambientCanvas.height);
  if (prefersReducedMotion && currentThemeId) runCanvasLoop(); // 멍 화면 정지 장면을 새 배경으로 다시 그림
  if (!themeId || prefersReducedMotion) return;

  spawnAmbientParticles();
  ambientAnimId = requestAnimationFrame(drawAmbient);
}

// ==========================================================================
// 11. 이벤트 바인딩 및 어플리케이션 진입점
// ==========================================================================

// ==========================================================================
// 12. [디테일 패키지 4] 웹사이트 공유 및 감성 토스트 시스템
// ==========================================================================

/** 해시(#mix=...)를 뺀 사이트 기본 주소 */
function siteUrl() {
  return window.location.href.split('#')[0];
}

/**
 * 주소를 네이티브 공유 다이얼로그로 공유하거나, 미지원 환경 시 클립보드로 복사합니다.
 * @param {string} [url] - 공유할 주소 (기본: 사이트 주소)
 * @param {string} [text] - 공유 문구
 */
async function shareWebsite(url = siteUrl(), text = t('shareSiteText')) {
  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    showToast(t('linkCopied'));
  };

  try {
    if (navigator.share) await navigator.share({ title: 'Mute — Quietude Ambient Mixer', text, url });
    else await copyLink();
  } catch (err) {
    if (err.name === 'AbortError') return; // 사용자가 공유 창을 닫음
    try { await copyLink(); } catch (clipErr) { console.error('[클립보드 복사 실패]', clipErr); }
  }
}

// ==========================================================================
// 12-2. 내 믹스(프리셋) 저장 & 믹스 링크 공유
// ==========================================================================

const PRESET_STORAGE_KEY = 'mute_presets';  // { [themeId]: [{ name, master, sounds: [{ id, volume, on }] }] }

function readPresets() {
  try { return JSON.parse(localStorage.getItem(PRESET_STORAGE_KEY)) || {}; } catch (e) { return {}; }
}

function writePresets(all) {
  try { localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(all)); } catch (e) { console.error(e); }
}

function clamp01(v) { return Math.max(0, Math.min(1, Number(v) || 0)); }

/** 지금 믹서 상태를 그대로 담은 객체 (MY MIX는 배경도 함께) */
function captureMix() {
  const mix = {
    master: masterVolume,
    sounds: asmrSounds.map((s) => ({ id: s.id, volume: s.volume, on: s.isPlaying }))
  };
  if (currentThemeId === CUSTOM_THEME_ID) mix.backdrop = customBackdrop;
  return mix;
}

/** 저장된/공유받은 믹스를 현재 테마 믹서에 적용합니다. */
function applyMix(mix) {
  if (isFadingOut) resetFadeOutVolume();
  if (mix.backdrop) {
    changeCustomBackdrop(mix.backdrop);
    document.getElementById('backdrop-select').value = customBackdrop;
  }
  if (typeof mix.master === 'number') {
    masterVolume = clamp01(mix.master);
    document.getElementById('master-volume').value = masterVolume;
  }
  mix.sounds.forEach((m) => {
    const sound = asmrSounds.find((s) => s.id === m.id);
    if (!sound) return;
    sound.volume = clamp01(m.volume);
    const slider = document.getElementById(`volume-${sound.id}`);
    if (slider) slider.value = sound.volume;
    setSoundPlaying(sound, !!m.on);
  });
  syncAllAudioVolumes(); renderStatus(); saveSettings();
}

function savePreset(name) {
  const all = readPresets();
  const list = all[currentThemeId] || [];
  const preset = { name, ...captureMix() };
  const existing = list.findIndex((p) => p.name === name);
  if (existing >= 0) list[existing] = preset; else list.push(preset);
  all[currentThemeId] = list;
  writePresets(all);
  renderPresets();
  showToast(t(existing >= 0 ? 'presetOverwritten' : 'presetSaved', { name }));
}

function deletePreset(index) {
  const all = readPresets();
  const list = all[currentThemeId] || [];
  const [removed] = list.splice(index, 1);
  all[currentThemeId] = list;
  writePresets(all);
  renderPresets();
  if (removed) showToast(t('presetDeleted', { name: removed.name }));
}

/** 현재 테마의 저장된 믹스 목록을 그립니다. (이름은 textContent로 넣어 안전하게) */
function renderPresets() {
  const listEl = document.getElementById('preset-list');
  if (!listEl) return;
  listEl.innerHTML = '';
  const list = readPresets()[currentThemeId] || [];

  if (list.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'preset-empty';
    empty.textContent = t('presetEmpty');
    listEl.appendChild(empty);
    return;
  }

  list.forEach((preset, index) => {
    const li = document.createElement('li');
    const load = document.createElement('button');
    load.type = 'button';
    load.className = 'btn-preset-load';
    load.textContent = preset.name;
    load.addEventListener('click', () => { applyMix(preset); showToast(t('presetLoaded', { name: preset.name })); });

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'btn-preset-delete';
    del.setAttribute('aria-label', t('deletePreset', { name: preset.name }));
    del.textContent = '×';
    del.addEventListener('click', () => deletePreset(index));

    li.append(load, del);
    listEl.appendChild(li);
  });
}

/**
 * 믹스를 짧은 주소 해시로 바꿉니다.  예) #mix=nature.100.50,30x,70
 * 테마.마스터볼륨(%).각 소리 볼륨(%) — 꺼진 소리는 뒤에 x
 * MY MIX는 끝에 배경 테마가 붙습니다.  예) #mix=custom.100.50x,...,40.ocean
 */
function encodeMixHash() {
  const vols = asmrSounds.map((s) => `${Math.round(s.volume * 100)}${s.isPlaying ? '' : 'x'}`).join(',');
  const backdrop = currentThemeId === CUSTOM_THEME_ID ? `.${customBackdrop}` : '';
  return `#mix=${currentThemeId}.${Math.round(masterVolume * 100)}.${vols}${backdrop}`;
}

/** 주소의 #mix=... 를 읽어 { themeId, mix } 로 돌려줍니다. 형식이 틀리면 null. */
function parseMixHash(hash) {
  const match = /^#mix=([a-z]+)\.(\d{1,3})\.([\dx,]+)(?:\.([a-z]+))?$/.exec(hash || '');
  if (!match || !themeData[match[1]]) return null;
  const themeId = match[1];
  const parts = match[3].split(',');
  const sounds = themeData[themeId].sounds.map((info, i) => {
    const part = parts[i] || '0x';
    return { id: info.id, volume: clamp01(parseInt(part, 10) / 100), on: !part.endsWith('x') };
  });
  const mix = { master: clamp01(parseInt(match[2], 10) / 100), sounds };
  if (themeId === CUSTOM_THEME_ID && BACKDROP_THEMES.includes(match[4])) mix.backdrop = match[4];
  return { themeId, mix };
}

function shareCurrentMix() {
  const theme = themeData[currentThemeId];
  shareWebsite(siteUrl() + encodeMixHash(), t('shareMixText', { theme: `${theme.title} · ${theme.bgName}` }));
}

/** 공유 링크로 들어왔으면 테마 선택 화면에 '들어보기' 배너를 띄웁니다. */
function checkSharedMixLink() {
  const shared = parseMixHash(window.location.hash);
  const banner = document.getElementById('shared-mix-banner');
  if (!shared || !banner) return;

  // 이미 믹서를 듣는 중에 링크가 바뀐 경우: 이미 사용자 조작이 있었으므로 바로 적용
  if (currentThemeId) {
    history.replaceState(null, '', siteUrl());
    selectTheme(shared.themeId);
    applyMix(shared.mix);
    showToast(t('sharedMixLoaded', { theme: themeData[shared.themeId].title }));
    return;
  }

  document.getElementById('shared-mix-text').textContent = t('sharedMix', { theme: themeData[shared.themeId].title });
  banner.hidden = false;

  const clearHash = () => {
    banner.hidden = true;
    history.replaceState(null, '', siteUrl());
  };
  document.getElementById('btn-shared-mix-play').onclick = () => {
    clearHash();
    selectTheme(shared.themeId);
    applyMix(shared.mix);
  };
  document.getElementById('btn-shared-mix-dismiss').onclick = clearHash;
}

/**
 * 하단에 부드럽게 떠오르는 미니멀 반투명 토스트 메시지 렌더러
 */
function showToast(message) {
  const existingToast = document.getElementById('mute-toast');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.id = 'mute-toast';
  toast.className = 'mute-toast';
  toast.setAttribute('aria-hidden', 'true'); // 읽어주기는 아래 상시 알림 영역이 담당
  toast.textContent = message;
  document.body.appendChild(toast);

  // 화면 낭독기 알림: 내용을 비웠다가 다시 넣어야 같은 문구도 다시 읽어줌
  const announcer = document.getElementById('sr-announcer');
  if (announcer) {
    announcer.textContent = '';
    setTimeout(() => { announcer.textContent = message; }, 50);
  }

  // 브라우저 렌더링 동기화를 위한 미세 딜레이
  setTimeout(() => {
    toast.classList.add('show');
  }, 30);

  // 2.5초 노출 후 스르륵 제거
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 350);
  }, 2500);
}

/** 언어 전환: 정적 문구 + 지금 화면에 그려진 동적 문구를 모두 다시 그립니다. */
function switchLanguage() {
  setLanguage(currentLang === 'ko' ? 'en' : 'ko');
  renderResumeButton();
  updateTimerDisplay();
  if (currentThemeId) {
    renderThemeTexts();
    renderAudioControls();
    renderPresets();
  }
  const banner = document.getElementById('shared-mix-banner');
  const shared = parseMixHash(window.location.hash);
  if (!banner.hidden && shared) {
    document.getElementById('shared-mix-text').textContent = t('sharedMix', { theme: themeData[shared.themeId].title });
  }
}

function setupEventListeners() {
  // 테마 카드 & 이어 듣기 (data-theme 값으로 테마를 엶)
  document.querySelectorAll('.btn-theme-select, #btn-resume-last').forEach((btn) => {
    btn.addEventListener('click', () => selectTheme(btn.dataset.theme));
  });
  document.getElementById('btn-theme-back').addEventListener('click', goToThemeSelectPage);

  // 언어 전환 (첫 화면 우측 상단 / 설정 서랍 하단)
  document.getElementById('btn-lang').addEventListener('click', switchLanguage);
  document.getElementById('btn-lang-drawer').addEventListener('click', switchLanguage);

  // MY MIX 배경 고르기
  document.getElementById('backdrop-select').addEventListener('change', (e) => changeCustomBackdrop(e.target.value));
  document.getElementById('btn-play-all').addEventListener('click', playAllSounds);
  document.getElementById('btn-stop-all').addEventListener('click', () => stopAllSounds());

  document.getElementById('master-volume').addEventListener('input', (e) => {
    updateMasterVolume(parseFloat(e.target.value));
  });

  document.getElementById('btn-timer-start').addEventListener('click', handleStartTimer);
  document.getElementById('btn-timer-cancel').addEventListener('click', handleCancelTimer);
  document.getElementById('btn-drawer-toggle').addEventListener('click', () => toggleSettingsDrawer());
  document.getElementById('btn-drawer-close').addEventListener('click', () => toggleSettingsDrawer(false));

  // [디테일 패키지 4] 웹사이트 공유 단추 리스너 연결
  const btnShareMain = document.getElementById('btn-share-main');
  const btnShareMixer = document.getElementById('btn-share-mixer');
  if (btnShareMain) btnShareMain.addEventListener('click', () => shareWebsite());
  if (btnShareMixer) btnShareMixer.addEventListener('click', shareCurrentMix);

  // 내 믹스 저장
  document.getElementById('preset-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('preset-name');
    const name = input.value.trim();
    if (!name) { input.focus(); return; }
    savePreset(name);
    input.value = '';
  });

  // [디테일 패키지 5] 전체화면 멍 (몰입 모드) 토글 리스너 연결
  const btnFocusToggle = document.getElementById('btn-focus-toggle');
  const btnFocusRestore = document.getElementById('btn-focus-restore');
  const btnDrawerToggleFocus = document.getElementById('btn-drawer-toggle-focus');

  if (btnFocusToggle) btnFocusToggle.addEventListener('click', () => enableFocusMode(true));
  if (btnFocusRestore) btnFocusRestore.addEventListener('click', () => enableFocusMode(false));
  if (btnDrawerToggleFocus) btnDrawerToggleFocus.addEventListener('click', () => toggleSettingsDrawer());

  // 멍 공간 클릭(또는 키보드 Enter): 평소엔 몰입 모드 진입, 몰입 모드에선 해제
  const visualSpace = document.getElementById('visual-space-zone');
  visualSpace.addEventListener('click', () => enableFocusMode(!isFocusMode()));
  visualSpace.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); enableFocusMode(!isFocusMode()); }
  });

  // 몰입 모드에서 움직임이 있으면 숨겨진 버튼을 다시 보여줌
  ['mousemove', 'touchstart', 'keydown'].forEach((type) => {
    document.addEventListener(type, wakeFocusControls, { passive: true });
  });

  // 브라우저 Esc 등으로 전체화면이 풀리면 몰입 모드도 함께 해제
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && isFocusMode()) enableFocusMode(false);
  });

  // 타이머 빠른 선택
  document.querySelectorAll('.btn-timer-preset').forEach((btn) => {
    btn.addEventListener('click', () => startAudioTimer(Number(btn.dataset.minutes)));
  });

  document.addEventListener('keydown', handleShortcutKey);
  setupMediaSessionHandlers();
}

// 오프라인 재생을 위한 서비스 워커 등록 (sw.js)
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((err) => console.warn('[서비스 워커 등록 실패]', err));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  applyStaticI18n();
  renderResumeButton();
  updateTimerDisplay();
  setupEventListeners();
  checkSharedMixLink();
  window.addEventListener('hashchange', checkSharedMixLink);
});