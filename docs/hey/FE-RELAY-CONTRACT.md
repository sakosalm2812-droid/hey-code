# FE-RELAY-CONTRACT.md
## HEY Relay — Pairing, Token Rotation, Revocation & Safe Actions

**Document ID:** `FE-RELAY-CONTRACT`
**Status:** `DEFINED`
**Date:** 21 October 2026
**Feature:** F-25 — Global Hotkeys, Shortcut Bridge & HEY Relay

---

## 1. Overview

HEY Relay is a lightweight companion that runs on the teacher's own machine (Windows/macOS/Linux) to enable:
- Global hotkeys when HEY app is closed
- Phone/other device access to HEY via paired connection
- System tray presence and Dynamic Island mirroring

The relay holds **no secrets** beyond a rotating pairing token. It stores a reference to the HEY app instance, not user data.

---

## 2. Pairing Handshake

### 2.1 Initiation (Controller Device)

```
Controller (phone)                    Relay (desktop)
     |                                      |
     |--- 1. Request pair code -----------> |
     |                                      |
     |<-- 2. Pair code (6 chars) ----------- |
     |     Expires: 5 minutes               |
     |                                      |
     |--- 3. Register with code + device -- |
     |     info                             |
     |                                      |
     |<-- 4. Success + token --------------- |
     |                                      |
```

### 2.2 Pair Code Format

- **Alphabet**: `23456789ABCDEFGHJKLMNPQRSTUVWXYZ` (no 0, 1, I, O, L)
- **Length**: 6 characters
- **Entropy**: ~31 bits
- **Expiry**: 5 minutes from generation
- **Single-use**: Consumed on successful pairing

### 2.3 Pairing Request Payload (Controller → Relay)

```json
{
  "pairCode": "A7K9M2",
  "deviceInfo": {
    "id": "dev_1700000000_abc123",
    "name": "Teacher's iPhone",
    "platform": "ios",
    "deviceType": "phone",
    "capabilities": ["voice", "capture", "notifications"],
    "role": "mobile"
  }
}
```

### 2.4 Pairing Response (Relay → Controller)

**Success:**
```json
{
  "success": true,
  "deviceId": "dev_1700000000_abc123",
  "token": "relay_1700000000_xyz789",
  "tokenExpiresAt": "2026-10-22T12:00:00.000Z",
  "scope": "read-and-act",
  "safeActions": ["open-cockpit", "open-palette", "quick-capture", "ask-hey-text", "print-current-artefact"]
}
```

**Failure:**
```json
{
  "success": false,
  "error": "Invalid or expired pair code"
}
```

---

## 3. Token Rotation

### 3.1 Token Format

```
relay_<timestamp>_<random-14-chars>
```

### 3.2 Rotation Policy

| Parameter | Value |
|-----------|-------|
| Rotation Interval | 24 hours |
| Warning Threshold | 6 hours before expiry |
| Grace Period | 1 hour after expiry (allows in-flight requests) |
| Max Token Age | 25 hours (forced rotation) |

### 3.3 Rotation Flow

1. Relay detects token age ≥ 24 hours
2. Relay generates new token
3. Relay sends `token_rotated` event to all paired devices
4. Paired devices update stored token
5. Old token valid for 1 more hour (grace period)
6. After grace period, old token rejected

### 3.4 Token Validation

```javascript
function validateToken(token, now = Date.now()) {
  if (!token || !token.startsWith('relay_')) return false;

  const parts = token.split('_');
  if (parts.length !== 3) return false;

  const issued = parseInt(parts[1], 10);
  const age = now - issued;

  // Grace period: 25 hours max
  if (age > 25 * 60 * 60 * 1000) return false;

  return true;
}
```

---

## 4. Revocation

### 4.1 Immediate Revocation

When a device is revoked:
1. Relay removes device from trusted list
2. Relay invalidates device's token immediately
3. Relay publishes `device_revoked` event
4. Controller receives revocation, clears local token
5. All pending requests from revoked device fail with `revoked`

### 4.2 Revocation Payload

```json
{
  "action": "revoke",
  "deviceId": "dev_1700000000_abc123",
  "reason": "user_revoked",
  "revokedAt": "2026-10-21T12:00:00.000Z"
}
```

### 4.3 Scope Changes

Scope changes take effect immediately:
- `read-and-act` → `read-only`: Pending safe actions complete, new safe actions allowed, destructive blocked
- `read-and-act` → `paused`: All actions blocked until scope restored
- `read-only` → `read-and-act`: Safe actions immediately allowed

---

## 5. Safe Action List

These actions can be executed via relay **without** trust kernel approval:

