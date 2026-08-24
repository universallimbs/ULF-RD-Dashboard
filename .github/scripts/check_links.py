#!/usr/bin/env python3
"""Static link checker for the ULF R&D Dashboard.

Scans every .html file for href/src attributes and:
  1. Fails the build if a relative link points to a file that does not exist
     in the repo (this is what would have caught the old test-rig-building.html
     dead link).
  2. Warns (does not fail) when a link points to docs.google.com, drive.google.com,
     or forms.gle without any nearby indication that access is restricted to a
     universallimbs.com account, so reviewers can double check sharing settings
     before merging.
"""
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[2]
HTML_FILES = sorted(ROOT.glob("*.html"))

ATTR_RE = re.compile(r'(?:href|src)\s*=\s*"([^"]+)"')
DRIVE_HOSTS = {"docs.google.com", "drive.google.com", "forms.gle"}
UL_MARKER = "universallimbs.com"

SKIP_SCHEMES = {"mailto", "tel", "javascript"}


def is_external(url: str) -> bool:
    parsed = urlparse(url)
    return bool(parsed.scheme) or url.startswith("//")


def main() -> int:
    broken = []
    drive_warnings = []

    for html_file in HTML_FILES:
        text = html_file.read_text(encoding="utf-8", errors="ignore")
        for match in ATTR_RE.finditer(text):
            url = match.group(1)
            if not url or url.startswith("#"):
                continue

            parsed = urlparse(url)
            if parsed.scheme in SKIP_SCHEMES:
                continue

            if is_external(url):
                host = parsed.netloc.lower()
                if host in DRIVE_HOSTS:
                    window = text[max(0, match.start() - 400): match.end() + 200]
                    if UL_MARKER not in window:
                        drive_warnings.append((html_file.name, url))
                continue

            # Placeholder links are intentionally left unresolved.
            if url.startswith("PASTE_") or url == "#":
                continue

            link_path = url.split("#")[0].split("?")[0]
            target_path = (ROOT / link_path.lstrip("/")) if link_path.startswith("/") else (html_file.parent / link_path)
            target_path = target_path.resolve()
            if not target_path.exists():
                broken.append((html_file.name, url))

    if broken:
        print("Broken internal links found:")
        for source, url in broken:
            print(f"  - {source} -> {url}")
    else:
        print("No broken internal links found.")

    if drive_warnings:
        print("\nWarning: Drive/Docs/Forms links without a nearby universallimbs.com marker:")
        for source, url in drive_warnings:
            print(f"  - {source} -> {url}")
        print("Confirm these are shared with Universal Limbs accounts only before merging.")
    else:
        print("\nAll Drive/Docs/Forms links have a nearby universallimbs.com marker.")

    return 1 if broken else 0


if __name__ == "__main__":
    sys.exit(main())
