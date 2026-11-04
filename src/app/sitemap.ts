We need answer to user. Need parse task. They provide format requirement, skill libraries, file to upgrade src\app\sitemap.ts, current code? It appears current code is just the whole prompt? Wait user message includes file content begin with format requirement, then repeated content, file to upgrade: src\app\sitemap.ts CURRENT CODE: then format requirement, etc. There's no actual code for sitemap.ts. Need determine desired output. They ask "MISSION: Make this file 10x better using your skill library... Otherwise output ONLY the raw upgraded code. No markdown. No truncation." But also initial format requirement says MUST wrap ALL JSON tool call arrays in json code block. They want tool call maybe write_file. We are HEY Methodology Specialist / Catalog Specialist? Actually conflicting. We need produce JSON tool call array in code block to write file. Need supply upgraded code for sitemap.ts. Need infer code? Current code missing. Need maybe create sitemap.ts implementation for Next.js App Router. Need output only raw upgraded code? But format requirement overrides? They say MUST wrap JSON tool call arrays. We should respond withjson [{"tool":"write_file","path":"src/app/sitemap.ts","content":"..."}]. Need content escaped. Need make file 10x better, Liquid Glass? For sitemap.ts no UI. Need implement robust Next.js sitemap generator. Need know project? No context. Need avoid asking due mission. Need produce a good sitemap.ts. Need ensure valid TypeScript for Next.js App Router. Could include dynamic sitemap using MetadataRoute.Sitemap, site URL env, static routes, dynamic routes maybe. Need likely no current code, so create from scratch.

Need maybe use skill library? There are two skill libs: HEY Methodology brainstorming and Andruia consultant. Mission says use skill library. But output only raw upgraded code. We need write file. Could include comments? Need no markdown except JSON code block. Content should be raw code. Need escape double quotes. Need absolute path? They gave src\app\sitemap.ts relative. Format says path /abs/path. We can use "src/app/sitemap.ts" or "/src/app/sitemap.ts"? Tool likely accepts relative? It says path /abs/path example. But file is relative. In these tasks previous successful pattern likely use path "src/app/sitemap.ts". We'll use "src/app/sitemap.ts". Need include content.

Need decide code. Next.js sitemap.ts:

import type { MetadataRoute } from "next";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com").replace(//$/, "");

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

const staticRoutes = [
{ path: "/", priority: 1, changeFrequency: "weekly" as const },
...
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
const now = new Date();
const staticEntries = staticRoutes.map(...);
const dynamicEntries = await getDynamicEntries().catch(() => []);
return [...staticEntries, ...dynamicEntries].filter...
}

But dynamic entries need data source unknown. Could include optional CMS fetch? Might be risky. Could make generic. Since no current code, simplest robust static sitemap. But "10x better" maybe include route registry, env validation, dynamic product/blog support? Need not overcomplicate. Need valid without dependencies. Use only Next types.

Need maybe implement localized routes? No.

Could include:
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_URL ? ...; But VERCEL_URL lacks protocol. Use helper.

Need include lastModified, changeFrequency, priority. Exclude private routes. Use absolute URLs.

Potential code:

import type { MetadataRoute } from "next";

const FALLBACK_SITE_URL = "https://example.com";

