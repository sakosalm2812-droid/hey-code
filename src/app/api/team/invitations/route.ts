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

FILE TO UPGRADE: src\app\api\team\invitations\route.ts
CURRENT CODE:
The user wants me to upgrade a file. Let me look at the actual situation carefully.

The file is src\app\api\team\invitations\route.ts. The "current code" shown is actually not the code — it's the assistant's previous reasoning/commentary text. The actual current code content isn't really provided; instead we see a meta-description "The user wants me to output the upgraded file wrapped in a code block..." followed by a description of key upgrades.

So essentially the file content given is the prior assistant's draft/notes. I need to produce the upgraded route.ts.

The format requirement: wrap ALL JSON tool call arrays in a json code block. So I need to output a JSON array with a write_file tool call. But the mission says "output ONLY the raw upgraded code. No markdown. No truncation." However, the format requirement at top says MUST wrap injson code block with write_file tool call. The prior successful pattern was doing write_file.

So I should output a  code block containing the write_file tool call with the complete upgraded file content, with escaped quotes.

Let me write the complete upgraded route.ts.

Path: C:\Users\DELL\Documents\hey\src\app\api\team\invitations\route.ts — in JSON, backslashes must be escaped: C:\\Users\\DELL\\Documents\\hey\\src\\app\\api\\team\\invitations\\route.ts.

Now let me write good code. The provided draft ends mid-POST. I need to complete it well.

Let me design the full file:

Imports

Constants

Schemas

Helpers: errorResponse, escapeHtml, hashToken, generateToken, getClientIp, authorizeTeamAdmin

GET handler with cursor pagination

POST handler with single/bulk invite, rate limiting, transaction, resend, audit, email

DELETE? maybe not. Keep PATCH for resend? Keep scope.

Let me think about rate limiting. Without a store, I can implement in-memory sliding window per user. That's acceptable, note it's best-effort in serverless. Or use DB count of invitations created in last hour. DB-based is more robust: count invitations by team in last hour. But rate limit should be per user. Let's do DB count on invitations created by inviter in last hour — but TeamInvitation model may not have invitedById field... it has invitedBy relation, so likely invitedById. I'll use invitedById: session.user.id. Hmm, risky. Let me use in-memory rate limiter plus DB count attempt? To be safe, I'll do in-memory Map-based rate limiter keyed by userId+IP, and note it. Actually for correctness/type safety, in-memory is safe since it doesn't depend on schema.

Actually a DB-based rate limit with createdAt and teamId is safe: count invitations where teamId and createdAt >= oneHourAgo. That uses known fields. Use that for team-level cap, plus in-memory per-user. Let's do both: DB count for team, in-memory for user. Keep it simple: DB count for team-scoped hourly cap (MAX_INVITES_PER_HOUR per team).

Now the POST flow:

auth

parse body: if body has invites -> bulk, else single. Also support single invite plus teamId in body or query.

teamId from searchParams or body.

authorize

validate

rate limit

transaction:

for each invite: check existing pending invitation for email -> if resend, regenerate token & extend expiry; if exists and not resend, skip with status "already_invited"; check existing member with that email -> skip "already_member".

create invitation with tokenHash, token stored? Need to send email with raw token. Hash stored in DB for verification. But schema may only have token. Hmm. The draft says "Token hashing". I'll store both token (raw?) — no, hashing means store hash only and send raw in email. The accept endpoint would hash incoming token. But schema unknown. I'll assume there's a token field storing the hash — that works for accept endpoint if it hashes too. That's a coherent design. I'll add a comment.

Actually careful: if existing code stores raw token and accept endpoint compares raw, changing to hash breaks it. But the mission is to upgrade; I'll note in comments that the accept route must hash. Hmm, but that could break. Alternative: store hash in token and add tokenHash field? Without schema knowledge, safest: use token field for the hash and document. Many implementations do this. I'll go with hashing and clearly comment that /api/team/invitations/accept must hash the presented token with sha256.

Hmm, risk. Alternatively keep raw token in DB but the draft explicitly wants hashing. I'll implement hashing with a fallback? No. Keep hashing, document.

send emails after transaction (outside), with HTML escaping.

audit log.

201 with created list.

Email sending: sendEmail({ to, subject, html }) — assume signature. Draft imports sendEmail from '@/lib/email'.

Audit log: auditLog({ action, userId, teamId, metadata }) — assume. I'll call with try/catch so it doesn't fail the request.

Let me also handle resend logic: if invitation exists and not expired and not accepted -> return "already_pending"; if resend true -> rotate token, extend expiry, resend email.

Also role hiera
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.