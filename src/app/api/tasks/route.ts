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

FILE TO UPGRADE: src\app\api\tasks\route.ts
CURRENT CODE:
The user wants me to upgrade the file. The format requirement says to wrap JSON tool calls in  code block. But the mission says "output ONLY the raw upgraded code. No markdown. No truncation."

There's a conflict. The format requirement is about wrapping tool call arrays in json code blocks. But if I'm just outputting code (not a tool call), the mission says raw code only.

Actually, let me re-read: "You MUST wrap ALL JSON tool call arrays in a  code block." So if I'm making tool calls. But the mission says output only raw upgraded code. This is a bit ambiguous—do they want a tool call to write the file, or just raw code?

Given the previous successful pattern suggests writing files, but the mission explicitly says "output ONLY the raw upgraded code. No markdown. No truncation."

Hmm, but the format requirement says the automation harness parses code blocks first. So I should output a JSON tool call. But the mission contradicts.

Let me think about what's most likely: The automation harness wants a tool call to write_file. The "output only raw upgraded code" might be legacy instruction. But the format requirement is "READ CAREFULLY" and critical. It says "You MUST wrap ALL JSON tool call arrays in a  code block."

I think the safest interpretation: produce a write_file tool call wrapped in json code block, with the upgraded content escaped.

The file is truncated at the end: return NextResponse.json({ e — I need to complete it sensibly. The DELETE handler should probably check task exists, delete, audit log, return success.

Let me write the complete upgraded file.

Improvements:

Shared auth guard helper to reduce repetition.

Validate due date format.

Better error handling for JSON parse failures.

Consistent rate limiting on PATCH/DELETE? Maybe not needed.

Sanitize/limit description length.

Use proper type for task filters.

Handle malformed JSON body -> 400.

Ensure updateTask actually checks ownership (assume yes).

Complete the DELETE handler: check exists, delete, audit, return.

Add notification link maybe.

Consistent response shapes.

Fix title trim on update (currently uses body.title untrimmed).

Add tags dedupe.

Better status validation on GET filters (validate against TASK_STATUSES/TASK_PRIORITIES).

Try/catch for audit log and notifications already there.

Improve error detection with a custom error class? Keep simple.

Liquid Glass UI — this is an API route, no UI. I'll focus on logic/robustness.

Let me write the complete file:

ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { auditLog } from '@/lib/audit';
import { chatRateLimiter } from '@/lib/rate-limit';
import {
  createTask,
  listTasks,
  getTaskById,
  updateTask,
  deleteTask,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from '@/lib/tasks';
import { createNotification } from '@/lib/notifications';

const MAX_TITLE_LENGTH = 300;
const MAX_DESCRIPTION_LENGTH = 10_000;
const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 50;

type TaskPriority = (typeof TASK_PRIORITIES)[number];
type TaskStatus = (typeof TASK_STATUSES)[number];

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function normalizeTags(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const raw of input) {
    if (typeof raw !== 'string') continue;
    const tag = raw.trim();
    if (!tag || tag.length > MAX_TAG_LENGTH) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
    if (tags.length >= MAX_TAGS) break;
  }
  return tags;
}

function normalizeDueDate(input: unknown): string | null | undefined {
  if (input === undefined) return undefined;
  if (input === null || input === '') return null;
  if (typeof input !== 'string') return undefined;
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return input;
}

function normalizeDescription(input: unknown): string | undefined {
  if (typeof input !== 'string') return undefined;
  const trimmed = input.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, MAX_DESCRIPTION_LENGTH);
}

function normalizeTitle(input: unknown): string | undefined {
  if (typeof input !== 'string') return undefined;
  const trimmed = input.trim();
  return trimmed || undefined;
}

export async function GET(request: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const priorityParam = searchParams.get('priority');
    const due = searchParams.get('due') ?? un
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.