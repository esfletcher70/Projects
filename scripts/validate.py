#!/usr/bin/env python3
"""Build/validation step for the Small App Tools static site.

There is no bundler in this project, so "build" means verifying the
artifacts are deployable:
  1. Every local asset referenced by an HTML file actually exists.
  2. No HTML file is empty.
  3. Every JS file (client tools + Pages Functions) is syntactically valid.

Run from the project root:
    python3 scripts/validate.py
"""

import os
import re
import shutil
import subprocess
import sys
import tempfile

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_DIR = os.path.join(PROJECT_ROOT, "public")
JS_ROOTS = (
    os.path.join(PUBLIC_DIR, "assets", "js"),
    os.path.join(PROJECT_ROOT, "functions"),
)

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


def validate_js_syntax():
    """Syntax-check every JS file as an ES module.

    All JS in this project (client tool modules and Pages Functions) uses
    import/export, but plain .js files parse as CommonJS by default without
    a package.json "type": "module". Copying to a .mjs temp file forces ES
    module parsing regardless of that, so `node --check` reports real
    syntax errors instead of false positives on `import`/`export`.
    """
    errors = []
    for root_dir in JS_ROOTS:
        if not os.path.isdir(root_dir):
            continue
        for dirpath, _, filenames in os.walk(root_dir):
            for name in filenames:
                if not name.endswith(".js"):
                    continue
                path = os.path.join(dirpath, name)
                rel = os.path.relpath(path, PROJECT_ROOT)

                with tempfile.NamedTemporaryFile(suffix=".mjs", delete=False) as tmp:
                    tmp_path = tmp.name
                try:
                    shutil.copyfile(path, tmp_path)
                    result = subprocess.run(
                        ["node", "--check", tmp_path],
                        capture_output=True,
                        text=True,
                    )
                    if result.returncode != 0:
                        detail = result.stderr.strip().splitlines()
                        errors.append(f"{rel}: syntax error ({detail[0] if detail else 'unknown'})")
                finally:
                    os.unlink(tmp_path)

    return errors


def main():
    errors = validate_html() + validate_js_syntax()

    if errors:
        print("BUILD FAILED:")
        for err in errors:
            print(f"  - {err}")
        return 1

    print("OK: all HTML asset references resolve")
    return 0


if __name__ == "__main__":
    sys.exit(main())
