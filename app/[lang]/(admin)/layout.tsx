import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

type AdminLayoutProps = {
  children: ReactNode;
  params: Promise<{
    lang: string;
  }>;
};

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const { lang } = await params;
  const headerList = await headers();
  const mode = headerList.get("x-tenant-mode") ?? "marketing";

  if (mode !== "admin") {
    redirect(`/${lang}`);
  }

  return children;
}
