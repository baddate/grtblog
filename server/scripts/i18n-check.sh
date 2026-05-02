#!/bin/bash
set -e
cd "$(dirname "$0")/.."

# Check zh and en key symmetry
jq -S 'keys' locales/zh/server.json > /tmp/zh_keys.json
jq -S 'keys' locales/en/server.json > /tmp/en_keys.json
diff /tmp/zh_keys.json /tmp/en_keys.json || { echo "i18n key mismatch!"; exit 1; }

# Check no empty values
if jq -e 'to_entries[] | select(.value == "")' locales/zh/server.json > /dev/null 2>&1; then
    echo "Empty zh values found!"
    exit 1
fi
if jq -e 'to_entries[] | select(.value == "")' locales/en/server.json > /dev/null 2>&1; then
    echo "Empty en values found!"
    exit 1
fi

echo "i18n check passed"
