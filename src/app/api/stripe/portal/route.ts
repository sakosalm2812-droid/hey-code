[FORMAT REQUIREMENT — READ CAREFULLY]
You MUST wrap ALL JSON tool call arrays in a  code block. This is critical: the automation harness parses your response by looking for code blocks first. Raw JSON outside a code block will NOT be detected.
CORRECT format:

[{"tool": "write_file", "path": "/abs/path", "content": "file content here"}]

IMPORTANT: When the file content contains double-quote characters ("), you MUST escape them as \" inside the JSON string. For example, XML like: <tag attr="value"> must be written as: <tag attr=\"value\"> in the JSON content field.


You are the HEY Catalog Specialist.
YOUR SKILL LIBRARY:

--- SKILL.md ---
---
id: 00-andruia-consultant
name: 00-andruia-consultant
description: "Usar al iniciar o mejorar un proyecto de IA: diagnostica código y restricciones, propone skills existentes y redacta tareas y un plan de implementación en español."
category: andruia
risk: safe
source: personal
date_added: "2026-02-27"
---

## When to Use
Use this skill at the very beginning of a project to diagnose the workspace, determine whether it's a "Pure Engine" (new) or "Evolution" (existing) project, and to set the initial technical roadmap and expert squad.

# 🤖 Andru.ia Solutions Architect - Hybrid Engine (v2.0)

## Description

Diagnóstico y planificación de Andru.ia para un proyecto nuevo o existente. Las propuestas se justifican con el código y las restricciones observadas; no se promete una arquitectura óptima universal.

## 📋 General Instructions (El Estándar Maestro)

- **Idioma Mandatorio:** La comunicación y los artefactos se redactan en **ESPAÑOL** por defecto; una instrucción explícita del usuario sobre idioma o formato tiene prioridad.
- **Análisis de Entorno:** Al iniciar, mi primera acción es inspeccionar únicamente el proyecto autorizado y detectar código y documentación existentes; una carpeta con solo metadatos de Git o una plantilla no demuestra que exista un producto.
- **Persistencia:** Materializo el diagnóstico en archivos .md locales cuando la tarea autoriza guardarlos. Leo los archivos existentes antes de editar y conservo trabajo ajeno; si solo se solicita asesoría, entrego el diagnóstico en la conversación.

## 🛠️ Workflow: Bifurcación de Diagnóstico

### ESCENARIO A: Lienzo Blanco (Carpeta Vacía)

Si no detecto archivos, activo el protocolo **"Pure Engine"**:

1. **Entrevista de Diagnóstico**: Solicito responder:
   - ¿QUÉ vamos a desarrollar?
   - ¿PARA QUIÉN es?
   - ¿QUÉ RESULTADO esperas? (Objetivo y estética premium).

### ESCENARIO B: Proyecto Existente (Código Detectado)

Si detecto archivos (src, package.json, etc.), actúo como **Consultor de Evolución**:

1. **Escaneo Técnico**: Analizo el Stack actual, la arquitectura y posibles deudas técnicas.
2. **Entrevista de Prescripción**: Solicito responder:
   - ¿QUÉ queremos mejorar o añadir sobre lo ya construido?
   - ¿CUÁL es el mayor punto de dolor o limitación técnica actual?
   - ¿A QUÉ estándar de calidad queremos elevar el proyecto?
3. **Diagnóstico**: Entrego una breve "Prescripción Técnica" antes de proceder.

## 🚀 Fase de Sincronización de Squad y Materialización

Para ambos escenarios, tras recibir las respuestas:

1. **Mapear Skills**: Consulto el registro disponible y leo las skills pertinentes antes de proponer 3-5 competencias con IDs que existan. Si falta una competencia, declaro el hueco en vez de inventar un ID. Proponer competencias no crea agentes ni autoriza delegación.
2. **Generar Artefactos (En Español)**:
   - `tareas.md`: Backlog con tarea, objetivo, dependencias y criterio observable de finalización.
   - `plan_implementacion.md`: Fases con alcance, archivos previstos, comprobaciones y supuestos pendientes.

3. **Verificar Entrega**: Releer el diagnóstico y los artefactos. Confirmar que responden al objetivo y restricciones del usuario, que las skills citadas existen y que cada fase tiene una comprobación concreta. Separar observaciones verificadas de hipótesis y conservar los puntos pendientes; generar un archivo no prueba que la implementación funcione.

## ⚠️ Reglas de Oro

1. **Contexto Inteligente**: No mezcles datos de proyectos anteriores. Cada carpeta es una entidad única.
2. **Estándar de Diamante**: Prioriza siempre soluciones escalables, seguras y estéticamente superiores.

## Example

**User request:**

> Diagnostica este proyecto de IA existente y propone una mejora; entrega primero el diagnóstico en la conversación.

**Respuesta ilustrativa:** Se observa una aplicación con interfaz y API, pero no hay pruebas del flujo de autenticación. 
PREVIOUSLY SUCCESSFUL PATTERN:

You are the HEY Catalog Specialist.
YOUR SKILL LIBRARY:

--- SKILL.md ---
---
id: 00-andruia-consultant
name: 00-andruia-consultant
description: "Usar al iniciar o mejorar un proyecto de IA: diagnostica código y restricciones, propone skills existentes y redacta tareas y un plan de implementación en español."
category: andruia
risk: safe
source: personal
date_added: "2026-02-27"
---

## When to Use
Use this skill at the very beginning of a project to diagnose the workspace, determine

FILE TO UPGRADE: src\app\api\stripe\portal\route.ts
CURRENT CODE:
[{"tool":"write_file","path":"src/app/api/stripe/portal/route.ts","content":"import { auth } from '@/lib/auth';\nimport { NextRequest, NextResponse } from 'next/server';\nimport { z } from 'zod';\nimport { createPortalSession } from '@/lib/stripe';\nimport { randomUUID } from 'crypto';\n\n// ───────────────────────────────────────────────────────────────────────────\n// Configuration\n// ───────────────────────────────────────────────────────────────────────────\nconst RATE_LIMIT_WINDOW_MS = 60_000;\nconst RATE_LIMIT_MAX = 5;\nconst PORTAL_TIMEOUT_MS = 10_000;\n\nconst ALLOWED_RETURN_ORIGINS: string[] = [\n  process.env.NEXT_PUBLIC_APP_URL,\n  process.env.NEXTAUTH_URL,\n].filter((value): value is string => Boolean(value));\n\n// ───────────────────────────────────────────────────────────────────────────\n// Security headers applied to every response\n// ───────────────────────────────────────────────────────────────────────────\nconst SECURITY_HEADERS: Record<string, string> = {\n  'Cache-Control': 'no-store, max-age=0, must-revalidate',\n  'X-Content-Type-Options': 'nosniff',\n  'Referrer-Policy': 'no-referrer',\n  'X-Frame-Options': 'DENY',\n  'Permissions-Policy': 'browsing-topics=()',\n};\n\n// ───────────────────────────────────────────────────────────────────────────\n// Lightweight in-memory token bucket (swap for Redis/Upstash in multi-node)\n// ───────────────────────────────────────────────────────────────────────────\ntype Bucket = { count: number; resetAt: number };\nconst buckets = new Map<string, Bucket>();\n\nfunction rateLimit(key: string): { ok: boolean; retryAfter: number } {\n  const now = Date.now();\n  const bucket = buckets.get(key);\n\n  if (!bucket || bucket.resetAt <= now) {\n    buckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });\n    return { ok: true, retryAfter: 0 };\n  }\n\n  bucket.count += 1;\n  if (bucket.count > RATE_LIMIT_MAX) {\n    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));\n    return { ok: false, retryAfter };\n  }\n\n  // Opportunistic cleanup to bound memory growth.\n  if (buckets.size > 10_000) {\n    for (const [k, v] of buckets) {\n      if (v.resetAt <= now) buckets.delete(k);\n    }\n  }\n\n  return { ok: true, retryAfter: 0 };\n}\n\n// ───────────────────────────────────────────────────────────────────────────\n// Request schema\n// ───────────────────────────────────────────────────────────────────────────\nconst PortalRequestSchema = z\n  .object({\n    returnUrl: z.string().url().max(2048).optional(),\n    flowType: z\n      .enum(['payment_method_update', 'subscription_cancel', 'subscription_update'])\n      .optional(),\n    locale: z.string().min(2).max(10).optional(),\n  })\n  .strict();\n\ntype PortalRequest = z.infer<typeof PortalRequestSchema>;\n\n// ───────────────────────────────────────────────────────────────────────────\n// Helpers\n// ───────────────────────────────────────────────────────────────────────────\nfunction isAllowedReturnUrl(url: string | undefined): boolean {\n  if (!url) return true;\n  try {\n    const parsed = new URL(url);\n    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;\n\n    if (ALLOWED_RETURN_ORIGINS.length === 0) {\n      // No allow-list configured: permit only in non-production environments.\n      return process.env.NODE_ENV !== 'production';\n    }\n\n    return ALLOWED_RETURN_ORIGINS.some((allowed) => {\n      try {\n        return new URL(allowed).origin === parsed.origin;\n      } catch {\n        return false;\n      }\n    });\n  } catch {\n    return false;\n  }\n}\n\nfunction getClientIp(req: NextRequest): string {\n  const forwarded = req.headers.get('x-forwarded-for');\n  if (forwarded) return forwarded.split(',')[0]!.trim();\n  return req.headers.get('x-real-ip') ?? 'unknown';\n}\n\nfunction withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {\n  return new Promise<T>((resolve, reject) => {\n    const timer = setTimeout(() => reject(new Error('PORTAL_TIMEOUT')), ms);\n    promise.then(\n      (value) => {\n        clearTimeout(timer);\n        resolve(value);\n      },\n      (error) => {\n        clearTimeout(timer);\n        reject(error);\n      },\n    );\n  });\n}\n\nfunction jsonError(\n  code: string,\n  message: string,\n  status: number,\n  requestId: string,\n  extra: Record<string, unknown> = {},\n): NextResponse {\n  const headers: Record<string, string> = { ...SECURITY_HEADERS, 'X-Request-Id': requestId };\n  if (typeof extra.retryAfter === 'number') {\n    headers['Retry-After'] = String(extra.retryAfter);\n  }\n\n  return NextResponse.json(\n    { ok: false, error: { code, message, requestId, ...extra } },\n    { status, headers },\n  );\n}\n\n// ───────────────────────────────────────────────────────────────────────────\n// POST /api/stripe/portal\n// ───────────────────────────────────────────────────────────────────────────\nconst ALLOWED_METHODS = 'POST, OPTIONS';\n\nexport async function POST(req: N
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.