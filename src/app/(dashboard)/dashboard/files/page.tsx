'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FolderOpen, FileText, Search, UploadCloud, Loader2, Trash2, Plus, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileRecord {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  storageUrl: string;
  summary: string | null;
  keywords: string[];
  confidence: number;
  status: string;
  createdAt: string;
  project: { id: string; name: string; color: string } | null;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  _count?: { files: number };
}

const ALLOWED_TYPES = [
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
  'application/xml',
  'text/html',
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
];

export default function FilesPage() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (projectFilter !== 'all') qs.set('projectId', projectFilter);
      if (search.trim()) qs.set('q', search.trim());

      const [filesRes, projectsRes] = await Promise.all([
        fetch(`/api/files?${qs.toString()}`),
        fetch('/api/projects'),
      ]);
      const filesData = await filesRes.json();
      const projectsData = await projectsRes.json();
      if (!filesRes.ok || !projectsRes.ok) {
        setError(filesData.error || projectsData.error || 'Failed to load files');
        return;
      }
      setFiles(filesData.files || []);
      setProjects(projectsData.projects || []);
    } catch {
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [projectFilter, search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(t);
  }, [load]);

  const upload = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (projectFilter !== 'all') formData.append('projectId', projectFilter);

      const res = await fetch('/api/files', { method: 'POST', body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUploadError(data.error || 'Upload failed');
        return;
      }
      await load();
    } catch {
      setUploadError('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dropped = Array.from(e.dataTransfer.files || []);
    for (const f of dropped.slice(0, 5)) upload(f);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    for (const f of selected.slice(0, 5)) upload(f);
    e.target.value = '';
  };

  const createProject = async () => {
    if (!projectName.trim() || creatingProject) return;
    setCreatingProject(true);
    setUploadError(null);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: projectName.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUploadError(data.error || 'Failed to create project');
        return;
      }
      setProjectName('');
      setShowProjectForm(false);
      setProjects((prev) => [...prev, data.project]);
    } catch {
      setUploadError('Failed to create project');
    } finally {
      setCreatingProject(false);
    }
  };

  const removeFile = async (file: FileRecord) => {
    try {
      const res = await fetch(`/api/files?id=${file.id}`, { method: 'DELETE' });
      if (res.ok) load();
    } catch {
      setUploadError('Failed to delete file');
    }
  };

  const removeProject = async (project: Project) => {
    try {
      const res = await fetch(`/api/projects?id=${project.id}`, { method: 'DELETE' });
      if (res.ok) {
        if (projectFilter === project.id) setProjectFilter('all');
        load();
      }
    } catch {
      setUploadError('Failed to delete project');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const confidenceLabel = (c: number) => (c >= 0.7 ? 'High' : c >= 0.4 ? 'Medium' : 'Low');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Files
          </CardTitle>
          <CardDescription>
            Upload files for understanding, search within them, and organize them under projects.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={cn(
              'relative border-2 border-dashed rounded-xl p-6 text-center transition-colors',
              dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            )}
            onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ALLOWED_TYPES.join(',')}
              onChange={handleInputChange}
              className="hidden"
            />
            <UploadCloud className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium mb-1">Drag & drop files, or click to browse</p>
            <p className="text-sm text-muted-foreground mb-4">Text, JSON, CSV, PDF, images (max 10MB each, 5 per batch)</p>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-2">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Browse Files
            </Button>
          </div>

          {uploadError && (
            <p className="text-sm text-destructive flex items-center gap-1.5" role="alert">
              <AlertTriangle className="h-4 w-4" />
              {uploadError}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search files…"
                className="pl-9"
                aria-label="Search files"
              />
            </div>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="sm:w-[200px]">
                <SelectValue placeholder="All projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setShowProjectForm((v) => !v)} className="gap-2">
              <Plus className="h-4 w-4" />
              Project
            </Button>
          </div>

          {showProjectForm && (
            <div className="flex gap-2">
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Project name"
                aria-label="New project name"
              />
              <Button onClick={createProject} disabled={creatingProject || !projectName.trim()}>
                {creatingProject ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create
              </Button>
            </div>
          )}

          {projects.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {projects.map((p) => (
                <span key={p.id} className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                  {p.name} ({p._count?.files ?? 0})
                  <button
                    type="button"
                    onClick={() => removeProject(p)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Delete project ${p.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {search.trim() ? `Results for “${search.trim()}”` : 'Your files'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading files…
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : files.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              {search.trim() ? 'No files match your search.' : 'No files yet. Upload one above.'}
            </p>
          ) : (
            <div className="space-y-3">
              {files.map((file) => (
                <div key={file.id} className="rounded-lg border p-3 flex items-start gap-3">
                  <div className="p-2 rounded bg-muted shrink-0">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href={file.storageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:underline truncate"
                      >
                        {file.name}
                      </a>
                      {file.project && (
                        <span className="inline-flex items-center gap-1 text-xs rounded-full border px-2 py-0.5">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: file.project.color }} />
                          {file.project.name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatSize(file.size)} · {file.mimeType} · {confidenceLabel(file.confidence)} confidence
                    </p>
                    {file.summary && <p className="text-sm mt-1">{file.summary}</p>}
                    {file.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {file.keywords.map((k) => (
                          <span key={k} className="text-xs bg-muted rounded-full px-2 py-0.5">
                            {k}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5',
                        file.status === 'LEARNED'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                      )}
                    >
                      {file.status === 'LEARNED' ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                      {file.status === 'LEARNED' ? 'Learned' : 'Preview only'}
                    </span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeFile(file)} aria-label="Delete file">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}