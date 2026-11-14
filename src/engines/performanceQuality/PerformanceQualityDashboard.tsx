// src/engines/performanceQuality/PerformanceQualityDashboard.tsx
// Dashboard UI for Performance & Quality Engine

import { useState, useEffect } from 'react';
import { useEngine } from '../../core/engineContext';
import type { PerformanceQualityEngine } from './PerformanceQualityEngine';
import type { QualityMetric, PerformanceRecord, QualityScore, PerformanceQualityEvent } from './types';

export function PerformanceQualityDashboard() {
  const { engine } = useEngine('performanceQuality') as { engine: PerformanceQualityEngine | null };
  const [health, setHealth] = useState<ReturnType<PerformanceQualityEngine['getHealth']> | null>(null);
  const [metrics, setMetrics] = useState<QualityMetric[]>([]);
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [qualityHistory, setQualityHistory] = useState<QualityScore[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!engine) return;

    const init = async () => {
      await engine.initialize();
      setIsInitialized(true);
      startPolling();
    };

    const unsubMetrics = engine.onEvent('metrics_updated', (e) => setMetrics(e.metrics));
    const unsubScore = engine.onEvent('quality_score_computed', (e) => setQualityHistory(prev => [e.score, ...prev.slice(0, 49)]));
    const unsubRecord = engine.onEvent('performance_recorded', (e) => setRecords(prev => [e.record, ...prev.slice(0, 99)]));

    init();

    return () => {
      unsubMetrics();
      unsubScore();
      unsubRecord();
    };
  }, [engine]);

  const startPolling = () => {
    if (!engine) return;
    const interval = setInterval(() => {
      setHealth(engine.getHealth());
      setMetrics(engine.getMetrics());
      setRecords(engine.getPerformanceRecords(100));
      setQualityHistory(engine.getQualityHistory(50));
    }, 3000);
    return () => clearInterval(interval);
  };

  const handleRecordPerformance = () => {
    const op = prompt('Operation name:', 'test_operation') || 'test_operation';
    const duration = Math.floor(Math.random() * 200) + 50;
    engine?.recordPerformance(op, duration, Math.random() > 0.05, 0.01);
    engine?.computeQualityScore();
  };

  if (!engine || !isInitialized) {
    return (
      <div className="p-6 text-center text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        Initializing Performance & Quality...
      </div>
    );
  }

  const latestScore = qualityHistory[0];

  const gradeColors: Record<string, string> = {
    A: 'text-green-400',
    B: 'text-blue-400',
    C: 'text-yellow-400',
    D: 'text-orange-400',
    F: 'text-red-400',
  };

  const categoryColors: Record<string, string> = {
    performance: 'text-blue-400',
    reliability: 'text-green-400',
    correctness: 'text-purple-400',
    efficiency: 'text-yellow-400',
    user_experience: 'text-orange-400',
  };

  const trendColors = {
    improving: 'text-green-400',
    stable: 'text-gray-400',
    declining: 'text-red-400',
  };

  return (
    <div className="h-full flex flex-col gap-4 p-4 bg-background">
      {/* Quality Score Header */}
      <div className="bg-card rounded-xl border border-border p-4 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full border-4 border-primary flex items-center justify-center">
            <span className={`text-3xl font-bold ${gradeColors[latestScore?.grade || 'F']}`}>
              {latestScore?.grade || '—'}
            </span>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide">Quality Score</div>
            <div className="text-3xl font-bold text-white">{health?.qualityScore || 0}</div>
            <div className="text-xs text-gray-500">Threshold: {engine.getConfig().qualityAlertThreshold}</div>
          </div>
        </div>
        <div className="flex-1 grid grid-cols-5 gap-4">
          {['performance', 'reliability', 'correctness', 'efficiency', 'user_experience'].map(cat => (
            <div key={cat} className="text-center">
              <div className={`text-xl font-bold ${categoryColors[cat]}`}>
                {latestScore ? latestScore[cat as keyof QualityScore] : 0}
              </div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wide">{cat.replace('_', ' ')}</div>
            </div>
          ))}
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">Avg Latency</div>
          <div className="text-xl font-bold text-white">{health?.avgLatency.toFixed(0) || 0}ms</div>
          <div className="text-xs text-gray-400 mt-1">Success Rate</div>
          <div className="text-xl font-bold text-green-400">{health?.successRate.toFixed(1) || 0}%</div>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left Panel - Metrics */}
        <div className="w-80 bg-card rounded-xl border border-border flex flex-col min-w-0">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-white">Quality Metrics</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {metrics.map(metric => (
              <MetricCard key={metric.id} metric={metric} trendColors={trendColors} />
            ))}
          </div>
        </div>

        {/* Center Panel - Performance Records */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-4 border-b border-border flex items-center justify-between bg-card rounded-xl border border-border">
            <h3 className="font-semibold text-white">Performance Records ({records.length})</h3>
            <button
              onClick={handleRecordPerformance}
              className="px-3 py-1.5 bg-primary hover:bg-primary/85 text-white rounded-lg text-xs font-medium"
            >
              + Record Test
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {records.slice(0, 50).map(record => (
              <div key={record.id} className="bg-background/50 rounded-lg p-3 flex items-center gap-4 text-sm">
                <span className={`w-2 h-2 rounded-full ${record.success ? 'bg-green-400' : 'bg-red-400'}`}></span>
                <span className="font-mono text-gray-300 flex-1 truncate">{record.operation}</span>
                <span className="text-white font-mono">{record.durationMs}ms</span>
                <span className="text-yellow-400 font-mono text-xs">{record.hcuCost} HCU</span>
                <span className="text-gray-500 font-mono text-xs">{new Date(record.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
            {records.length === 0 && (
              <div className="text-center text-gray-500 py-20">No performance records yet</div>
            )}
          </div>
        </div>

        {/* Right Panel - Quality Trend */}
        <div className="w-72 bg-card rounded-xl border border-border flex flex-col min-w-0">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-white">Quality Trend</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {qualityHistory.slice(0, 15).map((score, i) => (
                <div key={score.id} className="flex items-center gap-3 text-sm">
                  <span className="text-gray-500 font-mono text-xs w-16">
                    {new Date(score.timestamp).toLocaleTimeString()}
                  </span>
                  <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${score.overall >= 90 ? 'bg-green-500' : score.overall >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${score.overall}%` }}
                    ></div>
                  </div>
                  <span className={`font-bold ${gradeColors[score.grade]}`}>{score.overall}</span>
                </div>
              ))}
              {qualityHistory.length === 0 && (
                <div className="text-center text-gray-500 py-8 text-sm">Computing quality scores...</div>
              )}
            </div>
          </div>

          <div className="border-t border-border p-4">
            <h4 className="text-sm font-medium text-gray-300 uppercase tracking-wide mb-3">Engine Stats</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Metrics tracked</span>
                <span className="text-white">{health?.metricCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Records stored</span>
                <span className="text-white">{health?.performanceRecordCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">HCU/hour budget</span>
                <span className="text-white">{health?.hcuBudgetPerHour}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">HCU spent</span>
                <span className="text-white">{health?.totalHCUSpent.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  metric,
  trendColors,
}: {
  metric: QualityMetric;
  trendColors: Record<string, string>;
}) {
  const pct = Math.min((metric.value / metric.target) * 100, 100);
  const barColor = pct >= 95 ? 'bg-green-500' : pct >= 75 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="bg-background/50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white text-sm">{metric.name}</span>
          <span className="text-[10px] text-gray-500 uppercase">{metric.category}</span>
        </div>
        <span className={`text-xs font-medium ${trendColors[metric.trend]}`}>
          {metric.trend === 'improving' ? '↗' : metric.trend === 'declining' ? '↘' : '→'} {metric.trend}
        </span>
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl font-bold text-white">{metric.value}</span>
        <span className="text-xs text-gray-500">target: {metric.target} {metric.unit}</span>
      </div>
      <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} transition-all`} style={{ width: `${pct}%` }}></div>
      </div>
    </div>
  );
}

export default PerformanceQualityDashboard;