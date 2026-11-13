// src/engines/digup/DigupDashboard.tsx
// Digup search dashboard — unified UI for local semantic search.
// Uses HEY custom components (Button, Card, Input, Badge, Modal, Toast).
// Shows search bar, results with highlights, index health, backend status.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { springs } from '@/lib/heyMotion';
import { Button } from '@/components/ui/Button.jsx';
import { Card } from '@/components/ui/Card.jsx';
import { Input } from '@/components/ui/Input.jsx';
import { Badge } from '@/components/ui/Badge.jsx';
import { Select } from '@/components/ui/Select.jsx';
import { Modal } from '@/components/ui/Modal.jsx';
import { useToast } from '@/components/ui/Toast.jsx';
import {
  Search,
  Database,
  Zap,
  AlertCircle,
  CheckCircle,
  Loader2,
  Settings,
  RefreshCw,
  Filter,
  X,
  FileText,
  Image,
  Music,
  Video,
  Code,
  FolderOpen,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { DigupEngine, createDigupEngine } from './DigupEngine';
import type { SearchQuery, SearchResult, IndexStatus, BackendName } from './types';

// Result type icons and colors
const TYPE_ICONS: Record<SearchResult['type'], React.ReactNode> = {
  document: <FileText className="h-4 w-4 text-blue-500" />,
  image: <Image className="h-4 w-4 text-green-500" />,
  audio: <Music className="h-4 w-4 text-purple-500" />,
  video: <Video className="h-4 w-4 text-pink-500" />,
  code: <Code className="h-4 w-4 text-amber-500" />,
  other: <FileText className="h-4 w-4 text-gray-500" />,
};

const TYPE_LABELS: Record<SearchResult['type'], string> = {
  document: 'Document',
  image: 'Image',
  audio: 'Audio',
  video: 'Video',
  code: 'Code',
  other: 'Other',
};

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'document', label: 'Documents' },
  { value: 'image', label: 'Images' },
  { value: 'audio', label: 'Audio' },
  { value: 'video', label: 'Video' },
  { value: 'code', label: 'Code' },
];

const animationVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.15 } },
};

