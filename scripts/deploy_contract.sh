#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <stellar-cli-identity-alias>"
  exit 1
fi

ALIAS="$1"
NETWORK="testnet"
CONTRACT_DIR="contracts/live_poll"
WASM_PATH="$CONTRACT_DIR/target/wasm32v1-none/release/live_poll.wasm"

echo "[1/3] Build contract wasm"
stellar contract build --package live_poll --manifest-path "$CONTRACT_DIR/Cargo.toml"

echo "[2/3] Optimize wasm"
stellar contract optimize --wasm "$WASM_PATH"

echo "[3/3] Deploy to testnet"
CONTRACT_ID=$(stellar contract deploy \
  --wasm "$WASM_PATH" \
  --source "$ALIAS" \
  --network "$NETWORK")

echo "Deployed contract ID: $CONTRACT_ID"
echo "Use this value as VITE_CONTRACT_ID in frontend/.env"
