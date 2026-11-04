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

FILE TO UPGRADE: src\app\api\proactive\route.ts
CURRENT CODE:
The user wants an upgraded version of the Next.js API route file. They said "output ONLY the raw upgraded code. No markdown. No truncation." But the format requirement says JSON tool call arrays must be wrapped in  code block. This is a conflict. The file content is the actual task; the format requirement is a meta-instruction about how to output tool calls. Since I'm not calling tools, I should output the code. But the system prompt says to wrap all JSON tool call arrays in code blocks — that applies only to tool call arrays. I'm not using tools here; I'm producing code directly.

Wait, the mission says "output ONLY the raw upgraded code. No markdown." So I should output raw code. But the format requirement file says "You MUST wrap ALL JSON tool call arrays in a  code block." That's for tool calls. Since there are no tool calls, I just output code.

However, could this be an automation harness where I should use write_file? The file says "FILE TO UPGRADE" and mission says output raw code. But the format requirement mentions write_file tool. Hmm. The instruction "Otherwise, output ONLY the raw upgraded code" seems to indicate direct output. But the harness parses code blocks for tool calls. The safest: output raw upgraded code only, as instructed by mission. But the "FORMAT REQUIREMENT — READ CAREFULLY" is a file the user included, likely overriding.

Actually, the format requirement says wrap ALL JSON tool call arrays. If I want to write the file, I'd use write_file. The path given: src\app\api\proactive\route.ts — relative. The write_file example uses /abs/path.

Let me think: the task says "MISSION: Make this file 10x better... Otherwise, output ONLY the raw upgraded code." So the expected output is code. I'll output the improved code.

Let me improve the route:

Add proper error logging.

Validate session.

Add caching headers? dynamic = force-dynamic already.

Handle errors with more detail, maybe log.

Type safety.

Add timeout / abort? getProactiveInsights unknown.

Add rate limiting? not necessary.

Return 503 if provider issue?

Use NextResponse.json with status.

Add export const revalidate = 0 maybe.

Add runtime = 'nodejs'?

Add request param? GET no request.

Add HEAD? no.

Ensure errors don't leak.

Add Cache-Control: no-store.

Add try/catch around auth separately.

Use unknown error handling.

Add x-request-id? overkill.

Let me write clean code:

ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getProactiveInsights } from '@/lib/proactive';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

const NO_STORE = { 'Cache-Control': 'no-store, max-age=0' } as const;

export async function GET() {
  let session;
  try {
    session = await auth();
  } catch (error) {
    console.error('[proactive] auth failed', error);
    return NextResponse.json(
      { error: 'Authentication service unavailable' },
      { status: 503, headers: NO_STORE },
    );
  }

  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: NO_STORE },
    );
  }

  try {
    const { insights, provider } = await getProactiveInsights(userId);

    return NextResponse.json(
      {
        insights: insights ?? [],
        generatedAt: new Date().toISOString(),
        ...(provider ? { provider } : {}),
      },
      { status: 200, headers: NO_STORE },
    );
  } catch (error) {
    console.error('[proactive] failed to build insights', { userId, error });
    return NextResponse.json(
      { error: 'Failed to build proactive insights' },
      { status: 500, headers: NO_STORE },
    );
  }
}

That's decent. Maybe also handle non-array insights.

But the instruction says output raw code only, no markdown. I'll output that. However the outer format requirement says code blocks for JSON tool calls. Since no tool calls, just code.

Wait — but the system prompt at top: "You MUST wrap ALL JSON tool call arrays in a  code block." It's about tool calls. So direct code output is fine.

Actually, re-reading: the user message contains the file content which includes the format requirement. The "PREVIOUSLY SUCCESSFUL PATTERN" suggests they expect a code block maybe? It says "output ONLY the raw upgraded code. No markdown." That's explicit. I'll follow that.

But hold on — the harness parses code blocks first for tool calls. If I output raw code, it won't be detected as a tool call, which is fine because I'm not calling a tool. The mission wants raw code. So output raw code.

Let me finalize the code with perhaps improved logic. Should I add export const preferredRegion? no.

Also note: catch (error) unused in original — improve.

I'll output.

One consideration: the user says "If already perfect, output exactly: PASS." It's not perfect. Output code.

I'll produce the code without markdown fences. But the assistant final answer can include just code. The instr
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.