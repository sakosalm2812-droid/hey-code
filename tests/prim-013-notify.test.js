import test from 'node:test';
import assert from 'node:assert/strict';
import { UnifiedNotifier } from '../src/core/unifiedNotifier.js';

test('PRIM-013 Acceptance Test 1: Normal notification during quiet hours is blocked', async () => {
  const auditLogs = [];
  const notifier = new UnifiedNotifier({
    auditLogger: (e) => auditLogs.push(e),
    isQuietHours: () => true, // Force quiet hours
  });

  const res = await notifier.notify({
    user: 'alice',
    title: 'Routine Update',
    priority: 'normal',
  });

  assert.equal(res.delivered, false);
  assert.equal(res.blocked, true);
  assert.equal(res.reason, 'quiet_hours');
  assert.equal(auditLogs.length, 1);
  assert.equal(auditLogs[0].event_type, 'notify:blocked');
});

test('PRIM-013 Acceptance Test 2: Urgent notification during quiet hours is delivered', async () => {
  const auditLogs = [];
  const notifier = new UnifiedNotifier({
    auditLogger: (e) => auditLogs.push(e),
    isQuietHours: () => true, // Quiet hours active
  });

  const res = await notifier.notify({
    user: 'alice',
    title: 'Security Alert: Intrusion Detected',
    priority: 'urgent',
  });

  assert.equal(res.delivered, true);
  assert.equal(res.blocked, false);
  assert.equal(auditLogs.length, 1);
  assert.equal(auditLogs[0].event_type, 'notify:sent');
});

test('PRIM-013 Acceptance Test 3: Rate limit blocks 6th normal notification in an hour', async () => {
  const notifier = new UnifiedNotifier({
    isQuietHours: () => false,
  });

  const fixedTime = Date.now();

  // Send 5 normal notifications
  for (let i = 1; i <= 5; i++) {
    const res = await notifier.notify({
      user: 'bob',
      category: 'updates',
      title: `Update #${i}`,
      priority: 'normal',
      timestamp: fixedTime + i * 1000,
    });
    assert.equal(res.delivered, true, `Notification #${i} should be delivered`);
  }

  // 6th normal notification within same hour must be blocked
  const res6 = await notifier.notify({
    user: 'bob',
    category: 'updates',
    title: 'Update #6 (Spam)',
    priority: 'normal',
    timestamp: fixedTime + 6000,
  });

  assert.equal(res6.delivered, false);
  assert.equal(res6.blocked, true);
  assert.equal(res6.reason, 'rate_limit_exceeded');
});

test('PRIM-013 Acceptance Test 4: Multi-channel delivery works', async () => {
  const channelsCalled = [];
  const notifier = new UnifiedNotifier({
    isQuietHours: () => false,
    channelDispatchers: {
      push: async (p) => {
        channelsCalled.push('push');
        return { delivered: true };
      },
      in_app: async (p) => {
        channelsCalled.push('in_app');
        return { delivered: true };
      },
      email: async (p) => {
        channelsCalled.push('email');
        return { delivered: true };
      },
    },
  });

  const res = await notifier.notify({
    user: 'carol',
    title: 'Multi Channel Test',
    channels: ['push', 'in_app', 'email'],
  });

  assert.equal(res.delivered, true);
  assert.deepEqual(channelsCalled.sort(), ['email', 'in_app', 'push']);
  assert.equal(res.deliveryResults.push.delivered, true);
  assert.equal(res.deliveryResults.email.delivered, true);
});

test('PRIM-013 Acceptance Test 5: Blocked notification is still logged', async () => {
  const auditLogs = [];
  const notifier = new UnifiedNotifier({
    auditLogger: (e) => auditLogs.push(e),
    isQuietHours: () => true,
  });

  await notifier.notify({
    user: 'dave',
    title: 'Low priority ping',
    priority: 'low',
  });

  assert.equal(auditLogs.length, 1);
  assert.equal(auditLogs[0].event_type, 'notify:blocked');
  assert.equal(auditLogs[0].payload.reason, 'quiet_hours');
});

test('PRIM-013 Acceptance Test 6: Unknown channel is rejected', async () => {
  const notifier = new UnifiedNotifier();
  await assert.rejects(
    async () => {
      await notifier.notify({
        user: 'eve',
        title: 'Fax message',
        channels: ['push', 'fax'], // fax is unknown
      });
    },
    /Unknown notification channel/
  );
});
