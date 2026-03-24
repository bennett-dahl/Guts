import { auth } from "@/auth";

const publicPaths = new Set([
  "/",
  "/login",
  "/api/auth",
]);

function isPublic(pathname: string) {
  if (publicPaths.has(pathname)) return true;
  if (pathname.startsWith("/api/auth")) return true;
  if (pathname === "/manifest.json") return true;
  if (pathname.startsWith("/icon")) return true;
  return false;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) return;
  if (!req.auth) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return Response.redirect(url);
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
