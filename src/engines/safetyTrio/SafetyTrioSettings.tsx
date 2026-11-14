// src/engines/safetyTrio/SafetyTrioSettings.tsx
// Settings UI for Safety Trio Engine

import { useState, useEffect } from 'react';
import { useEngine } from '../../core/engineContext';
import type { SafetyTrioEngine } from './SafetyTrioEngine';
import type { SafetyConfig, TrustLevel } from './types';

export function SafetyTrioSettings() {
  const { engine } = useEngine('safetyTrio') as { engine: SafetyTrioEngine | null };
  const [config, setConfig] = useState<SafetyConfig | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!engine) return;
    setConfig(engine.getConfig());
  }, [engine]);

  const handleSave = () => {
    if (!engine || !config) return;
    engine.updateConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!config) {
    return <div className="p-6 text-gray-400">Loading settings...</div>;
  }

  return (
    <div className="h-full overflow-y-auto p-6 max-w-2xl mx-auto space-y-6 bg-background">
      <div>
        <h2 className="text-xl font-bold text-white">Safety Trio Settings</h2>
        <p className="text-sm text-gray-400 mt-1">Configure privacy enforcement, security policies, and trust management.</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        {/* Privacy Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Privacy</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Data Retention (days)</label>
              <input
                type="number"
                min="1"
                max="3650"
                value={config.privacy.dataRetentionDays}
                onChange={e => setConfig({ ...config, privacy: { ...config.privacy, dataRetentionDays: parseInt(e.target.value) || 365 } })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.privacy.telemetryEnabled}
                onChange={e => setConfig({ ...config, privacy: { ...config.privacy, telemetryEnabled: e.target.checked } })}
                className="w-4 h-4 rounded bg-input border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-white">Enable Telemetry</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.privacy.analyticsEnabled}
                onChange={e => setConfig({ ...config, privacy: { ...config.privacy, analyticsEnabled: e.target.checked } })}
                className="w-4 h-4 rounded bg-input border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-white">Enable Analytics</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.privacy.crashReportingEnabled}
                onChange={e => setConfig({ ...config, privacy: { ...config.privacy, crashReportingEnabled: e.target.checked } })}
                className="w-4 h-4 rounded bg-input border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-white">Enable Crash Reporting</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.privacy.localProcessingOnly}
                onChange={e => setConfig({ ...config, privacy: { ...config.privacy, localProcessingOnly: e.target.checked } })}
                className="w-4 h-4 rounded bg-input border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-white">Local Processing Only (No Cloud)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.privacy.encryptionAtRest}
                onChange={e => setConfig({ ...config, privacy: { ...config.privacy, encryptionAtRest: e.target.checked } })}
                className="w-4 h-4 rounded bg-input border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-white">Encryption at Rest</span>
            </label>
          </div>
        </div>

        {/* Security Settings */}
        <div className="space-y-4 border-t border-border pt-6">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Security</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Session Timeout (ms)</label>
              <input
                type="number"
                min="300000"
                max="86400000"
                value={config.security.sessionTimeoutMs}
                onChange={e => setConfig({ ...config, security: { ...config.security, sessionTimeoutMs: parseInt(e.target.value) || 3600000 } })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Max Failed Auth Attempts</label>
              <input
                type="number"
                min="1"
                max="20"
                value={config.security.maxFailedAuthAttempts}
                onChange={e => setConfig({ ...config, security: { ...config.security, maxFailedAuthAttempts: parseInt(e.target.value) || 5 } })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Lockout Duration (ms)</label>
              <input
                type="number"
                min="60000"
                max="3600000"
                value={config.security.lockoutDurationMs}
                onChange={e => setConfig({ ...config, security: { ...config.security, lockoutDurationMs: parseInt(e.target.value) || 900000 } })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Audit Log Retention (days)</label>
              <input
                type="number"
                min="1"
                max="365"
                value={config.security.auditLogRetentionDays}
                onChange={e => setConfig({ ...config, security: { ...config.security, auditLogRetentionDays: parseInt(e.target.value) || 90 } })}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.security.requireMfa}
                onChange={e => setConfig({ ...config, security: { ...config.security, requireMfa: e.target.checked } })}
                className="w-4 h-4 rounded bg-input border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-white">Require MFA</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.security.encryptSensitiveFields}
                onChange={e => setConfig({ ...config, security: { ...config.security, encryptSensitiveFields: e.target.checked } })}
                className="w-4 h-4 rounded bg-input border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-white">Encrypt Sensitive Fields</span>
            </label>
          </div>
        </div>

        {/* Trust Settings */}
        <div className="space-y-4 border-t border-border pt-6">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Trust Management</h3>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Default Trust Level</label>
            <select
              value={config.trust.defaultTrustLevel}
              onChange={e => setConfig({ ...config, trust: { ...config.trust, defaultTrustLevel: e.target.value as TrustLevel } })}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="trusted">Trusted</option>
              <option value="neutral">Neutral</option>
              <option value="untrusted">Untrusted</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Trusted Domains (comma-separated)</label>
            <input
              type="text"
              value={config.trust.trustedDomains.join(', ')}
              onChange={e => setConfig({ ...config, trust: { ...config.trust, trustedDomains: e.target.value.split(',').map(d => d.trim()).filter(Boolean) } })}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
            />
            <span className="text-[10px] text-gray-500 mt-1 block">Domains automatically granted trusted status.</span>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Blocked Domains (comma-separated)</label>
            <input
              type="text"
              value={config.trust.blockedDomains.join(', ')}
              onChange={e => setConfig({ ...config, trust: { ...config.trust, blockedDomains: e.target.value.split(',').map(d => d.trim()).filter(Boolean) } })}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
            />
            <span className="text-[10px] text-gray-500 mt-1 block">Domains automatically blocked.</span>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Capabilities Requiring Verification (comma-separated)</label>
            <input
              type="text"
              value={config.trust.requireVerificationFor.join(', ')}
              onChange={e => setConfig({ ...config, trust: { ...config.trust, requireVerificationFor: e.target.value.split(',').map(d => d.trim()).filter(Boolean) } })}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
            />
            <span className="text-[10px] text-gray-500 mt-1 block">Capability IDs that require explicit trust verification before execution.</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm text-white font-medium">Auto-Trust Owners</label>
              <p className="text-xs text-gray-400">Automatically trust owner accounts and their agents</p>
            </div>
            <input
              type="checkbox"
              checked={config.trust.autoTrustOwners}
              onChange={e => setConfig({ ...config, trust: { ...config.trust, autoTrustOwners: e.target.checked } })}
              className="w-4 h-4 rounded bg-input border-border text-primary focus:ring-primary"
            />
          </div>
        </div>

        {/* Budget */}
        <div className="space-y-4 border-t border-border pt-6">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Resource Management</h3>

          <div>
            <label className="block text-sm text-gray-400 mb-1">HCU Budget Per Hour</label>
            <input
              type="number"
              min="0.1"
              max="5"
              step="0.1"
              value={config.hcuBudgetPerHour}
              onChange={e => setConfig({ ...config, hcuBudgetPerHour: parseFloat(e.target.value) || 0.5 })}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-border pt-6">
          {saved ? (
            <span className="text-xs text-green-400 font-medium">Settings saved successfully!</span>
          ) : (
            <span></span>
          )}
          <button
            onClick={handleSave}
            className="bg-primary hover:bg-primary/85 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

export default SafetyTrioSettings;