#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
V=$(date +%Y%m%d%H%M)
sed -i -E "s#(css/style\.css\?v=)[0-9a-z]+#\1$V#; s#(js/main\.js\?v=)[0-9a-z]+#\1$V#; s#(name=\"asset-version\" content=\")[0-9a-z]+#\1$V#" index.html
echo "assets stamped $V"
