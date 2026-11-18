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

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  const token = process.env.NEXT_REVALIDATE_SECRET;
  if (!token || secret !== token) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  let body = {};
  const contentType = request.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      const text = await request.text();
      if (text.trim().length > 0) {
        body = JSON.parse(text);
      }
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
  }

  const parseResult = revalidateSchema.safeParse(body);
  if (!parseResult.success) {
    const errorMessage = parseResult.error.issues[0]?.message ?? 'Invalid request body format';
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }

  try {
    const { path: targetPath, tags } = parseResult.data;
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
      return NextResponse.json({ error: 'Failed to fetch articles for revalidation' }, { status: 502 });
    }

    const articles = (await result.json()) as Array<{ slug?: string }>;
    const pathsToRevalidate = [
      '/blog',
      ...articles.flatMap((a) => (a.slug ? [`/blog/${a.slug}`] : [])),
    ];

    process.stdout.write(`Revalidating paths: ${pathsToRevalidate.join(', ')}\n`);
    for (const p of pathsToRevalidate) {
      await fetch(`${apiBase}/api/revalidate-internal?path=${encodeURIComponent(p)}`);
    }

    return NextResponse.json({ revalidated: true, paths: pathsToRevalidate, tags });
  } catch (e) {
    process.stderr.write(
      `Revalidate failed: ${e instanceof Error ? (e.stack ?? e.message) : String(e)}\n`
    );
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 });
  }
}