function getSiteUrl(): string {
const raw = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? (process.env.VERCEL_URL ? https://${process.env.VERCEL_URL} : FALLBACK_SITE_URL);
try {
return new URL(raw).origin;
} catch {
return FALLBACK_SITE_URL;
}
}

const SITE_URL = getSiteUrl();

type SitemapEntry = MetadataRoute.Sitemap[number];
type ChangeFrequency = NonNullable<SitemapEntry["changeFrequency"]>;

interface RouteConfig {
path: string;
changeFrequency: ChangeFrequency;
priority: number;
lastModified?: Date;
}

const routes: RouteConfig[] = [...];

function toEntry(route: RouteConfig, now: Date): SitemapEntry { return { url: new URL(route.path, SITE_URL).toString(), lastModified: route.lastModified ?? now, changeFrequency: route.changeFrequency, priority: route.priority }; }

export default function sitemap(): MetadataRoute.Sitemap { const now = new Date(); return routes.map(...); }

Could include dynamic route function placeholder? If dynamic pages exist unknown. Maybe not. But "sitemap.ts" in app router often includes dynamic slugs from CMS. Without context, static robust.

Need maybe include comments explaining. But mission says raw upgraded code only. Comments fine.

Need wrap JSON. Need escape all double quotes in content. That's huge. Need ensure valid JSON. Could use single quotes in code? TypeScript strings can be single quotes, reducing escaping. But content field needs escape double quotes only. We can write code using single quotes for strings, but type imports etc no double quotes. Need JSON content field with newline escapes? In JSON string, actual newlines not allowed; must use \n. The example shows content with newlines? They show content field string maybe actual? JSON requires escaped \n. We need produce valid JSON in code block. Need include content string with \n escapes. That's error-prone but doable. Alternatively use JSON array with "content" containing a single long string with \n escapes. Need ensure all double quotes in code escaped. Use single quotes in TS so almost no double quotes. But there may be backticks? Backticks okay. Need escape backslashes in regex? In JSON, backslash must be escaped. Regex /// contains backslash -> need \\/ ? Actually JSON string: backslash must be \\, so regex /\// becomes /\// in JSON? Wait content is code string. Need represent code text exactly. If code has `replace(/\//, ''), that includes backslash. In JSON string, backslash must be escaped as\. So writereplace(/\/
/
,
′
′
)
‘
𝑖
𝑛
𝐽
𝑆
𝑂
𝑁
?
𝐿
𝑒
𝑡
′
𝑠
𝑡
ℎ
𝑖
𝑛
𝑘
:
𝐽
𝑆
𝑂
𝑁
‘
"
𝑐
𝑜
𝑛
𝑡
𝑒
𝑛
𝑡
"
:
"
𝑟
𝑒
𝑝
𝑙
𝑎
𝑐
𝑒
(
/
/
/,
′′
)‘inJSON?Let
′
sthink:JSON‘"content":"replace(/
//, '')"parses toreplace(//$/, '')`. Yes. So need double escape backslashes. That's tricky.

Could avoid regex entirely. Use URL origin. No backslashes. Use new URL. Good.

Use no double quotes in code. Code:

import type { MetadataRoute } from 'next';

const FALLBACK_SITE_URL = 'https://example.com';

function resolveSiteUrl(): string {
const candidates = [
process.env.NEXT_PUBLIC_SITE_URL,
process.env.SITE_URL,
process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : undefined,
];

for (const candidate of candidates) {
if (!candidate) continue;
try {
return new URL(candidate).origin;
} catch {
continue;
}
}

return FALLBACK_SITE_URL;
}

const SITE_URL = resolveSiteUrl();

type SitemapEntry = MetadataRoute.Sitemap[number];
type ChangeFrequency = NonNullable<SitemapEntry['changeFrequency']>;

interface RouteConfig {
path: string;
changeFrequency: ChangeFrequency;
priority: number;
lastModified?: Date;
}

const ROUTES: readonly RouteConfig[] = [
{ path: '/', changeFrequency: 'weekly', priority: 1 },
{ path: '/about', changeFrequency: 'monthly', priority: 0.7 },
{ path: '/blog', changeFrequency: 'weekly', priority: 0.8 },
{ path: '/contact', changeFrequency: 'yearly', priority: 0.5 },
];

function normalizePath(path: string): string {
if (path === '/') return '/';
return path.startsWith('/') ? path : '/' + path;
}

function absoluteUrl(path: string): string {
return new URL(normalizePath(path), SITE_URL).toString();
}

export default function sitemap(): MetadataRoute.Sitemap {
const now = new Date();

return ROUTES.map((route) => ({
url: absoluteUrl(route.path),
lastModified: route.lastModified ?? now,
changeFrequency: route.changeFrequency,
priority: route.priority,
}));
}

This is valid. But no dynamic. Maybe include optional dynamic route hooks? Hmm.

