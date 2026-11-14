// src/engines/autonomous/AutonomousDashboard.tsx
// Autonomous Action Dashboard — Plan visualization, step-by-step execution, approval UI.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AutonomousEngine, createAutonomousEngine, type ActionPlan, type ActionStep, type ActionStepResult, type ExecutionContext } from './AutonomousEngine';
import { MotorCortex, createMotorCortex } from './MotorCortex';
import { SomatosensoryCortex, createSomatosensoryCortex } from './Somatosensory';
import { ActionPlanner, createActionPlanner } from './ActionPlanner';
import { ApprovalGates, createApprovalGates } from './ApprovalGates';
import { ReflexArc, createReflexArc } from './ReflexArc';
import { RollbackManager, createRollbackManager } from './RollbackManager';

interface AutonomousDashboardProps {
  engine?: AutonomousEngine;
  onPlanCreated?: (plan: ActionPlan) => void;
  onPlanExecuted?: (plan: ActionPlan) => void;
  onError?: (error: Error) => void;
}

const DEFAULT_CONTEXT: ExecutionContext = {
  platform: 'browser',
  mode: 'act',
  userId: 'user_1',
  sessionId: `session_${Date.now()}`,
  hcuBudget: 100,
};

export function AutonomousDashboard({
  engine: externalEngine,
  onPlanCreated,
  onPlanExecuted,
  onError,
}: AutonomousDashboardProps) {
  const [engine] = useState(() => externalEngine || createAutonomousEngine());
  const [goal, setGoal] = useState('');
  const [plan, setPlan] = useState<ActionPlan | null>(null);
  const [currentPlan, setCurrentPlan] = useState<ActionPlan | null>(null);
  const [history, setHistory] = useState<ActionPlan[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'plan' | 'execute' | 'history' | 'config'>('plan');
  const [context, setContext] = useState<ExecutionContext>(DEFAULT_CONTEXT);
  const [approvalRequests, setApprovalRequests] = useState<import('./ApprovalGates').ApprovalRequest[]>([]);
  const [reflexArcDismissals, setReflexArcDismissals] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  // Initialize engine with DOM accessor
  useEffect(() => {
    const getDOM = async () => document;
    engine.setDOMAccessor(getDOM);

    const executeClick = async (x: number, y: number) => {
      // In real implementation, this would use MotorCortex path via Tauri
      const event = new MouseEvent('click', {
        clientX: x,
        clientY: y,
        bubbles: true,
        cancelable: true,
        view: window,
      });
      document.elementFromPoint(x, y)?.dispatchEvent(event);
    };
    engine.setClickExecutor(executeClick);

    // Load history
    setHistory(engine.getHistory());

    // Poll for approval requests
    const approvalInterval = setInterval(() => {
      const pending = engine.getApprovalGates().getPendingRequestsForUser(context.userId);
      setApprovalRequests(pending);
    }, 1000);

    // Poll for reflex arc dismissals
    const reflexInterval = setInterval(async () => {
      if (engine.getReflexArc().isRunning()) {
        const dismissed = await engine.triggerReflexArc();
        if (dismissed.length > 0) {
          setReflexArcDismissals(prev => [...prev.slice(-9), ...dismissed]);
        }
      }
    }, 2000);

    return () => {
      clearInterval(approvalInterval);
      clearInterval(reflexInterval);
    };
  }, [engine, context.userId]);

  const addLog = useCallback((message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    if (logRef.current) {
      const timestamp = new Date().toLocaleTimeString();
      const entry = document.createElement('div');
      entry.className = `log-entry log-${type}`;
      entry.innerHTML = `<span class="log-time">[${timestamp}]</span> <span class="log-message">${message}</span>`;
      logRef.current.appendChild(entry);
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, []);

  const handleCreatePlan = async () => {
    if (!goal.trim()) {
      setError('Please enter a goal');
      return;
    }

    setIsCreatingPlan(true);
    setError(null);
    addLog(`Creating plan for: "${goal}"`);

    try {
      const newPlan = await engine.createPlan(goal, context);
      setPlan(newPlan);
      setCurrentPlan(newPlan);
      setActiveTab('execute');
      onPlanCreated?.(newPlan);
      addLog(`Plan created: ${newPlan.id} (${newPlan.steps.length} steps, ~${newPlan.hcuCost.toFixed(3)} HCU)`, 'success');
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to create plan');
      setError(err.message);
      addLog(`Error: ${err.message}`, 'error');
      onError?.(err);
    } finally {
      setIsCreatingPlan(false);
    }
  };

  const handleExecutePlan = async () => {
    if (!plan) return;

    setIsExecuting(true);
    setError(null);
    addLog(`Executing plan: ${plan.id}`);

    try {
      const executedPlan = await engine.executePlan(plan.id, context);
      setCurrentPlan(executedPlan);
      setHistory(prev => [executedPlan, ...prev]);
      onPlanExecuted?.(executedPlan);

      if (executedPlan.status === 'completed') {
        addLog(`Plan completed successfully! HCU spent: ${executedPlan.hcuSpent.toFixed(3)}`, 'success');
      } else if (executedPlan.status === 'rolled_back') {
        addLog(`Plan rolled back due to failure`, 'warning');
      } else {
        addLog(`Plan failed: ${executedPlan.results.find(r => !r.success)?.error}`, 'error');
      }
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Execution failed');
      setError(err.message);
      addLog(`Execution error: ${err.message}`, 'error');
      onError?.(err);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    const success = await engine.getApprovalGates().approveRequest(requestId, context.userId);
    if (success) {
      addLog(`Approved request: ${requestId}`, 'success');
      setApprovalRequests(prev => prev.filter(r => r.id !== requestId));
    }
  };

  const handleDenyRequest = async (requestId: string) => {
    const success = await engine.getApprovalGates().denyRequest(requestId, context.userId, 'Denied by user');
    if (success) {
      addLog(`Denied request: ${requestId}`, 'warning');
      setApprovalRequests(prev => prev.filter(r => r.id !== requestId));
    }
  };

  const handleRollback = async () => {
    if (!currentPlan) return;

    const canRollback = engine.canRollback(currentPlan.id);
    if (!canRollback) {
      addLog('Rollback not available (24-hour window expired)', 'error');
      return;
    }

    addLog(`Rolling back plan: ${currentPlan.id}`, 'warning');
    // In real implementation, would show snapshot selection UI
    // For now, just log
    addLog('Rollback initiated (select snapshot in full UI)', 'info');
  };

  const getStepStatus = (step: ActionStep, index: number): 'pending' | 'running' | 'completed' | 'failed' => {
    if (!currentPlan) return 'pending';
    if (currentPlan.status === 'running' && index === currentPlan.currentStep) return 'running';
    if (index < currentPlan.currentStep) return 'completed';
    if (currentPlan.status === 'failed' && index === currentPlan.currentStep) return 'failed';
    return 'pending';
  };

  const getStepResult = (stepId: string): ActionStepResult | undefined => {
    return currentPlan?.results.find(r => r.stepId === stepId);
  };

  return (
    <div className="autonomous-dashboard h-full flex flex-col bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Autonomous Action</h1>
        <div className="flex items-center gap-3">
          <span className={`px-2 py-1 text-xs rounded-full ${
            context.platform === 'browser' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
            context.platform === 'desktop' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
            'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
          }`}>
            {context.platform}
          </span>
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            HCU Budget: {context.hcuBudget}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-700">
        {(['plan', 'execute', 'history', 'config'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Plan Tab */}
        <AnimatePresence mode="wait">
          {activeTab === 'plan' && (
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="max-w-3xl mx-auto space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    What should HEY do?
                  </label>
                  <textarea
                    value={goal}
                    onChange={e => setGoal(e.target.value)}
                    placeholder="e.g., 'Search for TypeScript tutorials on GitHub and star the top 3 repos'"
                    className="w-full h-24 p-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    rows={4}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleCreatePlan}
                    disabled={isCreatingPlan || !goal.trim()}
                    className="flex-1 py-3 px-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isCreatingPlan ? 'Creating Plan...' : 'Create Plan'}
                  </button>
                  <button
                    onClick={() => setGoal('')}
                    className="px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    Clear
                  </button>
                </div>

                {plan && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <h3 className="font-medium text-neutral-900 dark:text-neutral-100">Generated Plan</h3>
                    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                      <div className="flex items-center justify-between mb-3 text-sm">
                        <span className="text-neutral-600 dark:text-neutral-400">Plan ID: {plan.id}</span>
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          {plan.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-neutral-500 dark:text-neutral-400">Steps:</span>
                          <span className="font-medium ml-1">{plan.steps.length}</span>
                        </div>
                        <div>
                          <span className="text-neutral-500 dark:text-neutral-400">Est. HCU:</span>
                          <span className="font-medium ml-1">{plan.hcuCost.toFixed(3)}</span>
                        </div>
                        <div>
                          <span className="text-neutral-500 dark:text-neutral-400">Rollback:</span>
                          <span className="font-medium ml-1">{plan.rollbackPlan ? 'Enabled' : 'Disabled'}</span>
                        </div>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {plan.steps.map((step, index) => (
                          <div
                            key={step.id}
                            className="flex items-center gap-3 p-2 bg-neutral-50 dark:bg-neutral-700 rounded"
                          >
                            <span className="w-6 text-center text-sm text-neutral-500">{index + 1}</span>
                            <span className="px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded">
                              {step.capability}
                            </span>
                            <span className="flex-1 text-sm text-neutral-700 dark:text-neutral-300 truncate">
                              {step.target || JSON.stringify(step.parameters).slice(0, 50)}
                            </span>
                            <span className="px-2 py-1 text-xs rounded bg-neutral-200 dark:bg-neutral-600">
                              {step.verification}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                    {error}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Execute Tab */}
          {activeTab === 'execute' && (
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="max-w-4xl mx-auto space-y-4">
                {currentPlan ? (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
                        {currentPlan.goal}
                      </h3>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          currentPlan.status === 'running' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          currentPlan.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          currentPlan.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          currentPlan.status === 'rolled_back' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                          'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200'
                        }`}>
                          {currentPlan.status}
                        </span>
                        {currentPlan.status === 'pending' && (
                          <button
                            onClick={handleExecutePlan}
                            disabled={isExecuting}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
                          >
                            {isExecuting ? 'Executing...' : 'Execute Plan'}
                          </button>
                        )}
                        {engine.canRollback(currentPlan.id) && currentPlan.status !== 'pending' && (
                          <button
                            onClick={handleRollback}
                            className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                          >
                            Rollback
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                      <div className="grid grid-cols-4 gap-4 p-4 border-b border-neutral-200 dark:border-neutral-700 text-sm">
                        <div>
                          <span className="text-neutral-500 dark:text-neutral-400">HCU Spent:</span>
                          <span className="font-medium ml-1">{currentPlan.hcuSpent.toFixed(3)} / {currentPlan.hcuCost.toFixed(3)}</span>
                        </div>
                        <div>
                          <span className="text-neutral-500 dark:text-neutral-400">Step:</span>
                          <span className="font-medium ml-1">{currentPlan.currentStep + 1} / {currentPlan.steps.length}</span>
                        </div>
                        <div>
                          <span className="text-neutral-500 dark:text-neutral-400">Duration:</span>
                          <span className="font-medium ml-1">
                            {currentPlan.startedAt
                              ? `${((Date.now() - new Date(currentPlan.startedAt).getTime()) / 1000).toFixed(1)}s`
                              : '0s'}
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-500 dark:text-neutral-400">Rollback:</span>
                          <span className="font-medium ml-1">
                            {engine.getRollbackTimeRemaining(currentPlan.id) > 0
                              ? `${(engine.getRollbackTimeRemaining(currentPlan.id) / 3600000).toFixed(1)}h left`
                              : 'Expired'}
                          </span>
                        </div>
                      </div>

                      <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                        {currentPlan.steps.map((step, index) => {
                          const status = getStepStatus(step, index);
                          const result = getStepResult(step.id);

                          return (
                            <motion.div
                              key={step.id}
                              layout
                              className={`p-4 transition-colors ${
                                status === 'running' ? 'bg-primary-50 dark:bg-primary-900/30' :
                                status === 'completed' ? 'bg-green-50 dark:bg-green-900/20' :
                                status === 'failed' ? 'bg-red-50 dark:bg-red-900/20' :
                                ''
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                  status === 'running' ? 'bg-primary-500 text-white animate-pulse' :
                                  status === 'completed' ? 'bg-green-500 text-white' :
                                  status === 'failed' ? 'bg-red-500 text-white' :
                                  'bg-neutral-200 dark:bg-neutral-700 text-neutral-500'
                                }`}>
                                  {status === 'completed' ? '✓' : status === 'failed' ? '✗' : index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded">
                                      {step.capability}
                                    </span>
                                    <span className="text-sm text-neutral-700 dark:text-neutral-300 truncate">
                                      {step.target || JSON.stringify(step.parameters).slice(0, 60)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                                    <span>Verification: {step.verification}</span>
                                    {result && (
                                      <>
                                        <span className={result.verified ? 'text-green-600' : 'text-red-600'}>
                                          {result.verified ? '✓ Verified' : '✗ Failed'}
                                        </span>
                                        <span>{result.durationMs}ms</span>
                                        {result.retries > 0 && <span>Retries: {result.retries}</span>}
                                        {result.hcuCost > 0 && <span>HCU: {result.hcuCost.toFixed(3)}</span>}
                                      </>
                                    )}
                                    {result?.error && (
                                      <span className="text-red-600 dark:text-red-400">{result.error}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
                    Create a plan first to execute it.
                  </div>
                )}

                {/* Approval Requests */}
                {approvalRequests.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <h3 className="font-medium text-neutral-900 dark:text-neutral-100">Pending Approvals</h3>
                    {approvalRequests.map(req => (
                      <div key={req.id} className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-yellow-800 dark:text-yellow-200">
                              {req.reason}
                            </p>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                              Capability: {req.step.capability} | Risk: {req.riskLevel}
                            </p>
                            {req.estimatedCostUsd && (
                              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                Est. Cost: ${req.estimatedCostUsd}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveRequest(req.id)}
                              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleDenyRequest(req.id)}
                              className="px-3 py-1.5 border border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300 text-sm rounded hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
                            >
                              Deny
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {/* Reflex Arc Dismissals */}
                {reflexArcDismissals.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <h3 className="font-medium text-neutral-900 dark:text-neutral-100">Reflex Arc Dismissals</h3>
                    <div className="flex flex-wrap gap-2">
                      {reflexArcDismissals.slice(-10).map((dismissal, i) => (
                        <span key={i} className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded">
                          {dismissal}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-4">Execution History</h3>
                {history.length === 0 ? (
                  <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
                    No plans executed yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((h, index) => (
                      <motion.div
                        key={h.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate flex-1 mr-4">
                            {h.goal}
                          </p>
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              h.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              h.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                              h.status === 'rolled_back' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                              'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200'
                            }`}>
                              {h.status}
                            </span>
                            <span className="text-sm text-neutral-500 dark:text-neutral-400">
                              {h.hcuSpent.toFixed(3)} HCU
                            </span>
                            <span className="text-sm text-neutral-500 dark:text-neutral-400">
                              {h.steps.length} steps
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-neutral-500 dark:text-neutral-400 flex gap-4">
                          <span>{new Date(h.createdAt).toLocaleString()}</span>
                          {h.completedAt && (
                            <span>Completed: {new Date(h.completedAt).toLocaleTimeString()}</span>
                          )}
                          <span>Duration: {h.startedAt && h.completedAt
                            ? ((new Date(h.completedAt).getTime() - new Date(h.startedAt).getTime()) / 1000).toFixed(1) + 's'
                            : 'N/A'}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Config Tab */}
          {activeTab === 'config' && (
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="max-w-2xl mx-auto space-y-6">
                <h3 className="font-medium text-neutral-900 dark:text-neutral-100">Engine Configuration</h3>

                <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 space-y-4">
                  <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Motor Cortex</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="block text-neutral-600 dark:text-neutral-400">Bezier Control Points</label>
                      <input
                        type="number"
                        value={engine.getConfig().motorCortex.bezierControlPoints}
                        onChange={e => engine.updateConfig({ motorCortex: { ...engine.getConfig().motorCortex, bezierControlPoints: parseInt(e.target.value) } })}
                        className="w-full mt-1 p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700"
                        min={1} max={10}
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-600 dark:text-neutral-400">Move Duration (ms)</label>
                      <input
                        type="text"
                        value={engine.getConfig().motorCortex.moveDurationRange.join(', ')}
                        onChange={e => {
                          const [min, max] = e.target.value.split(',').map(v => parseInt(v.trim()));
                          engine.updateConfig({ motorCortex: { ...engine.getConfig().motorCortex, moveDurationRange: [min, max] } });
                        }}
                        className="w-full mt-1 p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700"
                        placeholder="300, 800"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-600 dark:text-neutral-400">Click Delay (ms)</label>
                      <input
                        type="text"
                        value={engine.getConfig().motorCortex.clickDelayRange.join(', ')}
                        onChange={e => {
                          const [min, max] = e.target.value.split(',').map(v => parseInt(v.trim()));
                          engine.updateConfig({ motorCortex: { ...engine.getConfig().motorCortex, clickDelayRange: [min, max] } });
                        }}
                        className="w-full mt-1 p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700"
                        placeholder="50, 150"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-600 dark:text-neutral-400">Type Delay (ms)</label>
                      <input
                        type="text"
                        value={engine.getConfig().motorCortex.typeDelayRange.join(', ')}
                        onChange={e => {
                          const [min, max] = e.target.value.split(',').map(v => parseInt(v.trim()));
                          engine.updateConfig({ motorCortex: { ...engine.getConfig().motorCortex, typeDelayRange: [min, max] } });
                        }}
                        className="w-full mt-1 p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700"
                        placeholder="80, 180"
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={engine.getConfig().motorCortex.humanLikeJitter}
                          onChange={e => engine.updateConfig({ motorCortex: { ...engine.getConfig().motorCortex, humanLikeJitter: e.target.checked } })}
                          className="rounded border-neutral-300 text-primary-600"
                        />
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">Human-like Jitter</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 space-y-4">
                  <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Approval Gates</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="block text-neutral-600 dark:text-neutral-400">Money Threshold (USD)</label>
                      <input
                        type="number"
                        value={engine.getConfig().approvalGates.moneyThresholdUsd}
                        onChange={e => engine.updateConfig({ approvalGates: { ...engine.getConfig().approvalGates, moneyThresholdUsd: parseFloat(e.target.value) } })}
                        className="w-full mt-1 p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700"
                        min={0} step={0.01}
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={engine.getConfig().approvalGates.destructiveActionsRequireApproval}
                          onChange={e => engine.updateConfig({ approvalGates: { ...engine.getConfig().approvalGates, destructiveActionsRequireApproval: e.target.checked } })}
                          className="rounded border-neutral-300 text-primary-600"
                        />
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">Destructive Actions Require Approval</span>
                      </label>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={engine.getConfig().approvalGates.routineActionsAutoApprove}
                          onChange={e => engine.updateConfig({ approvalGates: { ...engine.getConfig().approvalGates, routineActionsAutoApprove: e.target.checked } })}
                          className="rounded border-neutral-300 text-primary-600"
                        />
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">Routine Actions Auto-Approve</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 space-y-4">
                  <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Reflex Arc</h4>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={engine.getConfig().reflexArc.enabled}
                        onChange={e => engine.updateConfig({ reflexArc: { ...engine.getConfig().reflexArc, enabled: e.target.checked } })}
                        className="rounded border-neutral-300 text-primary-600"
                      />
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">Enabled</span>
                    </label>
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">
                      {engine.getConfig().reflexArc.patterns.length} patterns loaded
                    </span>
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 space-y-4">
                  <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Rollback</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="block text-neutral-600 dark:text-neutral-400">Max History Length</label>
                      <input
                        type="number"
                        value={engine.getConfig().rollback.maxHistoryLength}
                        onChange={e => engine.updateConfig({ rollback: { ...engine.getConfig().rollback, maxHistoryLength: parseInt(e.target.value) } })}
                        className="w-full mt-1 p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700"
                        min={1}
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-600 dark:text-neutral-400">Snapshot Interval (ms)</label>
                      <input
                        type="number"
                        value={engine.getConfig().rollback.snapshotIntervalMs}
                        onChange={e => engine.updateConfig({ rollback: { ...engine.getConfig().rollback, snapshotIntervalMs: parseInt(e.target.value) } })}
                        className="w-full mt-1 p-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700"
                        min={1000}
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={engine.getConfig().rollback.enabled}
                          onChange={e => engine.updateConfig({ rollback: { ...engine.getConfig().rollback, enabled: e.target.checked } })}
                          className="rounded border-neutral-300 text-primary-600"
                        />
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">Enabled</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Log Panel */}
          {activeTab === 'execute' && currentPlan && (
            <div className="border-t border-neutral-200 dark:border-neutral-700 h-64 bg-white dark:bg-neutral-800">
              <div className="flex items-center justify-between p-2 border-b border-neutral-200 dark:border-neutral-700">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Execution Log</span>
                <button
                  onClick={() => logRef.current?.innerHTML = ''}
                  className="text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                >
                  Clear
                </button>
              </div>
              <div ref={logRef} className="h-full overflow-y-auto p-2 font-mono text-xs text-neutral-700 dark:text-neutral-300 space-y-1">
                <div className="log-entry log-info">
                  <span class="log-time">[System]</span> <span class="log-message">Autonomous Action Engine ready</span>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default AutonomousDashboard;