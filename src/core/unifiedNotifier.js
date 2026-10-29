import { log as auditLog } from './auditLogger.js';

export const VALID_PRIORITIES = Object.freeze(['low', 'normal', 'urgent']);
export const VALID_CHANNELS = Object.freeze(['push', 'in_app', 'voice', 'email']);

export class UnifiedNotifier {
  constructor(options = {}) {
    this.auditLogger = options.auditLogger || auditLog;
    this.channelDispatchers = {
      push: options.pushDispatcher || (async () => ({ delivered: true })),
      in_app: options.inAppDispatcher || (async () => ({ delivered: true })),
      voice: options.voiceDispatcher || (async () => ({ delivered: true })),
      email: options.emailDispatcher || (async () => ({ delivered: true })),
      ...(options.channelDispatchers || {}),
    };
    // Map<`${user}:${category}`, number[]> timestamps of normal notifications
    this.rateLimitWindows = new Map();
    // Default quiet hours: 22:00 to 07:00
    this.quietHours = options.quietHours || { startHour: 22, endHour: 7 };
    this.isQuietHoursFn = options.isQuietHours || null;
  }

  isQuietHours(date = new Date(), user = 'default') {
    if (typeof this.isQuietHoursFn === 'function') {
      return this.isQuietHoursFn(date, user);
    }
    const hour = date.getHours();
    const { startHour, endHour } = this.quietHours;
    if (startHour > endHour) {
      // Overnight range, e.g. 22 to 7
      return hour >= startHour || hour < endHour;
    }
    return hour >= startHour && hour < endHour;
  }

  _checkRateLimit(user, category, nowMs) {
    const key = `${user}:${category}`;
    const windowMs = 60 * 60 * 1000; // 1 hour
    let timestamps = this.rateLimitWindows.get(key) || [];
    timestamps = timestamps.filter((t) => nowMs - t < windowMs);
    this.rateLimitWindows.set(key, timestamps);

    if (timestamps.length >= 5) {
      return false; // Rate limit exceeded (max 5 per hour)
    }

    timestamps.push(nowMs);
    return true;
  }

  async notify({
    user = 'default',
    category = 'general',
    title,
    body = '',
    priority = 'normal',
    channels = ['in_app'],
    timestamp = null,
  }) {
    if (!title) {
      throw new TypeError('Notification title is required');
    }

    if (!VALID_PRIORITIES.includes(priority)) {
      throw new Error(`Invalid priority: "${priority}". Allowed: ${VALID_PRIORITIES.join(', ')}`);
    }

    // Validate channels
    for (const ch of channels) {
      if (!VALID_CHANNELS.includes(ch)) {
        throw new Error(`Unknown notification channel: "${ch}". Allowed: ${VALID_CHANNELS.join(', ')}`);
      }
    }

    const dateObj = timestamp ? new Date(timestamp) : new Date();
    const nowMs = dateObj.getTime();

    // Check quiet hours
    const quiet = this.isQuietHours(dateObj, user);
    if (quiet && priority !== 'urgent') {
      this._emitAudit('notify:blocked', user, {
        reason: 'quiet_hours',
        title,
        category,
        priority,
        channels,
      });
      return { delivered: false, blocked: true, reason: 'quiet_hours' };
    }

    // Check hourly cap for normal priority
    if (priority === 'normal') {
      const allowed = this._checkRateLimit(user, category, nowMs);
      if (!allowed) {
        this._emitAudit('notify:blocked', user, {
          reason: 'rate_limit_exceeded',
          title,
          category,
          priority,
          channels,
        });
        return { delivered: false, blocked: true, reason: 'rate_limit_exceeded' };
      }
    }

    // Deliver across channels
    const deliveryResults = {};
    for (const ch of channels) {
      const dispatcher = this.channelDispatchers[ch];
      if (dispatcher) {
        try {
          deliveryResults[ch] = await dispatcher({ user, category, title, body, priority });
        } catch (err) {
          deliveryResults[ch] = { delivered: false, error: err.message };
        }
      }
    }

    this._emitAudit('notify:sent', user, {
      title,
      category,
      priority,
      channels,
      deliveryResults,
    });

    return { delivered: true, blocked: false, deliveryResults };
  }

  _emitAudit(event_type, user, payload) {
    if (typeof this.auditLogger === 'function') {
      this.auditLogger({
        event_type,
        actor: user,
        payload,
      });
    }
  }
}

export const defaultNotifier = new UnifiedNotifier();

export function notify(params) {
  return defaultNotifier.notify(params);
}

export default {
  UnifiedNotifier,
  defaultNotifier,
  notify,
  VALID_PRIORITIES,
  VALID_CHANNELS,
};