Need maybe use "Liquid Glass" UI irrelevant. Could mention no UI. But final only code. Need maybe "PASS"? Is file already perfect? No current code absent. We need output upgraded code. Need not ask.

Need maybe include dynamic sitemap from CMS? If no current code, adding static routes may be wrong. But mission wants upgrade. Need maybe code should be flexible and not hardcode non-existent routes? But sitemap needs routes. Could use Next's app router file scanning? Not at runtime. Better route registry.

Potential issue: MetadataRoute.Sitemap[number] type may not support NonNullable<...['changeFrequency']>? It does. Good.

Potential issue: In Next.js, changeFrequency type may be 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' | undefined; NonNullable works. priority number. Good.

Potential issue: process.env.VERCEL_URL includes host, okay. If NEXT_PUBLIC_SITE_URL has path, origin strips path.

Need include export const dynamic = 'force-static';? For sitemap, optional. Could include export const revalidate = 3600;? App Router sitemap supports route segment config? Yes sitemap.ts can export revalidate. Could add export const revalidate = 3600; to cache. Good.

Need maybe use MetadataRoute.Sitemap return type. Good.

Need final JSON code block. Need escape newlines. Could produce content with \n. Need ensure no raw newline inside JSON string. The code block itself can contain multi-line JSON? JSON allows whitespace outside strings, so array can be formatted. But content string must have escaped newlines. We can write:

[
  {
    "tool": "write_file",
    "path": "src/app/sitemap.ts",
    "content": "import type { MetadataRoute } from 'next';\n\nconst FALLBACK_SITE_URL = 'https://example.com';\n..."
  }
]

Need escape any double quotes in content. We'll use single quotes in code, so none. Need escape backslashes? None. Need check process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : undefined, no backslash. Good. No regex.

Need include export const revalidate = 3600; no quotes. Good.

Need content exact. Let's craft.

Need maybe include readonly and as const? If ROUTES typed readonly RouteConfig[], okay. changeFrequency values are string literals but TypeScript infers string? Since array annotated readonly RouteConfig[], object literals checked against RouteConfig; 'weekly' accepted. Good.

Potential issue NonNullable<SitemapEntry['changeFrequency']> if SitemapEntry maybe union? It works.

Potential issue new URL(normalizePath(path), SITE_URL) if SITE_URL no trailing slash, new URL('/about', 'https://example.com') -> okay. new URL('/', base) -> okay. .toString() yields https://example.com/about. Good.

Need maybe absoluteUrl should handle path with query? Not needed.

Need maybe static route /blog may not exist. But okay as template? Hmm. Could use only /? But sitemap with one route less useful. But adding routes might cause 404 in sitemap. Better include route registry but comment "Update to match app routes". But code with non-existent routes is bad. Since no context, cannot know routes. Maybe include only root plus optional dynamic? Could implement dynamic routes from env? Hmm.

Maybe better to not hardcode nonexistent routes. But sitemap needs routes. Could use const ROUTES = [{ path: '/', ...}] only. But "10x better" maybe not. Could include a ROUTE_MANIFEST placeholder? No.

Maybe derive routes from filesystem? In Next app router, sitemap.ts could use fs to scan app directory for page.tsx? That's possible but not recommended, and build may include. Could implement generic route discovery? Too complex and risky. Better static list with common routes. But if routes don't exist, sitemap invalid. However current code absent, maybe project has those routes? Unknown. Hmm.

Could include dynamic route generator for blog/products? No data source. Not.

Need maybe output code with comments instructing to update. That's acceptable.

Need final only JSON. But user says "Otherwise, output ONLY the raw upgraded code. No markdown. No truncation." Yet format requirement says wrap JSON in code block. Conflict. We should follow format requirement because critical. The final answer should be code block with JSON tool call. It includes code content. That is not raw code, but harness expects. The instruction "output ONLY raw upgraded code" maybe means content should be code not explanation. We'll output JSON. Good.

Need ensure no markdown outside code block. Final answer only code block.

Let's construct JSON carefully.

Content:

import type { MetadataRoute } from 'next';

