import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { spoonacularSearch } from "@/lib/spoonacular";

function parseIntParam(v: string | null): number | undefined {
  if (v == null || v === "") return undefined;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") ?? "";
  const diet = searchParams.get("diet") ?? "";
  const cuisine = searchParams.get("cuisine") ?? "";
  const type = searchParams.get("type") ?? "";
  const sort = searchParams.get("sort") ?? "popularity";
  const maxReadyTime = parseIntParam(searchParams.get("maxReadyTime"));
  const offset = parseIntParam(searchParams.get("offset")) ?? 0;
  const number = Math.min(
    30,
    Math.max(1, parseIntParam(searchParams.get("number")) ?? 12),
  );

  const intolerancesRaw = searchParams.get("intolerances") ?? "";
  const intolerances = intolerancesRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .sort();

  const queryKey = JSON.stringify({
    q: query,
    diet,
    cuisine,
    type,
    sort,
    m: maxReadyTime ?? "",
    int: intolerances,
    off: offset,
    n: number,
  });

  const now = new Date();
  const cached = await prisma.recipeSearchCache.findUnique({
    where: {
      userId_queryKey: { userId: session.user.id, queryKey },
    },
  });
  if (cached && cached.expiresAt > now) {
    return NextResponse.json(JSON.parse(cached.response));
  }

  try {
    const { results, totalResults } = await spoonacularSearch({
      query: query || undefined,
      diet: diet || undefined,
      cuisine: cuisine || undefined,
      type: type || undefined,
      sort: sort || undefined,
      maxReadyTime,
      intolerances: intolerances.length ? intolerances : undefined,
      number,
      offset,
    });
    const body = { results, totalResults };
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
    await prisma.recipeSearchCache.upsert({
      where: {
        userId_queryKey: { userId: session.user.id, queryKey },
      },
      create: {
        userId: session.user.id,
        queryKey,
        response: JSON.stringify(body),
        expiresAt,
      },
      update: { response: JSON.stringify(body), expiresAt },
    });
    return NextResponse.json(body);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Search failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
