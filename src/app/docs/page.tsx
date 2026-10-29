'use client';

import { useEffect, useRef } from 'react';
import { openApiSpec } from '@/lib/openapi/spec';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ExternalLink,
  Copy,
  Download,
  Code,
  Globe,
  Key,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

const ERROR_EXAMPLE = `{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": { "retryAfter": 45 }
}`;

const CHAT_EXAMPLE = `const response = await fetch('https://hey.ai/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer hey_live_abc123...'
  },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'Write a React component for a todo list' }
    ],
    model: 'GPT_4O',
    systemPrompt: 'You are a helpful coding assistant.'
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\\n').filter(l => l.startsWith('data: '));

  for (const line of lines) {
    const data = JSON.parse(line.slice(6));
    if (data.chunk) process.stdout.write(data.chunk);
    if (data.done) console.log('\\nDone! Tokens:', data.tokens);
  }
}`;

const IMAGE_EXAMPLE = `const response = await fetch('https://hey.ai/api/images/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer hey_live_abc123...'
  },
  body: JSON.stringify({
    prompt: 'A futuristic cityscape at sunset, cyberpunk style, highly detailed',
    size: '1024x1024',
    quality: 'hd',
    style: 'vivid'
  })
});

const { url, revised_prompt } = await response.json();
console.log('Image URL:', url);
console.log('Revised prompt:', revised_prompt);`;

const VOICE_EXAMPLE = `const formData = new FormData();
formData.append('audio', audioBlob, 'recording.webm');

const response = await fetch('https://hey.ai/api/voice', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer hey_live_abc123...'
  },
  body: formData
});

const { text } = await response.json();
console.log('Transcription:', text);`;

const UPLOAD_EXAMPLE = `const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('https://hey.ai/api/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer hey_live_abc123...'
  },
  body: formData
});

const { url, fileName, fileSize } = await response.json();
console.log('File uploaded:', url);`;

const TEAM_EXAMPLE = `// Create team
await fetch('https://hey.ai/api/team', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer hey_live_...' },
  body: JSON.stringify({ name: 'Acme Inc', slug: 'acme-inc', description: 'Our team' })
});

// Invite member
await fetch('https://hey.ai/api/team/invitations?teamId=team_123', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer hey_live_...' },
  body: JSON.stringify({ email: 'colleague@company.com', role: 'ADMIN' })
});`;

