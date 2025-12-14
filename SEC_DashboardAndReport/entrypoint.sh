#!/bin/sh
set -eu

# Inject runtime API_URL and SIGNALR_HUB_URL into assets/config.js so Angular can read window.__env
CONFIG_FILE="/usr/share/nginx/html/assets/config.js"
API_URL_VALUE=${API_URL:-'https://rnc-backend-1073474302502.europe-west1.run.app'}
SIGNALR_HUB_URL_VALUE=${SIGNALR_HUB_URL:-'https://rnc-backend-1073474302502.europe-west1.run.app/notificationHub'}
PRODUCTION_VALUE=${PRODUCTION_VALUE:-'false'}

# Start building the config object
CONFIG_CONTENT="window.__env = window.__env || {};"

# Add API URL
if [ -n "$API_URL_VALUE" ]; then
  CONFIG_CONTENT="${CONFIG_CONTENT} window.__env.apiUrl = '${API_URL_VALUE}';"
else
  CONFIG_CONTENT="${CONFIG_CONTENT} window.__env.apiUrl = '';"
fi

# Add SignalR Hub URL
if [ -n "$SIGNALR_HUB_URL_VALUE" ]; then
  CONFIG_CONTENT="${CONFIG_CONTENT} window.__env.signalRHubUrl = '${SIGNALR_HUB_URL_VALUE}';"
else
  CONFIG_CONTENT="${CONFIG_CONTENT} window.__env.signalRHubUrl = '';"
fi
# Add Environment
if [ -n "$PRODUCTION_VALUE" ]; then
  CONFIG_CONTENT="${CONFIG_CONTENT} window.__env.production = '${PRODUCTION_VALUE}';"
else
  CONFIG_CONTENT="${CONFIG_CONTENT} window.__env.production = '';"
fi

# Write the complete config to file
echo "$CONFIG_CONTENT" > "$CONFIG_FILE"

exit 0


