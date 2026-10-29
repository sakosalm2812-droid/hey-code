import { prisma } from '@/lib/prisma';

export type MemoryType = 'FACT' | 'PREFERENCE' | 'RELATIONSHIP' | 'PROJECT' | 'NOTE';

export interface CreateMemoryInput {
  userId: string;
  type?: MemoryType;
  content: string;
  category?: string;
  importance?: number;
  sourceChatId?: string;
  edges?: Array<{ toId: string; relation: string; weight?: number }>;
}

export async function createMemory({
  userId,
  type = 'FACT',
  content,
  category,
  importance = 1,
  sourceChatId,
  edges = [],
}: CreateMemoryInput) {
  const memory = await prisma.memory.create({
    data: {
      userId,
      type,
      content,
      category,
      importance,
      sourceChatId,
      edges: edges.length
        ? {
            create: edges.map(e => ({
              userId,
              toId: e.toId,
              relation: e.relation,
              weight: e.weight ?? 1,
            })),
          }
        : undefined,
    },
    include: { edges: true, inEdges: true },
  });

  return memory;
}

export async function getMemories(userId: string, opts: { type?: MemoryType; category?: string; limit?: number } = {}) {
  return prisma.memory.findMany({
    where: {
      userId,
      ...(opts.type ? { type: opts.type } : {}),
      ...(opts.category ? { category: opts.category } : {}),
    },
    orderBy: [{ importance: 'desc' }, { updatedAt: 'desc' }],
    take: opts.limit ?? 50,
    include: { edges: true, inEdges: true },
  });
}

export async function searchMemories(userId: string, query: string, limit = 10) {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter(t => t.length > 2);

  const memories = await prisma.memory.findMany({ where: { userId }, take: 100 });

  const scored = memories
    .map(memory => {
      const haystack = `${memory.content} ${memory.category ?? ''}`.toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (haystack.includes(term)) score += term.length;
      }
      return { memory, score };
    })
    .filter(r => r.score > 0);

  return scored
    .sort((a, b) => b.score * b.memory.importance - a.score * a.memory.importance)
    .slice(0, limit)
    .map(r => r.memory);
}

export async function updateMemoryImportance(userId: string, memoryId: string, importance: number) {
  return prisma.memory.update({
    where: { id: memoryId },
    data: { importance },
  }).catch(() => null);
}

export async function deleteMemory(userId: string, memoryId: string) {
  return prisma.memory.deleteMany({ where: { id: memoryId, userId } });
}

export async function linkMemories(userId: string, fromId: string, toId: string, relation: string, weight = 1) {
  return prisma.memoryEdge.upsert({
    where: { fromId_toId_relation: { fromId, toId, relation } },
    create: { userId, fromId, toId, relation, weight },
    update: { weight },
  });
}

export function formatMemoriesForPrompt(memories: Array<{ type: string; content: string; category?: string | null }>, maxChars = 1200) {
  let out = '';
  for (const memory of memories) {
    const line = `[${memory.category || memory.type}] ${memory.content}`;
    if (out.length + line.length + 2 > maxChars) break;
    out += `${line}\n`;
  }
  return out.trim();
}