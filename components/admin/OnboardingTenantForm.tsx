"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import type { OnboardingActionState } from "@/lib/tenancy/actions";
import { slugify } from "@/lib/tenancy/slug";

type OnboardingTenantFormProps = {
  lang: string;
  defaultLocale: string;
  supportedLocales: string[];
  action: (
    prevState: OnboardingActionState,
    formData: FormData,
  ) => Promise<OnboardingActionState>;
};

const initialState: OnboardingActionState = {};

export default function OnboardingTenantForm({
  lang,
  defaultLocale,
  supportedLocales,
  action,
}: OnboardingTenantFormProps) {
  const [state, formAction] = useFormState(action, initialState);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugify(name));
    }
  }, [name, slugTouched]);

  const localeOptions = useMemo(
    () =>
      supportedLocales.length ? supportedLocales : [defaultLocale || "en"],
    [defaultLocale, supportedLocales],
  );

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="lang" value={lang} />
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="name">
          Tenant name
        </label>
        <input
          id="name"
          name="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="E.g. Seaside Villas"
          className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="slug">
          Subdomain slug
        </label>
        <input
          id="slug"
          name="slug"
          required
          value={slug}
          onChange={(event) => {
            setSlugTouched(true);
            setSlug(slugify(event.target.value));
          }}
          placeholder="seaside-villas"
          className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
        <p className="text-xs text-slate-500">
          This becomes your public URL subdomain.
        </p>
      </div>
      <div className="space-y-2">
        <label
          className="text-sm font-medium text-slate-700"
          htmlFor="defaultLocale"
        >
          Default language
        </label>
        <select
          id="defaultLocale"
          name="defaultLocale"
          defaultValue={defaultLocale || "en"}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        >
          {localeOptions.map((locale) => (
            <option key={locale} value={locale}>
              {locale.toUpperCase()}
            </option>
          ))}
        </select>
      </div>
      {state.error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}
      <SubmitButton label="Create tenant" />
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      className="w-full"
      disabled={pending}
    >
      {pending ? "Saving..." : label}
    </Button>
  );
}
