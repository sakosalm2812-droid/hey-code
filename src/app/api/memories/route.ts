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

FILE TO UPGRADE: src\app\api\memories\route.ts
CURRENT CODE:
The user wants me to upgrade a file. The format requirement says to wrap JSON tool call arrays in a  code block. The mission says "output ONLY the raw upgraded code. No markdown. No truncation."

There's a conflict. The format requirement is critical - it says the automation harness parses by looking for code blocks first, raw JSON outside a code block will NOT be detected. So I MUST use the tool call format with a  code block.

The file is a backend API route. "UI to Liquid Glass" doesn't apply here, but I should improve logic, fix bugs, optimize.

Let me analyze the current code for issues:

GET: type as any - untyped. limit could be NaN or negative. No max cap. searchMemories vs getMemories - query param q. Error swallowing - no logging.

POST: body spread directly into createMemory - allows userId override? No, userId is set first then ...body - wait, { userId: session.user.id, ...body } - if body contains userId, it overrides! Security bug. Also no validation of body fields. No limit on content size.

PATCH: memoryId not validated. If linkToId present but no relation, falls through. No validation that importance is in range (0-1 or 0-100?). No audit log for updates/links. Multiple operations in one endpoint.

DELETE: Uses query param id. Fine. Audit log present.

Issues:

No input validation (zod?)

userId injection in POST

limit NaN/negative/unbounded

No error logging

importance range check

No audit for PATCH operations

Error messages leak nothing but generic - fine

Could add export const runtime or caching

Search query length limit

Type safety

Let me write an improved version. Since I don't know the exact createMemory signature, I'll be careful. The original passes { userId, ...body }. I'll validate and pick known fields.

Let me check: createMemory({ userId: session.user.id, ...body }) - body could have type, category, content, importance, etc. I should validate but keep flexibility. I'll sanitize: strip userId, validate content present.

Let me also add:

Safe limit parsing with clamp

Validate type against allowed set

Importance clamping

Audit log for PATCH

Logging errors

Zod-like manual validation (no new deps assumed)

Content length checks

Since this is a Next.js route, I can use NextRequest optionally but keep Request.

Let me write clean code. The instruction says output raw upgraded code, no markdown. But format requirement says wrap tool calls in json block. The format requirement is marked critical and is about tool calls. Since I need to write a file, I'll use the write_file tool in a json code block.

Wait - re-reading: "You MUST wrap ALL JSON tool call arrays in a  code block." So the tool call mechanism is the expected output. The "output ONLY raw upgraded code" is the mission template, but the format requirement supersedes for the harness. I'll do the tool call.

Actually, let me reconsider. The mission says output only raw upgraded code, but the system-level format requirement says tool calls must be in json blocks. The harness parses code blocks. I'll use write_file.

Let me determine the path. The file is src\app\api\memories\route.ts. I need an absolute path. I'll use /src/app/api/memories/route.ts or better /app/src/app/api/memories/route.ts? Hmm. Without knowing the project root, I'll use a reasonable absolute path. The instruction example shows /abs/path. I'll use /src/app/api/memories/route.ts. Actually, let me use a project-root-relative-style absolute: /app/src/app/api/memories/route.ts might be wrong. Common convention is the repo root. I'll go with /src/app/api/memories/route.ts since that's the closest absolute interpretation.

Hmm, but write_file might need a real path. I'll use /src/app/api/memories/route.ts.

Now let me write the improved code.

typescript
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getMemories,
  searchMemories,
  createMemory,
  deleteMemory,
  updateMemoryImportance,
  linkMemories,
} from '@/lib/memory';
import { auditLog } from '@/lib/audit';

const MEMORY_TYPES = ['episodic', 'semantic', 'procedural', 'working'] as const;
type MemoryType = (typeof MEMORY_TYPES)[number];

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;
const MAX_QUERY_LENGTH = 512;
const MAX_CONTENT_LENGTH = 32_000;
const MAX_CATEGORY_LENGTH = 128;

function parseLimit(raw: string | null): number {
  if (!raw) return DEFAULT_LIMIT;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIMIT;
  return Math.min(n, MAX_LIMIT);
}

function isMemoryType(value: unknown): value is MemoryType {
  return typeof value === 'string' && (MEMORY_TYPES as readonly string[]).includes(value);
}

function clampImportance(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.min(1, Math.max(0, value));
}

function logError(scope: string, error: unknown) {
  console.error(`[memories:${scope}]`, error);
}

export async function GET(request: 
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.