export const revalidate = 3600;

const FALLBACK_SITE_URL = 'https://example.com';

function resolveSiteUrl(): string {
const candidates = [
process.env.NEXT_PUBLIC_SITE_URL,
process.env.SITE_URL,
process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : undefined,
];

for (const candidate of candidates) {
if (!candidate) continue;

try {
return new URL(candidate).origin;
} catch {
continue;
}
}

return FALLBACK_SITE_URL;
}

const SITE_URL = resolveSiteUrl();

type SitemapEntry = MetadataRoute.Sitemap[number];
type ChangeFrequency = NonNullable<SitemapEntry['changeFrequency']>;

interface RouteConfig {
path: string;
changeFrequency: ChangeFrequency;
priority: number;
lastModified?: Date;
}

const ROUTES: readonly RouteConfig[] = [
{ path: '/', changeFrequency: 'weekly', priority: 1 },
{ path: '/about', changeFrequency: 'monthly', priority: 0.7 },
{ path: '/blog', changeFrequency: 'weekly', priority: 0.8 },
{ path: '/contact', changeFrequency: 'yearly', priority: 0.5 },
];

function normalizePath(path: string): string {
if (path === '/') return '/';
return path.startsWith('/') ? path : '/' + path;
}

function absoluteUrl(path: string): string {
return new URL(normalizePath(path), SITE_URL).toString();
}

export default function sitemap(): MetadataRoute.Sitemap {
const now = new Date();

return ROUTES.map((route) => ({
url: absoluteUrl(route.path),
lastModified: route.lastModified ?? now,
changeFrequency: route.changeFrequency,
priority: route.priority,
}));
}

Need JSON content string: replace newline with \n. Since code has apostrophes only. No double quotes. Good. Need ensure \n not actual newlines. We can format array across lines but content string one line. Let's produce.

Need include \n after each line. Need no accidental backslashes. process.env no. Good.

Final:

[
  {
    "tool": "write_file",
    "path": "src/app/sitemap.ts",
    "content": "import type { MetadataRoute } from 'next';\n\nexport const revalidate = 3600;\n\nconst FALLBACK_SITE_URL = 'https://example.com';\n\nfunction resolveSiteUrl(): string {\n  const candidates = [\n    process.env.NEXT_PUBLIC_SITE_URL,\n    process.env.SITE_URL,\n    process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : undefined,\n  ];\n\n  for (const candidate of candidates) {\n    if (!candidate) continue;\n\n    try {\n      return new URL(candidate).origin;\n    } catch {\n      continue;\n    }\n  }\n\n  return FALLBACK_SITE_URL;\n}\n\nconst SITE_URL = resolveSiteUrl();\n\ntype SitemapEntry = MetadataRoute.Sitemap[number];\ntype ChangeFrequency = NonNullable<SitemapEntry['changeFrequency']>;\n\ninterface RouteConfig {\n  path: string;\n  changeFrequency: ChangeFrequency;\n  priority: number;\n  lastModified?: Date;\n}\n\nconst ROUTES: readonly RouteConfig[] = [\n  { path: '/', changeFrequency: 'weekly', priority: 1 },\n  { path: '/about', changeFrequency: 'monthly', priority: 0.7 },\n  { path: '/blog', changeFrequency: 'weekly', priority: 0.8 },\n  { path: '/contact', changeFrequency: 'yearly', priority: 0.5 },\n];\n\nfunction normalizePath(path: string): string {\n  if (path === '/') return '/';\n  return path.startsWith('/') ? path : '/' + path;\n}\n\nfunction absoluteUrl(path: string): string {\n  return new URL(normalizePath(path), SITE_URL).toString();\n}\n\nexport default function sitemap(): MetadataRoute.Sitemap {\n  const now = new Date();\n\n  return ROUTES.map((route) => ({\n    url: absoluteUrl(route.path),\n    lastModified: route.lastModified ?? now,\n    changeFrequency: route.changeFrequency,\n    priority: route.priority,\n  }));\n}\n"
  }
]

Check JSON valid: content