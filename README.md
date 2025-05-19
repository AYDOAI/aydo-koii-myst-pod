# AYDO Koii Myst Pod

This project is a Node.js-based pod for managing and monitoring a [Mysterium Node](https://www.mystnodes.com/) (myst node) in a containerized environment. It provides a REST API for health checks, node state, registration automation, and integration with the Mysterium and Koii ecosystems.

The pod is designed to:
- Collect and audit node state and service information
- Automate node registration and beneficiary setup
- Provide endpoints for external orchestration and monitoring

## What is a Myst Node?
A [Myst Node](https://www.mystnodes.com/) is a node in the [Mysterium Network](https://mysterium.network/), a decentralized VPN and privacy infrastructure. Each node provides bandwidth and network services, earning rewards for participation. Nodes must be registered and periodically audited to remain active and eligible for rewards.

## What is BENEFICIARY_WALLET?
Your earnings will automatically be paid out to the wallet address submitted below. If you have not set your wallet or would like to update it, please do it now. Please make sure the address is an **ERC-20 Polygon-compatible wallet**, e.g. MetaMask.

## REST API Endpoints

### `GET /`
- Health check endpoint. Returns `"Working"` if the pod is running.

### `POST /healthz`
- Checks if the myst process is running, port 4449 is open, and the node is healthy.
- Returns `"OK"` or error details.

### `POST /task/:roundNumber`
- Collects node state and service info for a given round.
- Stores a submission with providerId, running services, uptime, version, location, IP, NAT status, etc.

### `GET /submission/:roundNumber`
- Returns the submission for a given round number.

### `POST /audit`
- Audits a submission by:
  - Checking that all service types in the submission exist in the discovery proposals for the provider.
  - Verifying that providerId matches in all proposals.
- Returns `true` or `false`.

## Node Registration Automation

The pod includes a background process that:
- Periodically fetches the node's identity and state.
- If the identity is found and its `registration_status` is `"Unregistered"`, it triggers the full registration flow (including beneficiary setup).
- If the status is `"InProgress"` or `"Registered"`, the monitoring stops.

## CLI

A CLI interface is available for manual operations (see `src/cli.ts`):
- `register-node` — runs the full node registration flow.
- `state-node` — prints the current node state.
- `set-password-node` — interactively sets the UI password for the node.

## Useful Links

- [Mysterium Node Dashboard](https://www.mystnodes.com/)
- [Mysterium Network Docs](https://docs.mysterium.network/)
- [Koii Task Template](https://github.com/koii-network/task-template)

## Security Notes

- All sensitive environment variables (like `BENEFICIARY_WALLET`) should be set via environment or secrets, never hardcoded.
- Do not log or expose private keys or passwords.
