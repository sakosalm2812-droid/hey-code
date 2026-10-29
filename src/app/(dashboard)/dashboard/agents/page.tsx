'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bot, Plus, Trash2, Save, X, Check, RefreshCw, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Agent {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  systemPrompt: string;
  model: string;
  status: string;
  tools: string[];
  permissions: string[];
  builtin: boolean;
  category?: string;
  version?: string;
  risk?: string;
  privacy?: string;
  health?: string;
}

const MODELS = ['GPT_4O_MINI', 'GPT_4O', 'GPT_4_TURBO', 'CLAUDE_3_OPUS', 'CLAUDE_3_SONNET', 'CLAUDE_3_HAIKU'];

const ALL_TOOLS = [
  { id: 'web_search', label: 'Web Search' },
  { id: 'web_fetch', label: 'Fetch URL' },
  { id: 'memory_search', label: 'Memory Search' },
  { id: 'memory_save', label: 'Memory Save' },
  { id: 'calculator', label: 'Calculator' },
  { id: 'current_time', label: 'Current Time' },
  { id: 'image_generate', label: 'Image Generation' },
  { id: 'file_search', label: 'File Search' },
  { id: 'planner', label: 'Planner' },
  { id: 'translate', label: 'Translate' },
  { id: 'summarize', label: 'Summarize' },
  { id: 'prayer_times', label: 'Prayer Times' },
  { id: 'hijri_date', label: 'Hijri Date' },
];

const ALL_PERMISSIONS = [
  { id: 'web', label: 'Web' },
  { id: 'memory', label: 'Memory' },
  { id: 'compute', label: 'Compute' },
  { id: 'media', label: 'Media' },
  { id: 'files', label: 'Files' },
  { id: 'data', label: 'Data' },
  { id: 'admin', label: 'Admin' },
];

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Agent | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrompt, setFormPrompt] = useState('');
  const [formModel, setFormModel] = useState('GPT_4O_MINI');
  const [formTools, setFormTools] = useState<string[]>([]);
  const [formPermissions, setFormPermissions] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/agents');
      if (!res.ok) {
        let message = `Failed to load agents (${res.status})`;
        try {
          const data = await res.json();
          message = data.error || message;
        } catch {}
        setError(message);
        return;
      }
      const data = await res.json();
      setAgents(data.agents || []);
    } catch {
      setError('Failed to load agents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setCreating(true);
    setFormName('');
    setFormDescription('');
    setFormPrompt('You are a helpful assistant specialized for this task.');
    setFormModel('GPT_4O_MINI');
    setFormTools(['calculator', 'current_time']);
    setFormPermissions(['compute']);
  };

  const openEdit = (agent: Agent) => {
    if (agent.builtin) return;
    setCreating(false);
    setEditing(agent);
    setFormName(agent.name);
    setFormDescription(agent.description || '');
    setFormPrompt(agent.systemPrompt);
    setFormModel(agent.model);
    setFormTools(agent.tools);
    setFormPermissions(agent.permissions);
  };

  const closeForm = () => {
    setCreating(false);
    setEditing(null);
  };

  const toggleTool = (toolId: string) => {
    setFormTools((prev) =>
      prev.includes(toolId) ? prev.filter((t) => t !== toolId) : [...prev, toolId]
    );
  };

  const togglePermission = (permId: string) => {
    setFormPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const submit = async () => {
    if (!formName.trim() || !formPrompt.trim()) return;
    setSaving(true);
    try {
      const body = {
        name: formName,
        description: formDescription,
        systemPrompt: formPrompt,
        model: formModel,
        tools: formTools,
        permissions: formPermissions,
      };

      const url = editing ? `/api/agents?id=${editing.id}` : '/api/agents';
      const method = editing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to save agent');
        return;
      }
      closeForm();
      load();
    } catch {
      setError('Failed to save agent');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (agent: Agent) => {
    if (agent.builtin) return;
    try {
      const res = await fetch(`/api/agents?id=${agent.id}`, { method: 'DELETE' });
      if (res.ok) load();
    } catch {
      setError('Failed to delete agent');
    }
  };

  const filtered = agents.filter((agent) =>
    agent.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Agents</h1>
          <p className="text-muted-foreground">
            Specialized assistants with their own system prompt, model, tools, and permissions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search agents..."
              className="pl-8 w-48"
            />
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New Agent
          </Button>
          <Button variant="ghost" size="icon" onClick={load} aria-label="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm" role="alert">
          {error}
        </div>
      )}

      {(creating || editing) && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? `Edit ${editing.name}` : 'Create Custom Agent'}</CardTitle>
            <CardDescription>
              Define a system prompt, model, tools, and the permissions the agent may use.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Marketing Writer" />
              <div>
                <label className="text-sm font-medium mb-1 block">Model</label>
                <Select value={formModel} onValueChange={setFormModel}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MODELS.map((m) => (
                      <SelectItem key={m} value={m}>{m.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Input label="Description" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="What does this agent do?" />
            <div>
              <label className="text-sm font-medium mb-1 block">System prompt</label>
              <textarea
                value={formPrompt}
                onChange={(e) => setFormPrompt(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Describe how this agent should behave..."
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Permissions</label>
              <div className="flex flex-wrap gap-2">
                {ALL_PERMISSIONS.map((perm) => (
                  <button
                    key={perm.id}
                    type="button"
                    onClick={() => togglePermission(perm.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                      formPermissions.includes(perm.id)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'text-muted-foreground hover:bg-accent'
                    )}
                  >
                    {formPermissions.includes(perm.id) && <Check className="h-3 w-3" />}
                    {perm.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Tools</label>
              <div className="flex flex-wrap gap-2">
                {ALL_TOOLS.map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => toggleTool(tool.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                      formTools.includes(tool.id)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'text-muted-foreground hover:bg-accent'
                    )}
                  >
                    {formTools.includes(tool.id) && <Check className="h-3 w-3" />}
                    {tool.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeForm}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={submit} disabled={saving || !formName.trim() || !formPrompt.trim()}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Agent'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading agents...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No agents found. Try a different search or create a new agent.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((agent) => (
            <Card key={agent.id} className={cn('flex flex-col', agent.builtin && 'border-dashed')}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{agent.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {agent.builtin ? (agent.category ? `Built-in · Category ${agent.category}${agent.version ? ' · v' + agent.version : ''}` : 'Built-in') : '@' + agent.slug}
                      </CardDescription>
                    </div>
                  </div>
                  {!agent.builtin && (
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(agent)} aria-label={`Edit ${agent.name}`}>
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(agent)} aria-label={`Delete ${agent.name}`} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {agent.description || 'No description'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">{agent.model.replace(/_/g, ' ')}</span>
                  {agent.health && (
                    <span
                      className={cn(
                        'rounded px-2 py-0.5 text-xs font-medium',
                        agent.health === 'healthy' && 'bg-emerald-500/10 text-emerald-600',
                        agent.health === 'disabled' && 'bg-muted text-muted-foreground',
                        agent.health === 'degraded' && 'bg-amber-500/10 text-amber-600',
                        agent.health === 'blocked' && 'bg-red-500/10 text-red-600',
                        agent.health === 'unavailable' && 'bg-orange-500/10 text-orange-600'
                      )}
                    >
                      {agent.health}
                    </span>
                  )}
                  {agent.tools.slice(0, 3).map((tool) => (
                    <span key={tool} className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">{tool}</span>
                  ))}
                  {agent.tools.length > 3 && (
                    <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">+{agent.tools.length - 3}</span>
                  )}
                  {agent.builtin && agent.privacy && (
                    <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">{agent.privacy}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}