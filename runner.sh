#!/bin/sh

# Configuration.
BRANCH_A="PWA-benchmark"
BRANCH_B="develop"

# Install dependencies.
npm i -g @shopgate/platform-sdk

# Clone pwa and install submodules.
git clone https://github.com/shopgate/pwa.git
cd pwa
git checkout $BRANCH_A
git submodule init
git submodule update
make clean

# Prepare platfor sdk
mkdir -p .sgcloud
echo "{}" > .sgcloud/storage.json 
echo '{"ip": "127.0.0.1", "port": 8080, "hmrPort": 3000, "apiPort": 9667, "remotePort": 8000, "sourceMapsType": "source-map"}' > .sgcloud/frontend.json
echo '{"id": "shop_30188", "benchmark": true }' > .sgcloud/app.json 

# Start services.
sgconnect extension attach
sgconnect backend start | sed "s/^/[BACKEND] /" &
sgconnect frontend start --theme=gmd | sed "s/^/[FRONTEND] /" &
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9223 | sed "s/^/[CHROME] /" &

# Launch advanced runner in js.
sleep 30 # wait a bit for frontend and backend processes.
node ../controller branch_a | sed "s/^/[CONTROLLER] /"

# Generate PR comment
PR_REPLY=${node ../report branch_a branch_a}
echo $PR_REPLY