interface ResultCardProps {
  result: SearchResult;
  query: string;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, query }) => {
  const [expanded, setExpanded] = useState(false);
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

  const highlight = (text: string) => {
    if (!terms.length) return <span>{text}</span>;
    const regex = new RegExp(`(${terms.join('|')})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) =>
          terms.some((t) => t.toLowerCase() === part.toLowerCase()) ? (
            <mark key={i} className="bg-yellow-300 text-black px-0.5 rounded">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={animationVariants}
      className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
          {TYPE_ICONS[result.type]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-1">
            <h4 className="font-medium text-foreground truncate flex-1">
              {highlight(result.name)}
            </h4>
            <Badge variant="secondary" size="sm">
              {TYPE_LABELS[result.type]}
            </Badge>
            <Badge variant="secondary" size="sm" className="text-xs">
              {Math.round(result.score * 100)}%
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate mb-2">
            {highlight(result.path)}
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <FolderOpen className="h-3 w-3" />
              {formatSize(result.size)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(result.modifiedAt).toLocaleDateString()}
            </span>
          </div>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 p-3 bg-muted rounded-md"
              >
                <div className="text-sm">
                  <strong>Snippet:</strong>
                  <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                    {highlight(result.snippet || 'No snippet available')}
                  </p>
                  {result.highlights.length > 0 && (
                    <div className="mt-2">
                      <strong>Highlights:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {result.highlights.map((h, i) => (
                          <Badge key={i} variant="outline" size="sm">
                            {h}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
    </motion.div>
  );
};

const StatusBadge: React.FC<{ enabled: boolean; label: string }> = ({ enabled, label }) => (
  <Badge variant={enabled ? 'default' : 'destructive'} size="sm" className="gap-1">
    {enabled ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
    {label}
  </Badge>
);

const BackendStatusCard: React.FC<{ status: IndexStatus }> = ({ status }) => {
  const backendLabels: Record<BackendName, string> = {
    desktop: 'Desktop (im-looking-for)',
    android: 'Android (Rummage/Pipit)',
    ios: 'iOS (7-layer access)',
  };

  const platformIcons: Record<BackendName, React.ReactNode> = {
    desktop: <Monitor className="h-4 w-4" />,
    android: <Smartphone className="h-4 w-4" />,
    ios: <Tablet className="h-4 w-4" />,
  };

  return (
    <Card padding="md" className="relative">
      <div className="flex items-center gap-2 mb-3">
        {platformIcons[status.backend]}
        <h4 className="font-semibold">{backendLabels[status.backend]}</h4>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold">{status.indexedFiles.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">Files Indexed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">
            {status.lastIndexedAt ? new Date(status.lastIndexedAt).toLocaleDateString() : '—'}
          </div>
          <div className="text-xs text-muted-foreground">Last Indexed</div>
        </div>
        <div className="text-center">
          <StatusBadge enabled={status.enabled} label={status.enabled ? 'Ready' : 'Unavailable'} />
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Info className="h-4 w-4" />
          <span>Scope: {status.capabilities.scope}</span>
        </div>
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" size="sm" className={status.capabilities.filesystemScan ? '' : 'opacity-50'}>
            Filesystem
          </Badge>
          <Badge variant="outline" size="sm" className={status.capabilities.ocr ? '' : 'opacity-50'}>
            OCR
          </Badge>
          <Badge variant="outline" size="sm" className={status.capabilities.embeddings ? '' : 'opacity-50'}>
            Embeddings
          </Badge>
          <Badge variant="outline" size="sm" className={status.capabilities.offline ? '' : 'opacity-50'}>
            Offline
          </Badge>
        </div>

        {status.errors.length > 0 && (
          <div className="text-destructive text-sm">
            <AlertCircle className="h-4 w-4 inline mr-1" />
            {status.errors.join('; ')}
          </div>
        )}
      </div>
    </Card>
  );
};

const DigupDashboard: React.FC = () => {
  const { show: showToast } = useToast();
  const [engine] = useState(() => createDigupEngine());
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [status, setStatus] = useState<IndexStatus[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showIndexModal, setShowIndexModal] = useState(false);
  const [indexPaths, setIndexPaths] = useState('');
  const [indexing, setIndexing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState(false);

  // Load status on mount
  useEffect(() => {
    loadStatus();
    checkAvailable();
  }, []);

  const checkAvailable = useCallback(async () => {
    try {
      const ok = await engine.isAvailable();
      setAvailable(ok);
      if (!ok) {
        setError('Search backend not available. Check backend status below for install instructions.');
      }
    } catch {
      setAvailable(false);
    }
  }, [engine]);

  const loadStatus = useCallback(async () => {
    try {
      const st = await engine.getStatus();
      setStatus([st]);
    } catch (e) {
      console.error('Failed to load status:', e);
    }
  }, [engine]);

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setError(null);
    setResults([]);

    try {
      const searchQuery: SearchQuery = {
        query: query.trim(),
        limit: 20,
        fileTypes: typeFilter !== 'all' ? [typeFilter] : undefined,
      };
      const found = await engine.searchVerified(searchQuery);
      setResults(found);
      if (found.length === 0) {
        showToast('No results found. Try different terms or re-index.', { type: 'info' });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Search failed';
      setError(msg);
      showToast(msg, { type: 'error' });
    } finally {
      setSearching(false);
    }
  }, [query, typeFilter, engine, showToast]);

  const handleIndex = useCallback(async () => {
    const paths = indexPaths.trim() ? indexPaths.split(',').map((p) => p.trim()) : undefined;
    setIndexing(true);
    setError(null);

    try {
      const result = await engine.index(paths);
      showToast(`Indexed ${result.indexed} files`, { type: 'success' });
      if (result.errors.length > 0) {
        showToast(`Errors: ${result.errors.join('; ')}`, { type: 'warning' });
      }
      setShowIndexModal(false);
      loadStatus();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Indexing failed';
      setError(msg);
      showToast(msg, { type: 'error' });
    } finally {
      setIndexing(false);
    }
  }, [indexPaths, engine, showToast, loadStatus]);

  const handleOpenFile = (result: SearchResult) => {
    // In Tauri, we'd invoke a native open command
    // For web, we can only show the path
    showToast(`File: ${result.path}`, { type: 'info' });
  };

  const filteredResults = useMemo(() => {
    return results;
  }, [results]);

  const stats = useMemo(() => {
    const byType: Record<string, number> = {};
    for (const r of results) {
      byType[r.type] = (byType[r.type] || 0) + 1;
    }
    return { total: results.length, byType };
  }, [results]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.gentle}
      className="max-w-6xl mx-auto p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Zap className="h-8 w-8 text-primary" />
            Digup
          </h1>
          <p className="text-muted-foreground mt-1">
            Local semantic search — find files by what&apos;s inside them, not by filename.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowIndexModal(true)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Re-index
          </Button>
          <Button variant="outline" onClick={loadStatus}>
            <Database className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
        </div>
      </div>

      {/* Backend Status */}
      <Card padding="md" className={!available ? 'border-destructive/50' : ''}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Zap className="h-6 w-6 text-primary" />
            <div>
              <h3 className="font-semibold">Backend Status</h3>
              <p className="text-sm text-muted-foreground">
                {available ? 'Search backend is ready' : 'Search backend unavailable — check details below'}
              </p>
            </div>
          </div>
          <StatusBadge enabled={available} label={available ? 'Online' : 'Offline'} />
        </div>

        {status.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {status.map((s) => (
              <BackendStatusCard key={s.backend} status={s} />
            ))}
          </div>
        )}
      </Card>

      {/* Error banner */}
      {error && (
        <Card padding="md" className="border-destructive/50 bg-destructive/10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-destructive">Search Unavailable</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Search Form */}
      <Card padding="md">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search inside files... (e.g., 'the PDF about indexing', 'meeting notes from March')"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-12 text-lg"
              disabled={searching}
            />
            {searching && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary animate-spin" />
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <Select
              value={typeFilter}
              onChange={(value) => setTypeFilter(value)}
              options={TYPE_OPTIONS}
              placeholder="Filter by type"
            />
            <Button type="submit" disabled={searching || !query.trim() || !available}>
              {searching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Results Stats */}
      {results.length > 0 && (
        <Card padding="md">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-medium">{stats.total} result{stats.total !== 1 ? 's' : ''}</span>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byType).map(([type, count]) => (
                <Badge key={type} variant="secondary" size="sm">
                  {TYPE_ICONS[type as SearchResult['type']]}
                  {TYPE_LABELS[type as SearchResult['type']]} {count}
                </Badge>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Results List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredResults.length > 0 ? (
            filteredResults.map((result) => (
              <ResultCard
                key={result.id}
                result={result}
                query={query}
              />
            ))
          ) : !loading && !searching && query.trim() && available && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                Try different search terms, check your spelling, or re-index your files.
              </p>
              <Button variant="outline" onClick={() => setShowIndexModal(true)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Re-index Files
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {results.length === 0 && !query.trim() && available && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Zap className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Search your files by meaning</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Digup finds documents, photos (OCR), screenshots, voice memos, video, and code
              by what&apos;s inside them — not just filenames.
            </p>
            <div className="flex flex-wrap gap-2 justify-center text-sm text-muted-foreground">
              <Badge variant="outline">"quarterly budget spreadsheet"</Badge>
              <Badge variant="outline">"meeting with Sarah about API"</Badge>
              <Badge variant="outline">"screenshot of error message"</Badge>
              <Badge variant="outline">"voice memo from Tuesday"</Badge>
            </div>
          </motion.div>
        )}
      </div>

      {/* Re-index Modal */}
      <Modal
        open={showIndexModal}
        onClose={() => setShowIndexModal(false)}
        title="Re-index Files"
        description="Trigger a fresh index of your files. This may take several minutes depending on file count."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Paths (comma-separated, optional)</label>
            <Input
              placeholder="%USERPROFILE%/Documents, %USERPROFILE%/Downloads, D:\\Projects"
              value={indexPaths}
              onChange={(e) => setIndexPaths(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to index default locations (home directory).
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowIndexModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleIndex} disabled={indexing}>
              {indexing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Indexing...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Start Indexing
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

// Missing icon imports
import { Monitor, Smartphone, Tablet, Clock } from 'lucide-react';

export default DigupDashboard;