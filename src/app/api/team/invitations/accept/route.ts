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

FILE TO UPGRADE: src\app\api\team\invitations\accept\route.ts
CURRENT CODE:
The user wants me to upgrade the file. Let me look at the current code.

The current code is src/app/api/team/invitations/accept/route.ts — a Next.js App Router API route for accepting team invitations.

Current code has:

Uses auth from @/lib/auth, prisma, auditLog

In-memory rate limiting map

Zod token validation

Error helper

extractToken

Some helpers but the actual GET/POST handlers aren't shown — the code seems truncated/incomplete. The shown code ends at a type definition InvitationState.

I need to output the entire upgraded file. Since the file is incomplete, I should produce a complete, robust implementation. Let me write a comprehensive route.ts.

Key improvements:

Fix rate limiting (in-memory won't survive serverless; but keep as fallback, maybe use a pluggable store). Add cleanup, better key.

Use constant-time-ish token hashing — store hash of token instead of raw token. But I don't know the schema. Typical: Invitation model with token, email, role, teamId, expiresAt, acceptedAt. I'll assume fields: id, token, email, role, teamId, expiresAt, acceptedAt, invitedById.

Atomic acceptance via prisma.$transaction with conditional update (updateMany where acceptedAt is null and expiresAt > now) to prevent race / double-accept.

Seat limits: team max members.

Email mismatch check.

Audit logging.

Security headers, no-store.

Proper error handling, no leaking details.

GET to preview invitation, POST to accept.

Handle already-member case (idempotent).

Normalize email case.

Revalidate paths? maybe not.

I'll write it carefully. Also need to be careful about the "Liquid Glass" UI note — that's generic boilerplate; this is an API route, no UI. I'll note improvements in code comments minimally (but "no markdown" so only raw code).

Let me write the final TypeScript.

Key design:

ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

Rate limit: keep in-memory but with better structure and note about distributed.

Token: accept from header x-invitation-token, query token, or body.

GET: preview — requires auth? Preview could be public but shouldn't leak team member data. I'll require auth for preview too? Hmm. Actually invitation preview before login is useful (to show team name). I'll allow unauthenticated preview but only return team name + role + inviter name, not email. Actually the email is needed to verify. I'll return masked email? For simplicity: GET requires auth? Let me make GET public-safe: returns team name, role, expiresAt, and a boolean whether the signed-in user (if any) matches. That's nice.

POST: requires auth. Checks:

rate limit

token valid

invitation exists

not expired

not accepted

email matches (case-insensitive) OR allow if user has verified email matching

team seat capacity

transaction: conditional updateMany on invitation (acceptedAt null, expiresAt > now) → count===1, then create membership (upsert) with unique (userId, teamId)

audit log

Race: use transaction with updateMany guard.

Also handle Prisma unique constraint error P2002 → treat as already member.

Let's define max team members constant e.g. 50.

Write the code.

ts
const MAX_TEAM_MEMBERS = 50;
const INVITATION_TTL... 

For the transaction:

ts
const result = await prisma.$transaction(async (tx) => {
  const claimed = await tx.invitation.updateMany({
    where: { id: invitation.id, acceptedAt: null, expiresAt: { gt: now } },
    data: { acceptedAt: now, acceptedById: userId },
  });
  if (claimed.count === 0) return { ok: false, reason: 'race' };
  const memberCount = await tx.teamMember.count({ where: { teamId: invitation.teamId } });
  if (memberCount >= MAX_TEAM_MEMBERS) throw new TeamFullError();
  ...
});

Careful: throwing inside transaction rolls back, good. But we need to count before claiming? Doing count inside tx after claim, throwing rolls back the claim. Fine.

Actually better: check capacity before claim inside tx too. Either way, rollback on throw.

Use upsert for membership to be idempotent — but if updateMany guard succeeded, they weren't a member... actually they might already be a member (invited twice). Then upsert returns existing. We should check membership first: if already a member, mark invitation accepted and return success with alreadyMember: true.

Prisma model names: I'll guess teamMember with fields teamId, userId, role. And invitation model with teamId, email, role, token, expiresAt, acceptedAt, invitedById. Also acceptedById may not exist in schema — risky. To minimize schema assumptions, I'll avoid writing fields that may not exist. Hmm, but acceptedAt is mentioned in the "CURRENT CODE" (accepted state), so it exists. I'll only write acceptedAt and avoid acceptedById. Safer.

Also role on invitation — exists (ROLE_VALUES). Use 
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.