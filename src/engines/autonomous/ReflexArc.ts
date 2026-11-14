// src/engines/autonomous/ReflexArc.ts
// Reflex Arc — Automatic detection and dismissal of cookie banners, popups, modals.
// Fast, involuntary responses to common UI annoyances.

import type { Platform, ExecutionContext } from './types';
import { MotorCortex, createMotorCortex } from './MotorCortex';
import { logToCosmos } from '../../core/cosmosMemory';

export interface ReflexPattern {
  id: string;
  name: string;
  selectors: string[]; // CSS selectors to match
  dismissSelectors: string[]; // Buttons/links to click to dismiss
  action: 'click' | 'keypress' | 'custom';
  actionParams?: Record<string, unknown>;
  priority: number; // Higher = checked first
  platforms: Platform[];
  enabled: boolean;
}

export interface ReflexArcConfig {
  enabled: boolean;
  patterns: ReflexPattern[];
  checkIntervalMs: number;
  maxDismissesPerSession: number;
  cooldownMs: number; // Min time between same pattern triggers
  logDismisses: boolean;
}

const DEFAULT_PATTERNS: ReflexPattern[] = [
  // Cookie consent banners
  {
    id: 'cookie-banner-generic',
    name: 'Generic Cookie Banner',
    selectors: [
      '[id*="cookie"]', '[class*="cookie"]',
      '[id*="consent"]', '[class*="consent"]',
      '[id*="gdpr"]', '[class*="gdpr"]',
      '[data-testid*="cookie"]', '[data-testid*="consent"]',
    ],
    dismissSelectors: [
      'button:contains("Accept")', 'button:contains("Agree")',
      'button:contains("Allow")', 'button:contains("OK")',
      'button:contains("I agree")', 'button:contains("Accept all")',
      '[aria-label*="accept" i]', '[aria-label*="agree" i]',
      'a:contains("Accept")', 'a:contains("Agree")',
    ],
    action: 'click',
    priority: 100,
    platforms: ['browser'],
    enabled: true,
  },
  {
    id: 'cookie-banner-onetrust',
    name: 'OneTrust Cookie Banner',
    selectors: ['#onetrust-banner-sdk', '#onetrust-consent-sdk', '.ot-sdk-container'],
    dismissSelectors: [
      '#onetrust-accept-btn-handler',
      '.ot-sdk-show-settings + button',
      'button[aria-label="Accept all cookies"]',
    ],
    action: 'click',
    priority: 90,
    platforms: ['browser'],
    enabled: true,
  },
  {
    id: 'cookie-banner-cookieyes',
    name: 'CookieYes Banner',
    selectors: ['#cookieyes-banner', '.cky-banner'],
    dismissSelectors: [
      '.cky-btn-accept',
      'button.cky-btn.cky-btn-accept',
    ],
    action: 'click',
    priority: 90,
    platforms: ['browser'],
    enabled: true,
  },
  {
    id: 'cookie-banner-cookiebot',
    name: 'Cookiebot Banner',
    selectors: ['#CybotCookiebotDialog', '.CybotCookiebotDialog'],
    dismissSelectors: [
      '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
      'button.CybotCookiebotDialogBodyButton[aria-label*="Allow all"]',
    ],
    action: 'click',
    priority: 90,
    platforms: ['browser'],
    enabled: true,
  },

  // Newsletter popups
  {
    id: 'newsletter-popup-generic',
    name: 'Generic Newsletter Popup',
    selectors: [
      '[id*="newsletter"]', '[class*="newsletter"]',
      '[id*="subscribe"]', '[class*="subscribe"]',
      '[id*="email-capture"]', '[class*="email-capture"]',
    ],
    dismissSelectors: [
      'button:contains("No thanks")', 'button:contains("Not now")',
      'button:contains("Maybe later")', 'button:contains("Close")',
      '[aria-label*="close" i]', '[aria-label*="dismiss" i]',
      '.close-button', '.popup-close', '.modal-close',
    ],
    action: 'click',
    priority: 80,
    platforms: ['browser'],
    enabled: true,
  },

  // Generic modals/overlays
  {
    id: 'modal-generic',
    name: 'Generic Modal/Overlay',
    selectors: [
      '[role="dialog"]', '[role="alertdialog"]',
      '.modal', '.overlay', '.popup',
      '[class*="modal"]', '[class*="overlay"]', '[class*="popup"]',
    ],
    dismissSelectors: [
      'button:contains("Close")', 'button:contains("Dismiss")',
      '[aria-label*="close" i]', '[aria-label*="dismiss" i]',
      '.close', '.modal-close', '.overlay-close',
      'button[aria-label="Close"]',
    ],
    action: 'click',
    priority: 70,
    platforms: ['browser'],
    enabled: true,
  },

  // Chat widgets
  {
    id: 'chat-widget-intercom',
    name: 'Intercom Chat Widget',
    selectors: ['#intercom-container', '.intercom-app'],
    dismissSelectors: [
      '.intercom-close', '[aria-label="Close Intercom"]',
      '.intercom-launcher-close',
    ],
    action: 'click',
    priority: 60,
    platforms: ['browser'],
    enabled: true,
  },
  {
    id: 'chat-widget-zendesk',
    name: 'Zendesk Chat Widget',
    selectors: ['#launcher', '.zEWidget', '#zendesk-web-widget'],
    dismissSelectors: [
      '.zEWidget-launcher-close', '[aria-label*="Close" i]',
    ],
    action: 'click',
    priority: 60,
    platforms: ['browser'],
    enabled: true,
  },

  // App install prompts
  {
    id: 'app-install-prompt',
    name: 'App Install Prompt',
    selectors: [
      '[data-testid*="install"]', '[id*="install-prompt"]',
      '.app-install-banner', '[class*="install-prompt"]',
    ],
    dismissSelectors: [
      'button:contains("Not now")', 'button:contains("Later")',
      'button:contains("No thanks")', '[aria-label*="dismiss" i]',
    ],
    action: 'click',
    priority: 50,
    platforms: ['browser'],
    enabled: true,
  },

  // Permission prompts
  {
    id: 'permission-prompt-notifications',
    name: 'Notification Permission Prompt',
    selectors: ['[role="dialog"]:has-text("notifications")', '.permission-prompt-notifications'],
    dismissSelectors: [
      'button:contains("Block")', 'button:contains("Deny")',
      'button:contains("Not now")',
    ],
    action: 'click',
    priority: 40,
    platforms: ['browser'],
    enabled: true,
  },
  {
    id: 'permission-prompt-location',
    name: 'Location Permission Prompt',
    selectors: ['[role="dialog"]:has-text("location")', '.permission-prompt-location'],
    dismissSelectors: [
      'button:contains("Block")', 'button:contains("Deny")',
    ],
    action: 'click',
    priority: 40,
    platforms: ['browser'],
    enabled: true,
  },

  // Mobile-specific patterns
  {
    id: 'mobile-app-rate-prompt',
    name: 'App Rate Prompt (iOS/Android)',
    selectors: [
      '[id*="rate"]', '[class*="rate"]',
      '[data-testid*="rate"]',
    ],
    dismissSelectors: [
      'button:contains("Not now")', 'button:contains("Maybe later")',
      'button:contains("No thanks")',
    ],
    action: 'click',
    priority: 50,
    platforms: ['phone'],
    enabled: true,
  },
  {
    id: 'mobile-permission-dialog',
    name: 'System Permission Dialog',
    selectors: [
      '[role="alertdialog"]',
      '.system-permission-dialog',
    ],
    dismissSelectors: [
      'button:contains("Don\'t allow")', 'button:contains("Deny")',
    ],
    action: 'click',
    priority: 30,
    platforms: ['phone'],
    enabled: true,
  },
];

