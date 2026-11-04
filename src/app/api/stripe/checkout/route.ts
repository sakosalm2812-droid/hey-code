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

FILE TO UPGRADE: src\app\api\stripe\checkout\route.ts
CURRENT CODE:
The user wants me to upgrade a Next.js Stripe checkout route. The file content was truncated. I need to output the upgraded file as a JSON tool call array wrapped in a  code block.

The current code is incomplete (truncated at "INVAL"). I need to complete and upgrade it.

Let me think about what a "10x better" version looks like:

Fix the truncated part - complete the INVALID_PRICE error

Keep all existing logic working

Add improvements

Issues in current code:

Rate limiting is in-memory Map - doesn't work in serverless/multi-instance. Should note or keep with caveat.

setInterval at module level in Next.js edge/serverless is problematic - it may never run or cause memory leaks. Better to use lazy cleanup.

content-length header can be spoofed, but they do text.length check too.

parsed.error.errors - in newer Zod it's parsed.error.issues. Should handle both.

Missing return of the actual checkout session URL - the truncated part likely had createCheckoutSession(...).

Idempotency: clientRequestId is parsed but not used.

Allowlist: when empty, it passes through - security risk? Actually they said back-compat.

No CSRF/origin check.

Success/cancel URL should be validated against allowed origins to prevent open redirect.

Rate limit key includes IP but x-forwarded-for can be spoofed; should note.

Need export const preferredRegion maybe not.

Should use stripe idempotency key.

Let me write the complete upgraded file.

Key upgrades:

Complete the truncated code properly.

Add origin/CSRF validation for success/cancel URLs.

Use clientRequestId as Stripe idempotency key.

Fix Zod error access (issues vs errors).

Lazy rate-limit cleanup instead of module-level setInterval (safer for serverless).

Add structured logging.

Better error handling around createCheckoutSession.

Validate that success/cancel URLs belong to the app origin.

Add Vary header maybe not needed.

Ensure ALLOWED_PRICE_IDS check has a clear error message.

Add timing-safe comparison? Not needed.

Use crypto.randomUUID for request id for logs.

Make rate limiter keyed on user only (or user+ip) - keep.

Body size: use both content-length and actual text length.

Add mode passed to createCheckoutSession if signature supports it - but original only passes (userId, priceId). To be safe, keep original signature, but we can pass options via extended options with safe cast. Actually the original code may have extended options. Since we don't know the signature, safest is to call exactly createCheckoutSession(session.user.id, priceId) and not forward extra options to avoid breaking. Hmm but the prompt says "extended options forwarding (with safe cast)". I'll forward options carefully as a third argument, but if the function only accepts 2 args, TypeScript would error. To be safe, I can cast.

Actually let me reconsider: the instruction says preserve existing working logic: createCheckoutSession(session.user.id, priceId). So I should keep that exact call. Forwarding extra options could break if signature is (userId: string, priceId: string). I can do:

ts
const session = await createCheckoutSession(userId, priceId);

And not forward options. But then mode, promoCode, quantity etc. are unused. Hmm. Maybe the original intent is that createCheckoutSession supports options. But since it's truncated, I'll be pragmatic: call with two args, and note that extended options require signature update. But unused variables cause TS errors with noUnusedLocals.

Alternative: use the options only for validation, and pass through if the function is typed to accept. I'll do a safe optional third arg via cast:

ts
const checkout = await (createCheckoutSession as unknown as (
  userId: string,
  priceId: string,
  opts?: Record<string, unknown>
) => Promise<{ url: string }>)(userId, priceId, {
  mode,
  promoCode,
  quantity,
  successUrl,
  cancelUrl,
  idempotencyKey: clientRequestId,
});

That's a "safe cast" as mentioned. But it could break at runtime if function ignores extra args — that's fine, JS ignores extra args. So it's safe.

Wait, "safe cast" — but if the function's second param is actually an options object and priceId is inside... no, original was (session.user.id, priceId). So two positional args. Adding a third is safe at runtime. Good.

Let me also handle the case where parsed.error.errors is undefined. Use parsed.error.issues?.[0]?.message ?? parsed.error.message.

Rate limiter: replace module-level setInterval with lazy sweep on each call (probabilistic). That avoids serverless timer issues.

Also add export const preferredRegion = 'auto'? Not necessary.

Origin validation: compare new URL(successUrl).origin with request origin or process.env.NEXT_PUBLIC_APP_URL. If not matching, reject. But maybe clients legitimately pass absolute URLs to the same app. I'll allow if origin matches request.nextUrl.origin or ALLOWED_ORIGINS env. If successUrl not provided, skip.

Let me write full code.

ts
import { auth } from '@/lib/auth';
import { NextRequest, N
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.