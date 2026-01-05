import { redirect } from "next/navigation";

import AuthForm from "@/components/admin/AuthForm";
import { signupAction } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

type SignupPageProps = {
  params: Promise<{
    lang: string;
  }>;
};

export default async function SignupPage({ params }: SignupPageProps) {
  const { lang } = await params;
  const user = await getCurrentUser();

  if (user) {
    const membership = await prisma.tenantMember.findFirst({
      where: { userId: user.id },
      select: { tenantId: true },
    });
    redirect(membership ? `/${lang}/dashboard` : `/${lang}/onboarding`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-white">
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white/90 p-8 shadow-xl backdrop-blur">
          <div className="mb-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
              SH
            </div>
            <h1 className="mt-4 text-2xl font-semibold text-slate-900">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Start building your booking site in minutes.
            </p>
          </div>
          <AuthForm mode="signup" lang={lang} action={signupAction} />
        </div>
      </div>
    </main>
  );
}
