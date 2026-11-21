import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// On-demand revalidation endpoint для блогу та контенту.
// Викликається після публікації/зняття статті або оновлення контенту.
// Потрібен секретний токен для безпеки.

export const dynamic = 'force-dynamic';

const revalidateSchema = z.object({
  path: z.string({}).optional(),
  tags: z.array(z.string({})).optional(),
});

type RevalidationRequest = z.infer<typeof revalidateSchema>;

function hasValidSecret(request: NextRequest): boolean {
  const secret = request.nextUrl.searchParams.get('secret');
  const token = process.env.NEXT_REVALIDATE_SECRET;
  return Boolean(token && secret === token);
}

async function readRevalidationRequest(
  request: NextRequest
): Promise<{ data: RevalidationRequest } | { response: NextResponse }> {
  const contentType = request.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return { data: revalidateSchema.parse({}) };
  }

  try {
    const text = await request.text();
    const body: unknown = text.trim().length > 0 ? JSON.parse(text) : {};
    const result = revalidateSchema.safeParse(body);
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? 'Invalid request body format';
      return { response: NextResponse.json({ error: message }, { status: 400 }) };
    }
    return { data: result.data };
  } catch {
    return { response: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) };
  }
}

function collectArticlePaths(articles: Array<{ slug?: string }>): string[] {
  return ['/blog', ...articles.flatMap((a) => (a.slug ? [`/blog/${a.slug}`] : []))];
}

async function revalidatePaths(paths: string[], apiBase: string): Promise<void> {
  process.stdout.write(`Revalidating paths: ${paths.join(', ')}\n`);
  for (const p of paths) {
    await fetch(`${apiBase}/api/revalidate-internal?path=${encodeURIComponent(p)}`);
  }
}

export async function POST(request: NextRequest) {
  if (!hasValidSecret(request)) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  const parsed = await readRevalidationRequest(request);
  if ('response' in parsed) return parsed.response;

  try {
    const { path: targetPath, tags } = parsed.data;
    const apiBase = process.env.WEB_API_URL ?? 'http://localhost:13000';

    if (targetPath) {
      process.stdout.write(`Revalidating specific path: ${targetPath}\n`);
      await fetch(`${apiBase}/api/revalidate-internal?path=${encodeURIComponent(targetPath)}`);
      return NextResponse.json({ revalidated: true, paths: [targetPath], tags });
    }

    // Перегенеруємо шлях і всі пов'язані сторінки (свіжі дані — без кешу).
    const result = await fetch(`${apiBase}/content/articles?limit=50`, {
      cache: 'no-store',
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch articles for revalidation' },
        { status: 502 }
      );
    }

    const articles = (await result.json()) as Array<{ slug?: string }>;
    const pathsToRevalidate = collectArticlePaths(articles);
    await revalidatePaths(pathsToRevalidate, apiBase);

    return NextResponse.json({ revalidated: true, paths: pathsToRevalidate, tags });
  } catch (e) {
    process.stderr.write(
      `Revalidate failed: ${e instanceof Error ? (e.stack ?? e.message) : String(e)}\n`
    );
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 });
  }
}
