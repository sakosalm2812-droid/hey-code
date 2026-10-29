'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Image as ImageIcon, Loader2, Download, Sparkles, X, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  revisedPrompt?: string;
  size?: (typeof SIZES)[number];
  quality?: (typeof QUALITIES)[number];
  style?: 'vivid' | 'natural';
  createdAt: Date;
}

interface ImageGeneratorProps {
  onImageGenerated?: (image: GeneratedImage) => void;
  disabled?: boolean;
}

const SIZES = ['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'] as const;
const QUALITIES = ['standard', 'hd'] as const;

type Size = (typeof SIZES)[number];
type Quality = (typeof QUALITIES)[number];

export function ImageGenerator({ onImageGenerated, disabled = false }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<Size>('1024x1024');
  const [quality, setQuality] = useState<Quality>('standard');
  const [style, setStyle] = useState<'vivid' | 'natural'>('vivid');
  const [generating, setGenerating] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generateImage = async () => {
    if (!prompt.trim() || generating) return;
    
    setGenerating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, size, quality, style }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Generation failed');
      }

      const data = await response.json();
      
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: data.url,
        prompt,
        revisedPrompt: data.revised_prompt,
        createdAt: new Date(),
      };

      setImages(prev => [newImage, ...prev]);
      onImageGenerated?.(newImage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setGenerating(false);
    }
  };

  const downloadImage = async (url: string, prompt: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const url_ = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url_;
      a.download = `hey-${prompt.slice(0, 30).replace(/[^a-z0-9]/gi, '-')}.png`;
      a.click();
      URL.revokeObjectURL(url_);
    } catch {
      alert('Failed to download image');
    }
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Generate Image</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="prompt">Prompt</Label>
          <Input
            id="prompt"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A futuristic cityscape at sunset, cyberpunk style, highly detailed..."
            disabled={generating || disabled}
          />
          <p className="text-xs text-muted-foreground">
            Be descriptive. Mention style, lighting, composition, colors.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="size">Size</Label>
            <select
              id="size"
              value={size}
              onChange={(e) => setSize(e.target.value as Size)}
              disabled={generating || disabled}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {SIZES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quality">Quality</Label>
            <select
              id="quality"
              value={quality}
              onChange={(e) => setQuality(e.target.value as Quality)}
              disabled={generating || disabled}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {QUALITIES.map(q => (
                <option key={q} value={q}>{q.charAt(0).toUpperCase() + q.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="style">Style</Label>
            <select
              id="style"
              value={style}
              onChange={(e) => setStyle(e.target.value as 'vivid' | 'natural')}
              disabled={generating || disabled}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="vivid">Vivid</option>
              <option value="natural">Natural</option>
            </select>
          </div>
        </div>

        <Button
          className="w-full gap-2"
          onClick={generateImage}
          disabled={!prompt.trim() || generating || disabled}
          size="lg"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Image
            </>
          )}
        </Button>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive text-destructive text-sm flex items-center gap-2">
            <X className="h-4 w-4" />
            {error}
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">Generated Images</h4>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((image) => (
              <div key={image.id} className="relative group rounded-lg overflow-hidden border">
                <div className="aspect-square relative">
                  <img
                    src={image.url}
                    alt={image.prompt}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
                    <Button
                      variant="default"
                      size="icon"
                      className="bg-white/90"
                      onClick={() => downloadImage(image.url, image.prompt)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-white/90"
                      onClick={() => navigator.clipboard.writeText(image.url)}
                    >
                      <span className="h-4 w-4">📋</span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="bg-white/90"
                      onClick={() => removeImage(image.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  <p className="text-sm font-medium line-clamp-2">{image.prompt}</p>
                  {image.revisedPrompt && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      Revised: {image.revisedPrompt}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{image.size}</span>
                    <span>•</span>
                    <span>{image.quality}</span>
                    <span>•</span>
                    <span>{image.style}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {images.length === 0 && !generating && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No images generated yet. Enter a prompt above to create your first image!</p>
        </div>
      )}
    </div>
  );
}