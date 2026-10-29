'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, X, Loader2, Image, File, Code, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

const ALLOWED_TYPES = [
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
];

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
}

interface FileUploadProps {
  onFilesChange?: (files: File[]) => void;
  maxFiles?: number;
  accept?: string[];
  disabled?: boolean;
}

export function FileUpload({ 
  onFilesChange, 
  maxFiles = 5, 
  accept = ALLOWED_TYPES,
  disabled = false 
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (type.startsWith('text/') || type === 'application/json') return <Code className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  const validateFile = (file: File): string | null => {
    if (!accept.some(type => file.type === type || type === '*/*')) {
      return `File type ${file.type} is not allowed`;
    }
    if (file.size > MAX_SIZE) {
      return `File size exceeds ${MAX_SIZE / 1024 / 1024}MB limit`;
    }
    return null;
  };

  const addFiles = (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles: UploadedFile[] = [];
    const errors: string[] = [];

    for (const file of fileArray) {
      if (files.length + validFiles.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
        break;
      }

      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
        continue;
      }

      const uploadedFile: UploadedFile = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        status: 'pending',
        progress: 0,
      };

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          uploadedFile.preview = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      }

      validFiles.push(uploadedFile);
    }

    setFiles(prev => [...prev, ...validFiles]);
    updateFilesList();

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }
  };

  const updateFilesList = () => {
    onFilesChange?.(files.map(f => f.file));
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    updateFilesList();
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      e.target.value = '';
    }
  };

  const uploadFiles = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    for (const file of pendingFiles) {
      setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'uploading' as const } : f));
      
      try {
        const formData = new FormData();
        formData.append('file', file.file);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Upload failed');
        
        setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'completed' as const, progress: 100 } : f));
      } catch (error) {
        setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'error' as const, error: 'Upload failed' } : f));
      }
    }
  };

  return (
    <div 
      className={cn(
        'relative border-2 border-dashed rounded-xl p-6 transition-colors',
        dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
        disabled && 'opacity-50 pointer-events-none'
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept.join(',')}
        onChange={handleInputChange}
        className="hidden"
        id="file-upload"
        disabled={disabled || files.length >= maxFiles}
      />

      <div className="text-center">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-1">
          {dragActive ? 'Drop files here...' : 'Drag & drop files here, or click to browse'}
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          Supports: PDF, images, text, JSON, CSV (max 10MB each, {maxFiles} files max)
        </p>
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || files.length >= maxFiles}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          Browse Files
        </Button>
      </div>

      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Selected Files ({files.length}/{maxFiles})</h4>
            {files.some(f => f.status === 'pending') && (
              <Button size="sm" onClick={uploadFiles} disabled={files.every(f => f.status !== 'pending')}>
                <Loader2 className="h-4 w-4 animate-spin" />
                Upload All
              </Button>
            )}
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {files.map((file) => (
              <div 
                key={file.id} 
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border',
                  file.status === 'error' && 'border-destructive bg-destructive/5',
                  file.status === 'completed' && 'border-green-500/50 bg-green-500/5'
                )}
              >
                <div className="p-2 rounded bg-muted">{getFileIcon(file.file.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.file.size / 1024).toFixed(1)} KB • {file.file.type}
                  </p>
                  {file.status === 'uploading' && (
                    <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all" 
                        style={{ width: `${file.progress}%` }} 
                      />
                    </div>
                  )}
                  {file.status === 'error' && (
                    <p className="mt-1 text-xs text-destructive">{file.error}</p>
                  )}
                  {file.status === 'completed' && (
                    <p className="mt-1 text-xs text-green-600">Uploaded successfully</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => removeFile(file.id)}
                  disabled={file.status === 'uploading'}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}