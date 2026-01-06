import Link from "next/link";

import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/auth/actions";
import { getMessages } from "@/lib/i18n/messages";

type AdminNavItem = {
  label: string;
  href: string;
  icon: (props: { className?: string }) => JSX.Element;
};

type AdminNavProps = {
  lang: string;
  tenantName: string;
  propertyType: string | null;
  publicUrl: string;
  items: AdminNavItem[];
};

export default function AdminNav({
  lang,
  tenantName,
  propertyType,
  publicUrl,
  items,
}: AdminNavProps) {
  const copy = getMessages(lang).admin.nav;

  return (
    <div className="flex h-full flex-col gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
          {copy.administration}
        </p>
        <h2 className="mt-3 text-xl font-semibold text-slate-900">
          {tenantName}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {propertyType || copy.propertyTypeMissing}
        </p>
        <a
          href={publicUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 block break-all text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          {publicUrl}
        </a>
      </div>

      <nav className="flex flex-col gap-2">
        {items.map((item) => {
          const isPlaceholder = item.href === "#";
          const className =
            "flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700";

          if (isPlaceholder) {
            return (
              <span
                key={item.label}
                className={`${className} cursor-not-allowed opacity-60`}
              >
                <item.icon className="h-4 w-4 text-slate-400" />
                {item.label}
              </span>
            );
          }

          return (
            <Link key={item.label} href={item.href} className={className}>
              <item.icon className="h-4 w-4 text-blue-500" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6">
        <form action={logoutAction}>
          <input type="hidden" name="lang" value={lang} />
          <Button type="submit" variant="outline" size="default" className="w-full">
            {copy.logout}
          </Button>
        </form>
      </div>
    </div>
  );
}
