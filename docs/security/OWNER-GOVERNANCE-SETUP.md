# Owner account-change boundary

The final specification requires exactly three top-level owners. Configure `HEY_OWNER_EMAILS` on the server with three distinct verified emails. No client owner list grants authority. Ordinary grants cannot add a fourth owner, demote one of the three, or revoke their identity.

Enable TOTP enrollment and verification in Supabase Auth. Each owner opens Owner Access, enrolls an authenticator if needed, and verifies its code. The function authenticates the token, checks the verified owner email and requires an AAL2 session before inspecting or changing accounts. A client readiness label is not authorization.

Apply existing entitlement migrations and `20260930010000_owner_change_receipts.sql` before deploying `admin-entitlements`. The new function requires that RPC and fails closed if it is absent. Deploy the updated frontend and function together: older mutation requests omit confirmation and the request identifier and are rejected.

Grant and revoke have a separate review surface showing the exact email and requested access. The final confirmation sends a unique request identifier. The server derives actor and target identifiers itself. The database changes access and appends a private before/after receipt in one transaction. A repeated identical request returns the receipt without repeating the write; conflicting reuse is rejected. A timeout is not proof of failure: inspect the destination before preparing a new change.

Verify in staging: preflight, non-owner denial, unverified-email denial, AAL1 denial, TOTP enrollment and elevation, inspection, grant, revoke, receipt persistence, duplicate request handling, conflicting request rejection, database outage and network loss. No secrets, authenticator codes or enrollment QR images belong in logs or reports.

Local boundary tests and embedded PostgreSQL checks do not establish hosted MFA configuration, real token/session behavior or deployment success. Passkeys, trusted-device enforcement, recent reauthentication policy, the wider evolution/release console and three-owner public-extension voting remain separate incomplete requirements.

Rollback requires compatible frontend/function/database versions. Preserve receipts. Do not drop the receipt table to undo deployment. Restoring the old function removes these guards and is not an acceptable security rollback; disable mutations while repairing deployment.
