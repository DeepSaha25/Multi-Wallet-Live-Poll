# Stellar Level 2: Multi-Wallet Live Poll

This repository is a complete Level 2 starter and submission-ready foundation:

- Multi-wallet integration using StellarWalletsKit
- Soroban smart contract (live poll) for write + read flows
- Frontend contract invocation with transaction status tracking
- Real-time event synchronization from Soroban RPC
- Error handling for:
  - wallet not found
  - transaction rejected
  - insufficient balance

## Project Structure

- `contracts/live_poll` - Soroban contract (Rust)
- `frontend` - Vite + React + TypeScript app
- `scripts/deploy_contract.sh` - deploy helper for testnet

## 1) Contract Build + Deploy (Testnet)

Prerequisites:

- Rust toolchain
- `stellar` CLI installed and configured
- A funded testnet account alias in Stellar CLI (example: `alice`)

Build and deploy:

```bash
cd contracts/live_poll
cargo test
cd ../..
chmod +x scripts/deploy_contract.sh
./scripts/deploy_contract.sh alice
```

The deploy script prints your deployed contract ID.

## 2) Frontend Setup

```bash
cd frontend
cp .env.example .env
# Fill VITE_CONTRACT_ID with your deployed contract ID
npm install
npm run dev
```

## 3) Required README Submission Data

**Submission Details:**

- **Live demo link (optional)**: http://localhost:5173 (local development)
- **Screenshot showing wallet options**: [screenshots/wallet-options.png](screenshots/wallet-options.png)
- **Deployed contract address (testnet)**: `CCELERZIZABY7IBK3EYI6MNWQE3YGE7ZIFVVFZOR7S6HOZZXRL5EFDIX`
- **Contract deployment tx**: [af1c8d2afb15f020e6926220a358e77ce21124803c41bdff2430ab81bc81a603](https://stellar.expert/explorer/testnet/tx/af1c8d2afb15f020e6926220a358e77ce21124803c41bdff2430ab81bc81a603)
- **Vote contract call tx**: [50a38365690e51c12013fd273f2ba64a2f299ea588b1d5b08aa9143523f62a48](https://stellar.expert/explorer/testnet/tx/50a38365690e51c12013fd273f2ba64a2f299ea588b1d5b08aa9143523f62a48)

## Implemented Requirement Mapping

- 3 error types handled: implemented in `frontend/src/lib/errors.ts`
- Contract deployed on testnet: provided deploy script + contract
- Contract called from frontend: `vote` and `get_results` calls in app
- Transaction status visible: pending/success/fail UI implemented
- Real-time event integration: event polling and state synchronization

## Suggested Meaningful Commit Sequence

1. `feat(contract): add live_poll soroban contract with vote events`
2. `feat(frontend): integrate wallets kit, contract calls, tx status, and event sync`
3. `docs(readme): add setup, deployment, and submission checklist`

## Notes

- This project uses Soroban testnet network passphrase.
- Wallet availability depends on wallet browser extension/app presence.
- If your account has no XLM for fees, writes will fail with underfunded/insufficient-balance style errors.
