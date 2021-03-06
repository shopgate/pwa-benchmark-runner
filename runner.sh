#!/bin/sh

if [ -z "$TRIGGER_BRANCH_TARGET" ]; then
  echo "Dry run, no branch name given."
  exit
fi

# Configuration.
BRANCH_A="$TRIGGER_BRANCH_TARGET"
BRANCH_B="$TRIGGER_BRANCH_DESTINATION"

# Install dependencies.
npm i -g @shopgate/platform-sdk
npm i -g lerna

# Clone pwa and install submodules.
git clone https://github.com/shopgate/pwa.git
cd pwa
git checkout $BRANCH_A
#perl -i -p -e 's|git@([a-zA-Z\.]*):([a-zA-Z-\/]*)|https://\1\/\2|g' .gitmodules
#git submodule init
#git submodule update
make clean

# Prepare platfor sdk
mkdir -p .sgcloud
echo "{}" > .sgcloud/storage.json 
echo '{"ip": "127.0.0.1", "port": 8080, "hmrPort": 3000, "apiPort": 9667, "remotePort": 8000, "sourceMapsType": "source-map"}' > .sgcloud/frontend.json
echo '{"id": "shop_30188", "benchmark": true }' > .sgcloud/app.json 

# Start services.
sgconnect login --username $PLATFORM_USER --password $PLATFORM_PASSWORD
sgconnect extension attach
#sgconnect backend start | sed "s/^/[BACKEND] /" &
sgconnect frontend start --theme=theme-gmd | sed "s/^/[FRONTEND] /" &

google-chrome-stable --headless --remote-debugging-port=9223 | sed "s/^/[CHROME] /" &

# Launch advanced runner in js.
sleep 30 # wait a bit for frontend and backend processes.
node ../controller branch_a | sed "s/^/[CONTROLLER] /"

# Prepare second run
git checkout $BRANCH_B
make clean

# Wait for webpack and execute second run
sleep 30
node ../controller branch_b | sed "s/^/[CONTROLLER] /"

# Generate PR comment
PR_REPLY="$(BRANCH_A=$BRANCH_A BRANCH_B=$BRANCH_B node ../report branch_a branch_b)"
echo "$PR_REPLY"

if [ -z "$TRIGGER_PULL_REQUEST" ]; then
  echo "Dry Run no PR given."
else
  API_ENDPOINT="https://api.github.com/repos/$TRIGGER_REPO_SLUG/issues/$TRIGGER_PULL_REQUEST/comments"
  echo "Posting to GitHub PR -> $API_ENDPOINT"

  curl \
    -H "Authorization: token ${GITHUB_TOKEN}" \
    -X POST \
    -d "$PR_REPLY" \
    "$API_ENDPOINT"
fi

sgconnect logout 