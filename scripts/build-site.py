"""Build the standalone website (site/index.html) from table-service/index.html.

The artifact source has no <html>/<head> wrapper (claude.ai adds one when it
publishes). This script wraps it in a full document for static hosting such
as Vercel, moving the title, meta tags, font links and styles into <head>.
Run: python3 scripts/build-site.py
"""
import json
from pathlib import Path

root = Path(__file__).resolve().parent.parent
src = (root / "table-service" / "index.html").read_text(encoding="utf-8")

cfg_path = root / "backend.config.json"
if cfg_path.exists():
    cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
    backend = (
        '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js"></script>\n'
        f'<script>window.RESTAURANT_BACKEND = {json.dumps({"url": cfg["url"], "key": cfg["anonKey"]})};</script>\n'
    )
    marker = '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js'
    assert marker in src, "three.js script tag not found"
    src = src.replace(marker, backend + marker, 1)

cut = src.index("</style>") + len("</style>")
head_part, body_part = src[:cut], src[cut:]

doc = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#d63b2f">
<meta name="description" content="Scan the table QR code to see the menu, order, call the waiter and pay at the table.">
<style>:root{{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}body{{margin:0;font:14px system-ui,-apple-system,"Segoe UI",sans-serif}}img{{max-width:100%}}[hidden]{{display:none!important}}</style>
{head_part.strip()}
</head>
<body>
{body_part.strip()}
</body>
</html>
"""
out = root / "site" / "index.html"
out.parent.mkdir(exist_ok=True)
out.write_text(doc, encoding="utf-8")
print(f"wrote {out.relative_to(root)} ({len(doc):,} bytes)")
