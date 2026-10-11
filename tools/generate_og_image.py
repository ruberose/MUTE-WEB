"""
MUTE-WEB 공유 미리보기 이미지 생성기 (카카오톡·SNS 링크 미리보기용, 1200×630)

사이트 배경(숲) 위에 왼쪽은 제목·문구, 오른쪽은 앱 아이콘과 같은 동심원 파문을 그립니다.
결과: assets/images/og-image.jpg

필요 패키지: numpy, pillow
필요 서체: Noto Sans KR (Windows 기본 포함: C:/Windows/Fonts/NotoSansKR-VF.ttf)
실행: python tools/generate_og_image.py
"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
BG_PATH = os.path.join(ROOT, 'assets', 'images', 'background1.png')
OUT_PATH = os.path.join(ROOT, 'assets', 'images', 'og-image.jpg')
FONT_PATH = 'C:/Windows/Fonts/NotoSansKR-VF.ttf'

W, H = 1200, 630
ACCENT = np.array([124, 106, 247], dtype=float)
LIGHT = np.array([248, 247, 245], dtype=float)


def font(size, weight):
    f = ImageFont.truetype(FONT_PATH, size)
    try:
        f.set_variation_by_axes([weight])  # 가변 서체 굵기 (100~900)
    except Exception:
        pass
    return f


def background():
    """숲 배경을 1200×630으로 잘라 어둡게 하고, 왼쪽 글자 영역은 더 어둡게."""
    img = Image.open(BG_PATH).convert('RGB')
    scale = max(W / img.width, H / img.height)
    img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    left, top = (img.width - W) // 2, (img.height - H) // 2
    arr = np.asarray(img.crop((left, top, left + W, top + H)), dtype=float)

    x = np.linspace(0, 1, W)[None, :, None]
    y = np.linspace(0, 1, H)[:, None, None]
    shade = 0.55 + 0.35 * np.clip((x - 0.25) / 0.6, 0, 1)   # 왼쪽일수록 어둡게
    shade = shade * (1 - 0.25 * (np.abs(y - 0.5) * 2) ** 2)  # 위아래 가장자리 살짝 어둡게
    arr *= shade
    return arr


def draw_rings(arr, cx, cy, scale):
    """앱 아이콘과 같은 보랏빛 빛무리 + 동심원 파문"""
    yy, xx = np.mgrid[0:H, 0:W]
    r = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / scale
    glow = np.exp(-(r / 0.22) ** 2) * 0.5
    arr += (ACCENT - arr) * glow[..., None]
    for radius, width, alpha in [(0.10, 0.008, 0.9), (0.17, 0.006, 0.5), (0.24, 0.005, 0.3), (0.31, 0.004, 0.16), (0.38, 0.0035, 0.08)]:
        ring = np.clip(1 - np.abs(r - radius) / width, 0, 1) * alpha
        arr += (LIGHT - arr) * ring[..., None]
    dot = np.clip(1 - r / 0.03, 0, 1) ** 0.5
    arr += (LIGHT - arr) * dot[..., None]
    return arr


def main():
    arr = background()
    arr = draw_rings(arr, cx=900, cy=315, scale=560)
    img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), 'RGB')

    # 글자 (그림자를 살짝 깔아 어떤 배경에서도 읽히게)
    text_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(text_layer)
    x0 = 84

    def spaced(xy, text, f, fill, spacing):
        x, y = xy
        for ch in text:
            d.text((x, y), ch, font=f, fill=fill)
            x += d.textlength(ch, font=f) + spacing

    spaced((x0, 150), 'MUTE', font(30, 300), (196, 195, 201, 255), 18)
    d.text((x0, 212), '의식의 가장', font=font(64, 300), fill=(248, 247, 245, 255))
    d.text((x0, 292), '고요한 곳으로.', font=font(64, 300), fill=(248, 247, 245, 255))
    d.text((x0, 404), '빗소리 · 모닥불 · 파도 · 우주의 소리를 겹쳐 듣는', font=font(26, 300), fill=(196, 195, 201, 255))
    d.text((x0, 442), '나만의 앰비언트 사운드 믹서', font=font(26, 300), fill=(196, 195, 201, 255))

    # 하단 테마 칩
    chip_font = font(17, 400)
    cx = x0
    for name in ['NATURE', 'FANTASY', 'EERIE NIGHT', 'OCEAN', 'DEEP SPACE']:
        tw = d.textlength(name, font=chip_font)
        d.rounded_rectangle((cx, 518, cx + tw + 28, 552), radius=17, outline=(255, 255, 255, 60), width=1)
        d.text((cx + 14, 523), name, font=chip_font, fill=(196, 195, 201, 255))
        cx += tw + 40

    shadow = text_layer.split()[3].filter(ImageFilter.GaussianBlur(8))
    img.paste((0, 0, 0), mask=shadow.point(lambda a: a * 0.6))
    img.paste(text_layer, mask=text_layer)

    img.save(OUT_PATH, quality=88, optimize=True, progressive=True)
    print(f'  og-image.jpg  {os.path.getsize(OUT_PATH) / 1024:.0f} KB')


if __name__ == '__main__':
    main()
