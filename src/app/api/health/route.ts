import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lightweight deploy check: env presence + one DB round-trip.
 * Open `https://<host>/api/health` after deploy; remove or protect if you do not want it public.
 */
export async function GET() {
  let database: { ok: boolean; error?: string } = { ok: false };
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = { ok: true };
  } catch (e) {
    database = {
      ok: false,
      error:
        e instanceof Error ? e.message.slice(0, 240) : "unknown database error",
    };
  }

  return NextResponse.json({
    authSecret: Boolean(process.env.AUTH_SECRET?.trim()),
    authUrl: process.env.AUTH_URL ?? null,
    googleConfigured: Boolean(
      process.env.AUTH_GOOGLE_ID?.trim() &&
        process.env.AUTH_GOOGLE_SECRET?.trim(),
    ),
    databaseUrlConfigured: Boolean(process.env.DATABASE_URL?.trim()),
    database,
  });
}
