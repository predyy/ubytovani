"use server";

import { z } from "zod";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  createAccessToken,
  createRefreshToken,
  getRefreshTokenExpiry,
  hashToken,
} from "@/lib/auth/tokens";
import {
  clearActiveTenantCookie,
  clearAuthCookies,
  setActiveTenantCookie,
  setAuthCookies,
} from "@/lib/auth/cookies";
import { getRefreshTokenFromCookies } from "@/lib/auth/session";
import { revokeRefreshToken } from "@/lib/auth/refresh";

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  lang: z.string().min(2),
});

export type AuthActionState = {
  error?: string;
};

export async function signupAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = authSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    lang: formData.get("lang"),
  });

  if (!parsed.success) {
    return { error: "Please provide a valid email and password." };
  }

  const { email, password, lang } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email: normalizedEmail, passwordHash },
  });

  const refreshToken = createRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  const accessToken = await createAccessToken(user.id);
  await setAuthCookies(accessToken, refreshToken);
  redirect(`/${lang}/onboarding`);
}

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = authSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    lang: formData.get("lang"),
  });

  if (!parsed.success) {
    return { error: "Please provide a valid email and password." };
  }

  const { email, password, lang } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    return { error: "Invalid email or password." };
  }

  const validPassword = await verifyPassword(user.passwordHash, password);
  if (!validPassword) {
    return { error: "Invalid email or password." };
  }

  const refreshToken = createRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  const accessToken = await createAccessToken(user.id);
  await setAuthCookies(accessToken, refreshToken);

  const membership = await prisma.tenantMember.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: { tenantId: true },
  });

  if (membership?.tenantId) {
    await setActiveTenantCookie(membership.tenantId);
    redirect(`/${lang}/dashboard`);
  }

  redirect(`/${lang}/onboarding`);
}

export async function logoutAction(formData: FormData) {
  const lang = String(formData.get("lang") ?? "en");
  const refreshToken = await getRefreshTokenFromCookies();

  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }

  await clearAuthCookies();
  await clearActiveTenantCookie();
  redirect(`/${lang}/login`);
}
