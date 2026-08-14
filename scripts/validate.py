#!/usr/bin/env python3
"""Build/validation step for the AppHub static site.

There is no bundler in this project, so "build" means verifying the
artifacts are deployable:
  1. Every local asset referenced by an HTML file actually exists.
  2. No HTML file is empty.

Run from the project root:
    python3 scripts/validate.py
"""

import os
import re
import sys

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_DIR = os.path.join(PROJECT_ROOT, "public")

# src="..." or href="..." that point at local files (not http(s) or #).
REF_RE = re.compile(r'(?:src|href)\s*=\s*["\']([^"\']+)["\']')


def validate_html():
    errors = []
    if not os.path.isdir(PUBLIC_DIR):
        errors.append("public/ directory not found.")
        return errors

    html_files = sorted(
        f for f in os.listdir(PUBLIC_DIR) if f.lower().endswith(".html")
    )
    if not html_files:
        errors.append("No HTML files found in public/.")

    for name in html_files:
        path = os.path.join(PUBLIC_DIR, name)
        with open(path, encoding="utf-8") as f:
            content = f.read()
        if not content.strip():
            errors.append(f"{name}: file is empty")

        for ref in REF_RE.findall(content):
            if ref.startswith(("http://", "https://", "#", "data:")):
                continue
            # Skip JS template-literal placeholders like src="${url}".
            if "${" in ref:
                continue
            # Strip query/hash fragments from local refs.
            ref = ref.split("?")[0].split("#")[0]
            if not ref:
                continue
            target = os.path.normpath(os.path.join(PUBLIC_DIR, ref))
            if not os.path.isfile(target):
                errors.append(f"{name}: missing local reference '{ref}'")

    return errors


def main():
    errors = validate_html()

    if errors:
        print("BUILD FAILED:")
        for err in errors:
            print(f"  - {err}")
        return 1

    print("OK: all HTML asset references resolve")
    return 0


if __name__ == "__main__":
    sys.exit(main())
