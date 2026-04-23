import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CategoryProvider } from "@/components/category-context";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  return (
    <AppShell>
      <CategoryProvider>{children}</CategoryProvider>
    </AppShell>
  );
}

