// src/engines/safetyTrio/SafetyTrioDashboard.tsx
// Dashboard UI for Safety Trio Engine

import { useState, useEffect } from 'react';
import { useEngine } from '../../core/engineContext';
import type { SafetyTrioEngine } from './SafetyTrioEngine';
import type { AuditEvent, PrivacyEvent, TrustEvent, SecurityAlert, SafetyEvent, SafetyHealth, TrustLevel } from './types';

export function SafetyTrioDashboard() {
  const { engine } = useEngine('safetyTrio') as { engine: SafetyTrioEngine | null };
  const [health, setHealth] = useState<SafetyHealth | null>(null);
  const [auditLog, setAuditLog] = useState<AuditEvent[]>([]);
  const [privacyEvents, setPrivacyEvents] = useState<PrivacyEvent[]>([]);
  const [trustEvents, setTrustEvents] = useState<TrustEvent[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState<'audit' | 'privacy' | 'trust' | 'alerts'>('audit');

  useEffect(() => {
    if (!engine) return;

    const init = async () => {
      await engine.initialize();
      setIsInitialized(true);
      startPolling();
    };

    const unsubAudit = engine.onEvent('audit_logged', (e) => setAuditLog(prev => [e.event, ...prev.slice(0, 99)]));
    const unsubPrivacy = engine.onEvent('privacy_event', (e) => setPrivacyEvents(prev => [e.event, ...prev.slice(0, 99)]));
    const unsubTrust = engine.onEvent('trust_changed', (e) => setTrustEvents(prev => [e.event, ...prev.slice(0, 99)]));
    const unsubAlert = engine.onEvent('security_alert', (e) => setAlerts(engine.getActiveAlerts()));

    init();

    return () => {
      unsubAudit();
      unsubPrivacy();
      unsubTrust();
      unsubAlert();
    };
  }, [engine]);

  const startPolling = () => {
    if (!engine) return;
    const interval = setInterval(() => {
      setHealth(engine.getHealth());
      setAuditLog(engine.getAuditLog(100));
      setPrivacyEvents(engine.getPrivacyEvents(100));
      setTrustEvents(engine.getTrustEvents(100));
      setAlerts(engine.getActiveAlerts());
    }, 3000);
    return () => clearInterval(interval);
  };

  if (!engine || !isInitialized) {
    return (
      <div className="p-6 text-center text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        Initializing Safety Trio...
      </div>
    );
  }

  const trustColors: Record<TrustLevel, string> = {
    trusted: 'text-green-400 bg-green-900/30 border-green-700/50',
    neutral: 'text-gray-400 bg-gray-900/30 border-gray-700/50',
    untrusted: 'text-yellow-400 bg-yellow-900/30 border-yellow-700/50',
    blocked: 'text-red-400 bg-red-900/30 border-red-700/50',
  };

  const riskColors: Record<AuditEvent['riskLevel'], string> = {
    low: 'text-green-400',
    medium: 'text-yellow-400',
    high: 'text-orange-400',
    critical: 'text-red-400',
  };

  const alertSeverityColors: Record<SecurityAlert['severity'], string> = {
    low: 'text-blue-400 bg-blue-900/30 border-blue-700/50',
    medium: 'text-yellow-400 bg-yellow-900/30 border-yellow-700/50',
    high: 'text-orange-400 bg-orange-900/30 border-orange-700/50',
    critical: 'text-red-400 bg-red-900/30 border-red-700/50',
  };

  const activeAlertCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <div className="h-full flex flex-col gap-4 p-4 bg-background">
      {/* Header Stats */}
      <div className="flex gap-4 min-h-0 overflow-x-auto pb-2">
        <div className={`flex-1 min-w-[160px] p-4 rounded-xl border ${trustColors[health?.trustEntitiesTracked > 0 ? 'trusted' : 'neutral']}`}>
          <div className="text-xs text-gray-400 uppercase tracking-wide">Trust Entities</div>
          <div className="text-3xl font-bold text-white">{health?.trustEntitiesTracked || 0}</div>
        </div>
        <div className="flex-1 min-w-[160px] bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Audit Events</div>
          <div className="text-3xl font-bold text-white">{health?.auditLogSize || 0}</div>
        </div>
        <div className="flex-1 min-w-[160px] bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Privacy Events</div>
          <div className="text-3xl font-bold text-white">{health?.privacyEventsCount || 0}</div>
        </div>
        <div className={`flex-1 min-w-[160px] p-4 rounded-xl border ${activeAlertCount > 0 ? 'border-red-500/50' : 'border-border'}`}>
          <div className="text-xs text-gray-400 uppercase tracking-wide">Active Alerts</div>
          <div className="text-3xl font-bold {activeAlertCount > 0 ? 'text-red-400' : 'text-green-400'}">{activeAlertCount}</div>
        </div>
        <div className="flex-1 min-w-[160px] bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">HCU / Hour</div>
          <div className="text-3xl font-bold text-white">{health?.totalHCUSpent.toFixed(3) || 0} / {health?.hcuBudgetPerHour || 0}</div>
        </div>
        <div className="flex-1 min-w-[160px] bg-card p-4 rounded-xl border border-border">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Status</div>
          <div className="text-3xl font-bold {health?.isRunning ? 'text-green-400' : 'text-red-400'}">{health?.isRunning ? 'ACTIVE' : 'STOPPED'}</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-card rounded-xl border border-border p-1">
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'audit' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
        >
          Audit Log ({auditLog.length})
        </button>
        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'privacy' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
        >
          Privacy ({privacyEvents.length})
        </button>
        <button
          onClick={() => setActiveTab('trust')}
          className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'trust' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
        >
          Trust ({trustEvents.length})
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'alerts' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
        >
          Alerts ({alerts.length})
        </button>
      </div>

      {/* Content Panels */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === 'audit' && (
          <AuditLogPanel events={auditLog} riskColors={riskColors} />
        )}
        {activeTab === 'privacy' && (
          <PrivacyPanel events={privacyEvents} onExport={() => {}} onDelete={() => {}} />
        )}
        {activeTab === 'trust' && (
          <TrustPanel events={trustEvents} trustColors={trustColors} engine={engine} />
        )}
        {activeTab === 'alerts' && (
          <AlertsPanel alerts={alerts} alertSeverityColors={alertSeverityColors} engine={engine} />
        )}
      </div>
    </div>
  );
}