export default function DocsPage() {
  const swaggerRef = useRef<HTMLDivElement>(null);
  const specRef = useRef(openApiSpec);

  useEffect(() => {
    if (swaggerRef.current && !swaggerRef.current.hasChildNodes()) {
      import('swagger-ui-dist').then(() => {});
    }
  }, []);

  useEffect(() => {
    const loadSwaggerUI = async () => {
      const container = swaggerRef.current;
      if (!container) return;

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/swagger-ui-dist@5.10.0/swagger-ui-bundle.js';
      script.onload = () => {
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://unpkg.com/swagger-ui-dist@5.10.0/swagger-ui.css';
        document.head.appendChild(css);

        // @ts-ignore
        window.SwaggerUIBundle({
          spec: specRef.current,
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            // @ts-ignore
            window.SwaggerUIBundle.presets.apis,
            // @ts-ignore
            window.SwaggerUIStandalonePreset
          ],
          plugins: [
            // @ts-ignore
            window.SwaggerUIBundle.plugins.DownloadUrl
          ],
          layout: 'StandaloneLayout',
          displayRequestDuration: true,
          filter: true,
          showExtensions: true,
          showCommonExtensions: true,
          tryItOutEnabled: true,
        });
      };
      document.body.appendChild(script);
    };

    loadSwaggerUI();
  }, []);

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6" aria-label="HEY Home">
            <span className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              HEY
            </span>
          </Link>
          <h1 className="text-4xl font-bold tracking-tight mb-4">API Documentation</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Complete API reference for HEY. All endpoints require authentication via session cookie or API key.
          </p>
        </header>

        <Tabs defaultValue="reference" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="reference">
              <Globe className="h-4 w-4 mr-2" />
              API Reference
            </TabsTrigger>
            <TabsTrigger value="authentication">
              <Key className="h-4 w-4 mr-2" />
              Authentication
            </TabsTrigger>
            <TabsTrigger value="examples">
              <Code className="h-4 w-4 mr-2" />
              Examples
            </TabsTrigger>
            <TabsTrigger value="openapi">
              <Download className="h-4 w-4 mr-2" />
              OpenAPI Spec
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reference">
            <Card className="h-[80vh]">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Interactive API Explorer</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href="/api/openapi.json" target="_blank" rel="noopener">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View JSON
                    </a>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 h-[calc(100%-80px)]">
                <div id="swagger-ui" ref={swaggerRef} className="h-full">
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Loading API documentation...</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="authentication">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Authentication Methods
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="font-medium">1. Session Cookie (Browser)</h4>
                    <p className="text-sm text-muted-foreground">
                      When using the web app, authentication is handled automatically via NextAuth.js session cookies.
                      No additional headers needed for same-origin requests.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium">2. API Key (Programmatic)</h4>
                    <p className="text-sm text-muted-foreground">
                      Generate API keys in Settings - API Keys. Include in Authorization header:
                    </p>
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                      <code>{`Authorization: Bearer hey_live_abc123...`}</code>
                    </pre>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium">3. OAuth (Third-party)</h4>
                    <p className="text-sm text-muted-foreground">
                      For third-party integrations, use OAuth 2.0 with Google or GitHub.
                      Redirect users to <code>/api/auth/signin/google</code> or <code>/api/auth/signin/github</code>.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Rate Limits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-2">Endpoint</th>
                          <th className="pb-2">Limit</th>
                          <th className="pb-2">Window</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b"><td className="py-2 font-mono">/api/chat</td><td className="py-2">30 req</td><td className="py-2">1 min</td></tr>
                        <tr className="border-b"><td className="py-2 font-mono">/api/auth/*</td><td className="py-2">10 req</td><td className="py-2">15 min</td></tr>
                        <tr className="border-b"><td className="py-2 font-mono">/api/voice</td><td className="py-2">10 req</td><td className="py-2">1 min</td></tr>
                        <tr className="border-b"><td className="py-2 font-mono">/api/images/generate</td><td className="py-2">5 req</td><td className="py-2">1 min</td></tr>
                        <tr className="border-b"><td className="py-2 font-mono">/api/upload</td><td className="py-2">20 req</td><td className="py-2">1 min</td></tr>
                        <tr><td className="py-2 font-mono">/api/*</td><td className="py-2">60 req</td><td className="py-2">1 min</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Limits are per user/IP. Exceeding limits returns <code>429 Too Many Requests</code> with <code>Retry-After</code> header.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Error Responses</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{ERROR_EXAMPLE}</code>
                  </pre>
                  <p className="text-sm text-muted-foreground">
                    All errors follow this format. Check the <code>code</code> field for programmatic handling.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="examples">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Chat Completion (Streaming)</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{CHAT_EXAMPLE}</code>
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Image Generation</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{IMAGE_EXAMPLE}</code>
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Voice Transcription</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{VOICE_EXAMPLE}</code>
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>File Upload</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{UPLOAD_EXAMPLE}</code>
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Team Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{TEAM_EXAMPLE}</code>
                  </pre>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="openapi">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  OpenAPI 3.0 Specification
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href="/api/openapi.json" target="_blank" rel="noopener">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Raw JSON
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      const blob = new Blob([JSON.stringify(openApiSpec, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'hey-api-spec.json';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto max-h-[60vh] overflow-y-auto">
                  <code>{JSON.stringify(openApiSpec, null, 2)}</code>
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
