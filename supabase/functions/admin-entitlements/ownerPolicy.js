export function parseOwners(value) {
  const owners = String(value || '').split(',').map(email => email.trim().toLowerCase()).filter(Boolean);
  if (owners.length !== 3 || new Set(owners).size !== 3 || owners.some(email => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) throw new Error('Configure exactly three distinct owner identities.');
  return owners;
}

export function validateOwnerRequest(body, owners) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('A request object is required.');
  if (!['inspect', 'grant', 'revoke'].includes(body.action)) throw new Error('Unknown action.');
  const targetEmail = typeof body.targetEmail === 'string' ? body.targetEmail.trim().toLowerCase() : '';
  if (targetEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) throw new Error('A valid target email is required.');
  if (body.action !== 'inspect' && (typeof body.requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.requestId))) throw new Error('A unique request identifier is required for account changes.');
  if (body.action === 'grant') {
    if (!['free', 'pro', 'elite'].includes(body.plan) || !['user', 'owner'].includes(body.role)) throw new Error('Choose a valid plan and role.');
    if ((body.role === 'owner') !== owners.includes(targetEmail)) throw new Error('Owner identities are fixed. Ordinary grants cannot add or remove an owner.');
  }
  if (body.action === 'revoke' && owners.includes(targetEmail)) throw new Error('The three owner identities cannot be revoked through ordinary account controls.');
  if (body.action !== 'inspect') {
    const expected = { action: body.action, targetEmail, requestId: body.requestId, plan: body.action === 'grant' ? body.plan : undefined, role: body.action === 'grant' ? body.role : undefined };
    if (!body.confirmation || typeof body.confirmation !== 'object' || Array.isArray(body.confirmation)) throw new Error('Review and confirm the exact account change before sending it.');
    for (const [key, value] of Object.entries(expected)) if (body.confirmation[key] !== value) throw new Error('The confirmation does not match the requested account change.');
  }
  return { action: body.action, targetEmail, plan: body.plan, role: body.role, requestId: body.requestId };
}
