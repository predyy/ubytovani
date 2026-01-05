"use client";

import { useFormState, useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import type { OnboardingActionState } from "@/lib/tenancy/actions";

type OnboardingPropertyFormProps = {
  lang: string;
  tenantId: string;
  action: (
    prevState: OnboardingActionState,
    formData: FormData,
  ) => Promise<OnboardingActionState>;
};

const initialState: OnboardingActionState = {};

export default function OnboardingPropertyForm({
  lang,
  tenantId,
  action,
}: OnboardingPropertyFormProps) {
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="tenantId" value={tenantId} />
      <div className="space-y-2">
        <label
          className="text-sm font-medium text-slate-700"
          htmlFor="propertyType"
        >
          Property type
        </label>
        <input
          id="propertyType"
          name="propertyType"
          required
          placeholder="Apartment, villa, cabin..."
          className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="roomCount"
          >
            Room count
          </label>
          <input
            id="roomCount"
            name="roomCount"
            type="number"
            min={1}
            required
            className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="maxGuests"
          >
            Max guests (optional)
          </label>
          <input
            id="maxGuests"
            name="maxGuests"
            type="number"
            min={1}
            className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>
      {state.error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}
      <SubmitButton label="Save property" />
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