const DEFAULT_CONFIG: ReflexArcConfig = {
  enabled: true,
  patterns: DEFAULT_PATTERNS,
  checkIntervalMs: 1000,
  maxDismissesPerSession: 50,
  cooldownMs: 5000,
  logDismisses: true,
};

interface TriggeredPattern {
  pattern: ReflexPattern;
  element: Element;
  dismissElement: Element;
  timestamp: number;
}

export class ReflexArc {
  private config: ReflexArcConfig;
  private motorCortex: MotorCortex;
  private dismissCount: number = 0;
  private lastTriggered: Map<string, number> = new Map();
  private isChecking: boolean = false;
  private checkTimer: ReturnType<typeof setInterval> | null = null;
  private getDOM: (() => Promise<Document>) | null = null;
  private executeClick: ((x: number, y: number) => Promise<void>) | null = null;
  private sessionId: string;

  constructor(config: Partial<ReflexArcConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.motorCortex = createMotorCortex();
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  /**
   * Set the DOM accessor (called by AutonomousEngine with adapter).
   */
  setDOMAccessor(getDOM: () => Promise<Document>): void {
    this.getDOM = getDOM;
  }

  /**
   * Set the click executor (uses MotorCortex path).
   */
  setClickExecutor(executor: (x: number, y: number) => Promise<void>): void {
    this.executeClick = executor;
  }

  /**
   * Start automatic reflex checking.
   */
  startChecking(): void {
    if (!this.config.enabled || this.isChecking) return;
    if (!this.getDOM || !this.executeClick) {
      console.warn('ReflexArc: DOM accessor or click executor not set');
      return;
    }

    this.isChecking = true;
    this.checkTimer = setInterval(() => this.checkAndDismiss(), this.config.checkIntervalMs);
  }

  /**
   * Stop automatic reflex checking.
   */
  stopChecking(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
    this.isChecking = false;
  }

  /**
   * Manually check for reflex patterns and dismiss them.
   */
  async checkAndDismiss(): Promise<TriggeredPattern[]> {
    if (!this.getDOM || !this.executeClick) return [];
    if (this.dismissCount >= this.config.maxDismissesPerSession) return [];

    const triggered: TriggeredPattern[] = [];

    try {
      const dom = await this.getDOM();
      const patterns = this.getEnabledPatterns();

      for (const pattern of patterns) {
        // Check cooldown
        const lastTime = this.lastTriggered.get(pattern.id) || 0;
        if (Date.now() - lastTime < this.config.cooldownMs) continue;

        // Find matching elements
        const elements = this.findElements(dom, pattern.selectors);
        if (elements.length === 0) continue;

        // Find dismiss button within or near the matched element
        for (const element of elements) {
          const dismissElement = this.findDismissElement(element, pattern.dismissSelectors, dom);
          if (dismissElement) {
            // Click the dismiss element
            await this.clickElement(dismissElement);

            triggered.push({
              pattern,
              element,
              dismissElement,
              timestamp: Date.now(),
            });

            this.lastTriggered.set(pattern.id, Date.now());
            this.dismissCount++;

            if (this.config.logDismisses) {
              await this.logDismiss(pattern, element, dismissElement);
            }

            // Small delay between dismisses
            await this.sleep(200);
            break; // Only dismiss one per pattern per check
          }
        }

        if (this.dismissCount >= this.config.maxDismissesPerSession) break;
      }
    } catch (e) {
      // Ignore errors during reflex check
      console.debug('ReflexArc check error:', e);
    }

    return triggered;
  }

  /**
   * Check specific patterns (used by AutonomousEngine).
   */
  async checkPatterns(patternSelectors: string[], getDOM: () => Promise<Document>): Promise<string[]> {
    const triggered: string[] = [];
    try {
      const dom = await getDOM();
      for (const selector of patternSelectors) {
        const elements = dom.querySelectorAll(selector);
        if (elements.length > 0) {
          triggered.push(selector);
        }
      }
    } catch {
      // Ignore
    }
    return triggered;
  }

  /**
   * Dismiss a specific element by selector.
   */
  async dismissSelector(selector: string, dismissSelector?: string): Promise<boolean> {
    if (!this.getDOM || !this.executeClick) return false;

    try {
      const dom = await this.getDOM();
      const elements = dom.querySelectorAll(selector);
      for (const element of elements) {
        const targetSelector = dismissSelector || 'button, [role="button"], a';
        const dismissEl = element.querySelector(targetSelector) ||
          element.closest(targetSelector);
        if (dismissEl) {
          await this.clickElement(dismissEl);
          return true;
        }
      }
    } catch {
      // Ignore
    }
    return false;
  }

  private getEnabledPatterns(): ReflexPattern[] {
    return this.config.patterns
      .filter(p => p.enabled)
      .sort((a, b) => b.priority - a.priority);
  }

  private findElements(dom: Document, selectors: string[]): Element[] {
    const elements: Element[] = [];
    for (const selector of selectors) {
      try {
        const found = dom.querySelectorAll(selector);
        elements.push(...Array.from(found));
      } catch {
        // Invalid selector, skip
      }
    }
    return elements;
  }

  private findDismissElement(
    container: Element,
    dismissSelectors: string[],
    dom: Document
  ): Element | null {
    // First, look inside the container
    for (const selector of dismissSelectors) {
      try {
        // Handle :contains pseudo-selector
        if (selector.includes(':contains(')) {
          const textMatch = selector.match(/:contains\(["']?([^"']+)["']?\)/);
          const baseSelector = selector.replace(/:contains\([^)]+\)/, '');
          if (textMatch) {
            const elements = container.querySelectorAll(baseSelector || '*');
            for (const el of elements) {
              if (el.textContent?.toLowerCase().includes(textMatch[1].toLowerCase())) {
                return el;
              }
            }
          }
        } else {
          const found = container.querySelector(selector);
          if (found) return found;
        }
      } catch {
        // Invalid selector
      }
    }

    // Then look for common dismiss patterns in the container
    const commonSelectors = [
      'button[aria-label*="close" i]',
      'button[aria-label*="dismiss" i]',
      '[role="button"][aria-label*="close" i]',
      '.close-button', '.dismiss-button',
      'button.close', 'button.dismiss',
    ];

    for (const selector of commonSelectors) {
      try {
        const found = container.querySelector(selector);
        if (found) return found;
      } catch { }
    }

    // Finally, check siblings/parent for dismiss button
    let parent = container.parentElement;
    for (let i = 0; i < 3 && parent; i++) {
      for (const selector of dismissSelectors) {
        try {
          if (selector.includes(':contains(')) continue;
          const found = parent.querySelector(selector);
          if (found && found !== container) return found;
        } catch { }
      }
      parent = parent.parentElement;
    }

    return null;
  }

