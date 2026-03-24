import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { spoonacularSearch } from "@/lib/spoonacular";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") ?? "vegetarian";
  const diet = searchParams.get("diet") ?? "";
  const maxReadyTime = searchParams.get("maxReadyTime");
  const mrt = maxReadyTime ? parseInt(maxReadyTime, 10) : undefined;

  const queryKey = `q:${query}|d:${diet}|m:${mrt ?? ""}`;
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
    const results = await spoonacularSearch({
      query,
      diet: diet || undefined,
      maxReadyTime: Number.isFinite(mrt) ? mrt : undefined,
      number: 15,
    });
    const body = { results };
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
