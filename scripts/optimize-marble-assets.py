"""Prepare the approved ccec83d source handoff. Requires Pillow; no game code changes."""
import hashlib
import json
import sys
from pathlib import Path
from PIL import Image

source = Path(sys.argv[1])
destination = Path(sys.argv[2] if len(sys.argv) > 2 else "output/marble-premium")
manifest = json.loads((source / "manifest.json").read_text())
assert manifest["format"] == "marble-premium-source-assets-v1"
assert len(manifest["assets"]) == 32
records = []
for asset in manifest["assets"]:
    relative = Path(asset["path"]).relative_to("asset-handoff/marble-premium")
    assert relative.parts[0] in {"cities", "buildings", "pawns"}
    assert ".." not in relative.parts and relative.suffix == ".png"
    path = source / relative
    data = path.read_bytes()
    assert len(data) == asset["bytes"]
    assert hashlib.sha256(data).hexdigest() == asset["sha256"]
    assert hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest() == asset["git_blob_sha"]
    with Image.open(path) as original:
        image = original.convert("RGBA")
        # Ignore stray near-transparent pixels only when locating the crop; retain alpha within it.
        bounds = image.getchannel("A").point(lambda alpha: 255 if alpha >= 16 else 0).getbbox()
        assert bounds is not None
        padding = max(8, round(max(bounds[2] - bounds[0], bounds[3] - bounds[1]) * .025))
        crop = (max(0, bounds[0] - padding), max(0, bounds[1] - padding), min(image.width, bounds[2] + padding), min(image.height, bounds[3] + padding))
        image = image.crop(crop)
        edge = 256 if relative.parts[0] == "pawns" else 512
        image.thumbnail((edge, edge), Image.Resampling.LANCZOS)
        target = destination / relative.with_suffix(".webp")
        target.parent.mkdir(parents=True, exist_ok=True)
        image.save(target, "WEBP", quality=92, method=6, exact=True)
        with Image.open(target) as decoded:
            decoded.load()
            assert decoded.size == image.size and decoded.mode == "RGBA"
            assert decoded.getchannel("A").getextrema() == (0, 255)
        assert target.stat().st_size < len(data)
        records.append({"path": str(relative.with_suffix(".webp")), "sourcePath": asset["path"], "sourceSha256": asset["sha256"], "sourceBytes": len(data), "crop": crop, "dimensions": image.size, "bytes": target.stat().st_size, "sha256": hashlib.sha256(target.read_bytes()).hexdigest()})
counts = {group: sum(record["path"].startswith(group + "/") for record in records) for group in ("cities", "buildings", "pawns")}
assert counts == {"cities": 24, "buildings": 2, "pawns": 6}
result = {"sourceRevision": "ccec83d87fac6ad1a65dd2b900dec8870ef1c71b", "format": "marble-premium-runtime-webp-v1", "counts": counts, "originalBytes": sum(record["sourceBytes"] for record in records), "runtimeBytes": sum(record["bytes"] for record in records), "policy": "WebP quality92, original colors and interior alpha, padded alpha16 crop; cities/buildings512px, pawns256px. Original PNGs preserved in the source branch. Game mapping and in-game pixels are separate validation.", "assets": records}
destination.mkdir(parents=True, exist_ok=True)
(destination / "manifest.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({key: result[key] for key in ("counts", "originalBytes", "runtimeBytes")}))
