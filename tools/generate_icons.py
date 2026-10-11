"""
MUTE-WEB 앱 아이콘 생성기 (홈 화면 설치용 PWA 아이콘)

어두운 배경 위에 은은한 보랏빛 빛무리와 동심원 파문을 그립니다.
중요한 그림은 가운데 60% 안에만 두어, 원형/둥근 사각형으로 잘려도(maskable) 안전합니다.

필요 패키지: numpy, pillow
실행: python tools/generate_icons.py
"""
import os
import numpy as np
from PIL import Image

OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'icons')

BG = np.array([7, 7, 10], dtype=float)
ACCENT = np.array([124, 106, 247], dtype=float)
LIGHT = np.array([248, 247, 245], dtype=float)


def render(size, supersample=4):
    s = size * supersample
    y, x = np.mgrid[0:s, 0:s] / s - 0.5
    r = np.sqrt(x ** 2 + y ** 2)  # 중심에서의 거리 (0 ~ 0.707)

    img = np.tile(BG, (s, s, 1))
    # 중심 빛무리
    glow = np.exp(-(r / 0.22) ** 2) * 0.55
    img += (ACCENT - BG) * glow[..., None]

    # 동심원 파문 (바깥으로 갈수록 희미하게)
    for radius, width, alpha in [(0.10, 0.012, 0.95), (0.17, 0.008, 0.55), (0.24, 0.006, 0.32), (0.30, 0.005, 0.18)]:
        ring = np.clip(1 - np.abs(r - radius) / width, 0, 1) * alpha
        img += (LIGHT - img) * ring[..., None]

    # 중심 점
    dot = np.clip(1 - r / 0.035, 0, 1) ** 0.5
    img += (LIGHT - img) * dot[..., None]

    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), 'RGB')
    return im.resize((size, size), Image.LANCZOS)


if __name__ == '__main__':
    os.makedirs(OUT_DIR, exist_ok=True)
    for name, size in [('icon-192.png', 192), ('icon-512.png', 512), ('apple-touch-icon.png', 180), ('favicon-32.png', 32)]:
        render(size).save(os.path.join(OUT_DIR, name), optimize=True)
        print(f'  {name}')
