import { prisma } from "@/lib/prisma";
import {
  createAccessToken,
  createRefreshToken,
  getRefreshTokenExpiry,
  hashToken,
} from "@/lib/auth/tokens";

export async function rotateRefreshToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const existing = await prisma.refreshToken.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!existing) {
    return null;
  }

  await prisma.refreshToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date() },
  });

  const newRefreshToken = createRefreshToken();
  const newRefreshHash = hashToken(newRefreshToken);
  await prisma.refreshToken.create({
    data: {
      userId: existing.userId,
      tokenHash: newRefreshHash,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  const accessToken = await createAccessToken(existing.userId);

  return {
    userId: existing.userId,
    accessToken,
    refreshToken: newRefreshToken,
  };
}

export async function revokeRefreshToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  await prisma.refreshToken.updateMany({
    where: {
      tokenHash,
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });
}
