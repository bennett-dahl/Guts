import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { defaultDietSettingsJson } from "@/lib/default-diet";
import { MobileNav, TabletSideNav } from "@/components/mobile-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session?.user?.id) {
    await prisma.idealDietProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        settings: defaultDietSettingsJson(),
      },
      update: {},
    });
  }

  return (
    <div className="flex min-h-[100dvh] flex-col md:flex-row">
      <TabletSideNav />
      <div className="flex min-h-0 flex-1 flex-col">
        <main className="flex-1 px-4 pb-24 pt-4 md:px-8 md:pb-8">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