| Action ID | Description | Parameters |
|-----------|-------------|------------|
| `open-cockpit` | Open teacher cockpit | None |
| `open-palette` | Open command palette | None |
| `quick-capture` | Open capture sheet | None |
| `ask-hey-text` | Send text query to HEY | `{ text: string }` |
| `print-current-artefact` | Print current artefact | `{ artefactId?: string }` |

### 5.1 Safe Action Execution

```json
{
  "action": "ask-hey-text",
  "parameters": { "text": "What's next in my lesson?" },
  "token": "relay_1700000000_xyz789",
  "requestId": "req_1700000001_abc"
}
```

**Response:**
```json
{
  "success": true,
  "requestId": "req_1700000001_abc",
  "result": { "text": "Your next step is the photosynthesis worksheet." }
}
```

---

## 6. Destructive Actions (Require Trust Kernel)

These actions **always** require trust kernel approval, even via relay:

| Action | Risk | Approval Required |
|--------|------|-------------------|
| `file:delete` | R3 | Explicit approval |
| `permission:grant` | R4 | Explicit approval |
| `spend:budget` | R2 | Explicit approval |
| `agent:spawn` | R2 | Explicit approval |
| `vault:promote` | R3 | Approval + Verification |
| `secret:read` | R3 | Explicit approval |

### 6.1 Destructive Action Flow via Relay

```
Controller          Relay              HEY App (Trust Kernel)
  |                   |                       |
  |--- execute -----> |                       |
  |                   |--- forward (with auth) -> |
  |                   |                       |--- evaluate(context) --> DENY/REQUIRE_APPROVAL
  |                   |<-- require_approval --- |
  |<-- require_approval --- |                 |
  |                   |                       |
  | (user approves)   |                       |
  |--- approve -----> |                       |
  |                   |--- forward (with approval) -> |
  |                   |                       |--- evaluate(context) --> ALLOW
  |                   |<-- success ---------- |
  |<-- success ------- |                       |
```

---

## 7. Relay State Machine

```
                    ┌─────────────────┐
                    │  DISCONNECTED   │
                    │  (no pairs)     │
                    └────────┬────────┘
                             │ generate pair code
                             ▼
                    ┌─────────────────┐
                    │    PAIRING      │
                    │ (code active)   │
                    └────────┬────────┘
              success ──────┘      │ timeout/fail
                             │      ▼
                             │ ┌─────────────────┐
                             └►│   DISCONNECTED  │
                               └────────┬────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
           ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
           │     PAIRED      │ │    DEGRADED     │ │    REVOKED      │
           │ (devices online)│ │ (some offline)  │ │ (explicit)      │
           └────────┬────────┘ └────────┬────────┘ └────────┬────────┘
                    │                   │                   │
                    │ revoke            │ revoke            │ (terminal)
                    │                   │                   │
                    ▼                   ▼                   ▼
           ┌─────────────────────────────────────────────────────────┐
           │                     DISCONNECTED                        │
           └─────────────────────────────────────────────────────────┘
```

---

## 8. Error Handling

| Error Code | HTTP/Transport | Meaning | Resolution |
|------------|----------------|---------|------------|
| `invalid_pair_code` | 400 | Code format wrong | Re-enter code |
| `expired_pair_code` | 410 | Code > 5 min old | Generate new code |
| `used_pair_code` | 409 | Code already consumed | Generate new code |
| `invalid_token` | 401 | Token malformed | Re-pair |
| `expired_token` | 401 | Token > 25 hours | Auto-rotate or re-pair |
| `revoked_token` | 403 | Device revoked | Re-pair required |
| `insufficient_scope` | 403 | Action not in scope | Change scope or approve |
| `trust_kernel_denied` | 403 | Approval required | User must approve on desktop |
| `relay_unavailable` | 503 | Relay not running | Start relay from tray |

---

## 9. Platform Availability

| Platform | Relay Role | State |
|----------|------------|-------|
| Windows | Host | `native` (Tauri sidecar) |
| macOS | Host | `native` (Tauri sidecar) |
| Linux | Host | `native` (Tauri sidecar) |
| iOS | Controller | `bridged` (App Intents) |
| Android | Controller | `bridged` (Intent/Service) |
| Web | Unavailable | `unavailable` |

**Web Layer:** Shows `HEY Relay is not running. Start it from the tray, or run HEY on this device.` when `relay-required` feature accessed without relay.

---

## 10. Security Considerations

1. **No data storage**: Relay stores only device metadata and tokens
2. **Local-only**: Relay binds to localhost/loopback only
3. **Token rotation**: Automatic 24-hour rotation limits exposure
4. **Pair code entropy**: 31 bits, rate-limited by 5-min expiry
5. **Scope enforcement**: Relay validates action against device scope
6. **Trust kernel**: Destructive actions route through trust kernel on host
7. **Audit trail**: All relay actions logged via `auditLog.js`

---

## 11. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-10-21 | Initial contract |