#!/usr/bin/env bash
# Валідатор правил алертів (T-6011a): кожен alert мусить мати expr, for і severity.
# Ловить і зламаний YAML у найчастіших формах: таби та незакриті лапки.
set -uo pipefail

file="${1:-$(dirname "$0")/alerts.yml}"
fail=0

[ -f "$file" ] || { echo "check-alerts: $file not found" >&2; exit 1; }

if grep -qP '\t' "$file"; then
  echo "check-alerts: tab character in $file (YAML forbids tabs)" >&2
  fail=1
fi

# Справжній парс YAML, якщо пакет `yaml` доступний у workspace (pnpm-сховище).
yaml_dir="$(ls -d "$(dirname "$0")/../../node_modules/.pnpm"/yaml@*/node_modules 2>/dev/null | head -1)"
if [ -n "$yaml_dir" ] && command -v node >/dev/null 2>&1; then
  if ! NODE_PATH="$yaml_dir" node -e '
    const { readFileSync } = require("node:fs");
    const YAML = require("yaml");
    YAML.parse(readFileSync(process.argv[1], "utf8"));
  ' "$file" 2>/dev/null; then
    echo "check-alerts: $file is not valid YAML" >&2
    fail=1
  fi
fi

if ! grep -q '^groups:' "$file"; then
  echo "check-alerts: $file has no top-level 'groups:' key" >&2
  fail=1
fi

if ! awk '
  /^[[:space:]]*- alert:/ { check(); name=$0; seen=1; expr=0; dur=0; sev=0; next }
  /^[[:space:]]*expr:/ { expr=1 }
  /^[[:space:]]*for:/ { dur=1 }
  /severity:/ { sev=1 }
  END { check(); if (!seen) { print "check-alerts: no alerts found" > "/dev/stderr"; bad=1 } exit bad }
  function check() {
    if (name != "" && (!expr || !dur || !sev)) {
      print "check-alerts: " name " lacks expr, for or severity" > "/dev/stderr"
      bad=1
    }
  }
' "$file"; then
  fail=1
fi

if [ "$fail" -ne 0 ]; then
  exit 1
fi
echo "check-alerts: OK ($(grep -c '^[[:space:]]*- alert:' "$file") alerts in $file)"
