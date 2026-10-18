#!/usr/bin/env python3
"""Rebuild the two DaVinci joker portraits from the approved cutout."""

import hashlib
import json
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "public/images/personalization/manifest.json"
FACE_ROIS = {
    "davinci-black-yeonseok": {
        "forehead": (100, 160, 340, 310),
        "eyes": (90, 270, 370, 380),
        "mouth": (150, 400, 310, 490),
        "chin": (150, 465, 320, 540),
    },
    "davinci-white-lisbeth": {
        "forehead": (220, 205, 475, 330),
        "eyes": (245, 285, 500, 390),
        "mouth": (300, 370, 460, 465),
        "chin": (325, 435, 490, 510),
    },
}


def main():
    manifest = json.loads(MANIFEST.read_text())
    source = Image.open(ROOT / "public/images/yeonseok-lisbeth-cutout.webp").convert("RGBA")

    for asset in manifest["assets"]:
        if asset["id"] not in FACE_ROIS:
            continue

        x, y, width, height = asset["crop"]
        polygon = asset["maskSourcePolygon"]
        mask = Image.new("L", source.size, 0)
        ImageDraw.Draw(mask).polygon([tuple(point) for point in polygon], fill=255)
        mask = mask.filter(ImageFilter.GaussianBlur(asset["maskEdgeFeatherPx"]))

        masked = source.copy()
        masked.putalpha(Image.composite(source.getchannel("A"), Image.new("L", source.size, 0), mask))
        portrait = masked.crop((x, y, x + width, y + height))
        output = ROOT / "public" / asset["path"].lstrip("/")
        output.parent.mkdir(parents=True, exist_ok=True)
        portrait.save(output, "WEBP", lossless=True, exact=True, method=6)

        data = output.read_bytes()
        assert len(data) == asset["bytes"], f"{output}: byte count differs from manifest"
        assert hashlib.sha256(data).hexdigest() == asset["sha256"], f"{output}: hash differs from manifest"

        decoded = Image.open(output).convert("RGBA")
        assert decoded.size == (width, height)
        source_crop = source.crop((x, y, x + width, y + height))
        assert ImageChops.difference(decoded.convert("RGB"), source_crop.convert("RGB")).getbbox() is None, (
            f"{output}: RGB pixels differ from the approved source crop"
        )
        alpha = decoded.getchannel("A")
        for feature, roi in FACE_ROIS[asset["id"]].items():
            assert alpha.crop(roi).getextrema()[1] >= 128, f"{output}: {feature} is masked out"

        print(f"verified {output.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
