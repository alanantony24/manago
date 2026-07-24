#!/usr/bin/env python3
"""Wrap raw mobile screenshots in a normal tall iPhone-style outline."""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "public" / "gallery" / "raw"
OUT = ROOT / "public" / "gallery"

NAVY = (26, 77, 89)
MINT = (212, 232, 208)
SURFACE = (249, 250, 251)

# Fixed “iPhone 14” silhouette proportions (CSS px × 2 for export sharpness)
PHONE_W = 390
PHONE_H = 844
SCREEN_INSET = 14  # side/top/bottom bezel thickness
CORNER = 56
SCREEN_CORNER = 44
HOME_W = 128
HOME_H = 5
CANVAS_PAD_X = 56
CANVAS_PAD_Y = 48
LABEL_GAP = 28
SHADOW_BLUR = 36
EXPORT_SCALE = 2  # render at 2× then keep (already retina-ish)


def round_rect_mask(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius=radius, fill=255)
    return mask


def soft_background(size: tuple[int, int]) -> Image.Image:
    w, h = size
    img = Image.new("RGB", size, SURFACE)
    draw = ImageDraw.Draw(img)
    for y in range(h):
        t = y / max(h - 1, 1)
        r = int(MINT[0] * (1 - t) + 245 * t)
        g = int(MINT[1] * (1 - t) + 250 * t)
        b = int(MINT[2] * (1 - t) + 248 * t)
        draw.line([(0, y), (w, y)], fill=(r, g, b))
    orb = Image.new("RGBA", size, (0, 0, 0, 0))
    od = ImageDraw.Draw(orb)
    od.ellipse((-w * 0.15, -h * 0.08, w * 0.5, h * 0.35), fill=(0, 121, 121, 26))
    od.ellipse((w * 0.4, h * 0.55, w * 1.1, h * 1.05), fill=(243, 156, 18, 16))
    orb = orb.filter(ImageFilter.GaussianBlur(90))
    return Image.alpha_composite(img.convert("RGBA"), orb).convert("RGB")


def fit_screen(shot: Image.Image, screen_w: int, screen_h: int) -> Image.Image:
    """Cover-fit the screenshot into the screen area (crop center if needed)."""
    shot = shot.convert("RGB")
    sw, sh = shot.size
    scale = max(screen_w / sw, screen_h / sh)
    nw, nh = max(1, int(round(sw * scale))), max(1, int(round(sh * scale)))
    resized = shot.resize((nw, nh), Image.Resampling.LANCZOS)
    left = max(0, (nw - screen_w) // 2)
    top = max(0, (nh - screen_h) // 2)
    return resized.crop((left, top, left + screen_w, top + screen_h))


def frame_screenshot(shot: Image.Image) -> Image.Image:
    s = EXPORT_SCALE
    phone_w = PHONE_W * s
    phone_h = PHONE_H * s
    inset = SCREEN_INSET * s
    corner = CORNER * s
    screen_corner = SCREEN_CORNER * s

    screen_w = phone_w - inset * 2
    screen_h = phone_h - inset * 2

    fitted = fit_screen(shot, screen_w, screen_h)

    body = Image.new("RGBA", (phone_w, phone_h), (0, 0, 0, 0))
    bd = ImageDraw.Draw(body)

    # Outer chassis
    bd.rounded_rectangle(
        (0, 0, phone_w - 1, phone_h - 1),
        radius=corner,
        fill=(12, 12, 14, 255),
    )
    # Inner rim highlight
    bd.rounded_rectangle(
        (2 * s, 2 * s, phone_w - 1 - 2 * s, phone_h - 1 - 2 * s),
        radius=corner - 2 * s,
        outline=(55, 55, 60, 200),
        width=max(1, s),
    )

    # Screen
    screen = Image.new("RGBA", (screen_w, screen_h))
    screen.paste(fitted.convert("RGBA"), (0, 0))
    screen.putalpha(round_rect_mask((screen_w, screen_h), screen_corner))
    body.paste(screen, (inset, inset), screen)

    # Home indicator
    hx = (phone_w - HOME_W * s) // 2
    hy = phone_h - inset - int(14 * s)
    bd.rounded_rectangle(
        (hx, hy, hx + HOME_W * s, hy + HOME_H * s),
        radius=(HOME_H * s) // 2,
        fill=(255, 255, 255, 110),
    )

    # Side buttons
    btn_w = max(3, int(3 * s))
    bd.rounded_rectangle(
        (0, int(phone_h * 0.18), btn_w, int(phone_h * 0.24)),
        radius=btn_w,
        fill=(40, 40, 44, 255),
    )
    bd.rounded_rectangle(
        (0, int(phone_h * 0.26), btn_w, int(phone_h * 0.34)),
        radius=btn_w,
        fill=(40, 40, 44, 255),
    )
    bd.rounded_rectangle(
        (phone_w - btn_w, int(phone_h * 0.25), phone_w, int(phone_h * 0.33)),
        radius=btn_w,
        fill=(40, 40, 44, 255),
    )

    return body


def try_font(size: int) -> ImageFont.ImageFont:
    for path in (
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ):
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def compose(raw_path: Path, label: str, out_path: Path) -> None:
    shot = Image.open(raw_path)
    phone = frame_screenshot(shot)

    pad_x = CANVAS_PAD_X * EXPORT_SCALE
    pad_y = CANVAS_PAD_Y * EXPORT_SCALE
    label_gap = LABEL_GAP * EXPORT_SCALE
    label_h = 28 * EXPORT_SCALE

    canvas_w = phone.width + pad_x * 2
    canvas_h = phone.height + pad_y * 2 + label_gap + label_h
    bg = soft_background((canvas_w, canvas_h)).convert("RGBA")

    # Soft drop shadow
    shadow = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    ox = pad_x + 6 * EXPORT_SCALE
    oy = pad_y + 12 * EXPORT_SCALE
    sd.rounded_rectangle(
        (ox, oy, ox + phone.width, oy + phone.height),
        radius=CORNER * EXPORT_SCALE,
        fill=(26, 77, 89, 65),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(SHADOW_BLUR))
    bg = Image.alpha_composite(bg, shadow)
    bg.paste(phone, (pad_x, pad_y), phone)

    draw = ImageDraw.Draw(bg)
    font = try_font(15 * EXPORT_SCALE)
    tw = draw.textlength(label, font=font)
    draw.text(
        ((canvas_w - tw) / 2, pad_y + phone.height + label_gap),
        label,
        fill=NAVY + (255,),
        font=font,
    )

    # Downscale once for web-friendly size while keeping tall phone proportions
    export = bg.convert("RGB").resize(
        (canvas_w // 2, canvas_h // 2),
        Image.Resampling.LANCZOS,
    )
    export.save(out_path, "PNG", optimize=True)
    print(f"  framed → {out_path.name} ({export.size[0]}x{export.size[1]})")


def main() -> None:
    manifest_path = OUT / "manifest.json"
    if manifest_path.exists():
        items = json.loads(manifest_path.read_text())
    else:
        items = [{"id": p.stem, "label": p.stem} for p in sorted(RAW.glob("*.png"))]

    for item in items:
        raw = RAW / f"{item['id']}.png"
        if not raw.exists():
            print(f"  skip missing {raw.name}")
            continue
        compose(raw, item.get("label", item["id"]), OUT / f"{item['id']}.png")

    print("Framing complete.")


if __name__ == "__main__":
    main()
