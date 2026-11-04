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

FILE TO UPGRADE: src\app\api\voice\route.ts
CURRENT CODE:
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import OpenAI from 'openai';
import { auditLog } from '@/lib/audit';

const GROQ_TRANSCRIPTION_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const GROQ_WHISPER_MODEL = 'whisper-large-v3';

/**
 * Transcribes audio using Groq's free Whisper endpoint when GROQ_API_KEY is
 * configured (whisper-large-v3 is free on Groq), otherwise OpenAI Whisper.
 */
async function transcribeWithGroq(audioFile: File): Promise<string> {
  const form = new FormData();
  form.append('model', GROQ_WHISPER_MODEL);
  form.append('file', audioFile);
  form.append('language', 'en');
  form.append('response_format', 'json');

  const response = await fetch(GROQ_TRANSCRIPTION_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: form,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Groq transcription failed (${response.status}): ${detail.slice(0, 300)}`);
  }

  const data: any = await response.json();
  if (!data?.text) throw new Error('No transcription returned.');
  return data.text as string;
}

async function transcribeWithOpenAI(audioFile: File): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
    language: 'en',
    response_format: 'json',
  });
  return transcription.text;
}

interface TranscribeResult {
  text: string;
  provider: 'groq' | 'openai';
}

async function transcribe(audioFile: File): Promise<TranscribeResult> {
  if (process.env.GROQ_API_KEY) {
    const text = await transcribeWithGroq(audioFile);
    return { text, provider: 'groq' };
  }
  if (process.env.OPENAI_API_KEY) {
    const text = await transcribeWithOpenAI(audioFile);
    return { text, provider: 'openai' };
  }
  throw new Error('Voice transcription is not configured. Add a GROQ_API_KEY (free) or OPENAI_API_KEY to your .env file.');
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const rateLimit = await checkRateLimit(userId, { windowMs: 60 * 1000, maxRequests: 10, keyPrefix: 'voice' });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Voice rate limit exceeded' }, { status: 429 });
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'Audio file too large (max 25MB)' }, { status: 400 });
    }

    const { text, provider } = await transcribe(audioFile);

    await auditLog(userId, 'VOICE_TRANSCRIPTION', 'voice', {
      duration: audioFile.size,
      textLength: text.length,
      provider,
    }, request);

    return NextResponse.json({ text });
  } catch (error) {
    console.error('Voice transcription error:', error);
    const message = error instanceof Error ? error.message : 'Transcription failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.