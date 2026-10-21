import os
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from loguru import logger

def apply_smooth_ambient_banner(
    image_input,
    caption_text: str,
    logo_path: Path,
    output_path: Path = None,
    font_path: str = "C:/Windows/Fonts/segoeuib.ttf",
    font_size: int = 26
) -> Image.Image:
    """
    Applies a professional, seamless lower-third banner using:
    1. Dynamic Ambient Color Sampling (uses the photograph's exact bottom colors)
    2. Progressive Hermite Smoothstep Feathering (3t^2 - 2t^3) for zero hard borders
    3. Soft Background Diffusion (Gaussian blur under feathered zone)
    4. Crisp white typography with subtle sub-pixel shadow
    5. Official Unbox-ED logo badge (unboxED_Logo_300X169_Standard.jpg)
    """
    if isinstance(image_input, (str, Path)):
        base_img = Image.open(image_input).convert("RGBA")
    else:
        base_img = image_input.convert("RGBA")

    w, h = base_img.size

    # 1. Sample ambient color from the lower 15% of the photograph
    bottom_h = int(h * 0.15)
    bottom_crop = np.array(base_img.crop((0, h - bottom_h, w, h)))
    mean_rgb = bottom_crop[:, :, :3].mean(axis=(0, 1)).astype(int)

    # Blend 45% image ambient color with 55% Unbox-ED Brand Deep Navy [0, 28, 84]
    brand_navy = np.array([0, 28, 84])
    tint_rgb = (np.array(mean_rgb) * 0.45 + brand_navy * 0.55).astype(np.uint8)

    # 2. Create Progressive Background Diffusion (Frosted falloff)
    blurred_img = base_img.filter(ImageFilter.GaussianBlur(radius=18))

    # 3. Hermite Smoothstep mask over a 105px transition zone
    fade_start = h - 180
    fade_end = h - 75

    mask = np.zeros((h, w), dtype=np.float32)
    for y in range(h):
        if y < fade_start:
            mask[y, :] = 0.0
        elif y < fade_end:
            t = (y - fade_start) / (fade_end - fade_start)
            mask[y, :] = 3 * (t ** 2) - 2 * (t ** 3)
        else:
            mask[y, :] = 1.0

    mask_uint8 = (mask * 255).astype(np.uint8)
    mask_img = Image.fromarray(mask_uint8, mode="L")

    # Composite blurred version softly over the base image
    out_img = base_img.copy()
    out_img.paste(blurred_img, (0, 0), mask=mask_img)

    # 4. Composite the ambient tinted shadow layer
    dark_tint = np.zeros((h, w, 4), dtype=np.uint8)
    dark_tint[:, :, 0] = tint_rgb[0]
    dark_tint[:, :, 1] = tint_rgb[1]
    dark_tint[:, :, 2] = tint_rgb[2]
    # Maximum opacity ~84% (215/255) at the very bottom
    dark_tint[:, :, 3] = (mask * 215).astype(np.uint8)
    tint_layer = Image.fromarray(dark_tint, mode="RGBA")
    out_img = Image.alpha_composite(out_img, tint_layer)

    # 5. Prepare Unbox-ED standard logo badge
    if not Path(logo_path).exists():
        logger.warning(f"Logo not found at {logo_path}")
        logo_w, logo_h = 0, 0
    else:
        logo = Image.open(logo_path).convert("RGB")
        logo_h = 62
        logo_w = int(logo_h * (logo.width / logo.height))
        logo_resized = logo.resize((logo_w, logo_h), Image.Resampling.LANCZOS)

        radius = 8
        badge_mask = Image.new("L", (logo_w, logo_h), 0)
        ImageDraw.Draw(badge_mask).rounded_rectangle([(0, 0), (logo_w, logo_h)], radius=radius, fill=255)

        badge = Image.new("RGBA", (logo_w, logo_h), (0, 0, 0, 0))
        badge.paste(logo_resized, (0, 0), mask=badge_mask)

        # Soft 1px semi-transparent white card border
        draw_b = ImageDraw.Draw(badge)
        draw_b.rounded_rectangle([(0, 0), (logo_w - 1, logo_h - 1)], radius=radius, outline=(255, 255, 255, 140), width=1)

        logo_x = w - logo_w - 35
        logo_y = h - logo_h - 24
        out_img.paste(badge, (logo_x, logo_y), badge)

    # 6. Render Caption Text
    draw = ImageDraw.Draw(out_img)
    try:
        font = ImageFont.truetype(font_path, font_size)
    except Exception:
        font = ImageFont.load_default()

    text_x = 35
    bbox = font.getbbox(caption_text)
    text_h = bbox[3] - bbox[1]
    
    # Vertically align with logo center
    if logo_h > 0:
        text_y = h - 24 - int(logo_h / 2) - int(text_h / 2)
    else:
        text_y = h - 50

    # 1px sub-pixel shadow for 100% legibility
    draw.text((text_x + 1, text_y + 1), caption_text, fill=(0, 0, 0, 180), font=font)
    draw.text((text_x, text_y), caption_text, fill=(255, 255, 255, 255), font=font)

    if output_path:
        out_img.save(output_path, format="PNG")
        logger.info(f"Saved smooth merged image to {output_path}")

    return out_img