  private async clickElement(element: Element): Promise<void> {
    if (!this.executeClick) return;

    try {
      // Get element position
      const rect = element.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      // Use MotorCortex for human-like click
      await this.executeClick(x, y);
    } catch {
      // Fallback: direct click if executor fails
      try {
        (element as HTMLElement).click();
      } catch { }
    }
  }

  private async logDismiss(pattern: ReflexPattern, element: Element, dismissElement: Element): Promise<void> {
    try {
      await logToCosmos({
        type: 'reflex_arc_dismiss',
        sessionId: this.sessionId,
        patternId: pattern.id,
        patternName: pattern.name,
        elementTag: element.tagName,
        elementClass: element.className,
        elementId: element.id,
        dismissElementTag: dismissElement.tagName,
        dismissElementClass: dismissElement.className,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Continue if Cosmos unavailable
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Configuration methods
  addPattern(pattern: ReflexPattern): void {
    this.config.patterns.push(pattern);
  }

  removePattern(patternId: string): boolean {
    const index = this.config.patterns.findIndex(p => p.id === patternId);
    if (index >= 0) {
      this.config.patterns.splice(index, 1);
      return true;
    }
    return false;
  }

  enablePattern(patternId: string): boolean {
    const pattern = this.config.patterns.find(p => p.id === patternId);
    if (pattern) {
      pattern.enabled = true;
      return true;
    }
    return false;
  }

  disablePattern(patternId: string): boolean {
    const pattern = this.config.patterns.find(p => p.id === patternId);
    if (pattern) {
      pattern.enabled = false;
      return true;
    }
    return false;
  }

  getPatterns(): ReflexPattern[] {
    return [...this.config.patterns];
  }

  getEnabledPatternsList(): ReflexPattern[] {
    return this.getEnabledPatterns();
  }

  getDismissCount(): number {
    return this.dismissCount;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getConfig(): ReflexArcConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<ReflexArcConfig>): void {
    this.config = { ...this.config, ...config };
  }

  isRunning(): boolean {
    return this.isChecking;
  }
}

export function createReflexArc(config?: Partial<ReflexArcConfig>): ReflexArc {
  return new ReflexArc(config);
}

export default ReflexArc;