function AuditLogPanel({ events, riskColors }: { events: AuditEvent[], riskColors: Record<AuditEvent['riskLevel'], string> }) {
  if (events.length === 0) {
    return <div className="text-center text-gray-500 py-20">No audit events yet</div>;
  }

  return (
    <div className="space-y-2 p-4">
      <div className="grid grid-cols-6 gap-2 text-[10px] font-medium text-gray-400 uppercase tracking-wider px-2 py-2 bg-background/50 rounded-lg">
        <span>Time</span>
        <span>Type</span>
        <span>Actor</span>
        <span>Resource</span>
        <span>Result</span>
        <span>Risk</span>
      </div>
      <div className="max-h-[500px] overflow-y-auto space-y-1">
        {events.map(event => (
          <div key={event.id} className="grid grid-cols-6 gap-2 text-xs px-2 py-2 bg-card rounded-lg border border-border hover:bg-white/5 transition-colors">
            <span className="font-mono text-gray-500">{new Date(event.timestamp).toLocaleTimeString()}</span>
            <span className="text-gray-300 uppercase">{event.type}</span>
            <span className="text-white truncate font-mono">{event.actor}</span>
            <span className="text-gray-400 truncate">{event.resource}</span>
            <span className={event.result === 'success' ? 'text-green-400' : event.result === 'denied' ? 'text-red-400' : 'text-yellow-400'}>
              {event.result.toUpperCase()}
            </span>
            <span className={riskColors[event.riskLevel]}>● {event.riskLevel.toUpperCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PrivacyPanel({ events, onExport, onDelete }: { events: PrivacyEvent[], onExport: () => void, onDelete: () => void }) {
  if (events.length === 0) {
    return <div className="text-center text-gray-500 py-20">No privacy events yet</div>;
  }

  const typeColors: Record<PrivacyEvent['type'], string> = {
    data_accessed: 'text-blue-400',
    data_exported: 'text-green-400',
    data_deleted: 'text-red-400',
    consent_changed: 'text-purple-400',
    retention_applied: 'text-yellow-400',
  };

  return (
    <div className="space-y-2 p-4">
      <div className="grid grid-cols-5 gap-2 text-[10px] font-medium text-gray-400 uppercase tracking-wider px-2 py-2 bg-background/50 rounded-lg">
        <span>Time</span>
        <span>Type</span>
        <span>Data Type</span>
        <span>Subject</span>
        <span>Actor</span>
      </div>
      <div className="max-h-[500px] overflow-y-auto space-y-1">
        {events.map(event => (
          <div key={event.id} className="grid grid-cols-5 gap-2 text-xs px-2 py-2 bg-card rounded-lg border border-border hover:bg-white/5 transition-colors">
            <span className="font-mono text-gray-500">{new Date(event.timestamp).toLocaleTimeString()}</span>
            <span className={typeColors[event.type]}>{event.type.replace('_', ' ').toUpperCase()}</span>
            <span className="text-gray-300">{event.dataType}</span>
            <span className="text-white truncate font-mono">{event.subjectId}</span>
            <span className="text-gray-400 truncate font-mono">{event.actorId}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrustPanel({ events, trustColors, engine }: { events: TrustEvent[], trustColors: Record<TrustLevel, string>, engine: SafetyTrioEngine }) {
  const allTrustLevels = engine.getAllTrustLevels();

  return (
    <div className="p-4 space-y-6">
      {/* Current Trust Levels */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-semibold text-white mb-4">Current Trust Levels</h3>
        <div className="space-y-2">
          {Array.from(allTrustLevels.entries()).map(([key, level]) => {
            const [entityType, entityId] = key.split(':');
            return (
              <div key={key} className={`flex items-center justify-between p-3 rounded-lg ${trustColors[level]}`}>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wide">{entityType}</span>
                  <span className="font-mono text-white">{entityId}</span>
                </div>
                <span className="font-medium uppercase tracking-wider">{level}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trust Events History */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-semibold text-white mb-4">Trust Change History</h3>
        {events.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No trust changes recorded</div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {events.map(event => (
              <div key={event.id} className="p-3 bg-background/50 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-300 uppercase">{event.entityType}</span>
                    <span className="font-mono text-white">{event.entityId}</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono">{new Date(event.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className={trustColors[event.previousLevel]}>● {event.previousLevel}</span>
                  <span className="text-gray-500">→</span>
                  <span className={trustColors[event.newLevel]} font-bold>● {event.newLevel}</span>
                  <span className="text-gray-500 flex-1 truncate">{event.reason}</span>
                  <span className="text-[10px] text-gray-400">by {event.changedBy}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AlertsPanel({ alerts, alertSeverityColors, engine }: { alerts: SecurityAlert[], alertSeverityColors: Record<SecurityAlert['severity'], string>, engine: SafetyTrioEngine }) {
  if (alerts.length === 0) {
    return <div className="text-center text-gray-500 py-20">No security alerts</div>;
  }

  return (
    <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
      {alerts.map(alert => (
        <div key={alert.id} className={`p-4 rounded-xl border ${alertSeverityColors[alert.severity]}`}>
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold uppercase tracking-wider">{alert.type.replace('_', ' ')}</span>
                <span className={`text-xs font-medium uppercase px-2 py-0.5 rounded ${alert.acknowledged ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                  {alert.acknowledged ? 'ACKNOWLEDGED' : 'ACTIVE'}
                </span>
              </div>
              <p className="font-medium">{alert.description}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-500 font-mono">{alert.id}</span>
              <div className="text-[10px] text-gray-400">{new Date(alert.timestamp).toLocaleTimeString()}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 mb-3">
            {alert.indicators.map((indicator, i) => (
              <span key={i} className="text-[10px] text-gray-300 bg-white/10 px-1.5 py-0.5 rounded">{indicator}</span>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Actor: <span className="text-white font-mono">{alert.actor}</span></span>
            {!alert.acknowledged && (
              <button
                onClick={() => engine.acknowledgeAlert(alert.id)}
                className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-[10px] font-medium"
              >
                Acknowledge
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default SafetyTrioDashboard;