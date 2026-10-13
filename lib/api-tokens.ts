import { db } from "@/lib/db/config";
import { apiTokens } from "@/lib/db/schema";
import { eq, and, isNull, gt, lt, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createHash } from "crypto";
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
export interface ApiToken {
  id: number;
  token: string;
  userId: string;
  orgId: string;
  name: string;
  lastUsedAt: string | null;
  createdAt: string;
  expiresAt: string | null;
}
export interface TokenData {
  userId: string;
  orgId: string;
}
// Generate a new API token
export async function generateApiToken(
  userId: string,
  orgId: string,
  name: string,
  expiresInDays?: number,
): Promise<string> {
  const token = `dtr_${nanoid(32)}`;
  const now = new Date().toISOString();
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;
  await db.insert(apiTokens).values({
    token: hashToken(token),
    userId,
    orgId,
    name,
    createdAt: now,
    expiresAt,
    lastUsedAt: null,
  });
  return token;
}
// Validate API token and return user/org info
export async function validateApiToken(
  token: string,
): Promise<TokenData | null> {
  const now = new Date().toISOString();
  const result = await db
    .select()
    .from(apiTokens)
    .where(
      and(
        eq(apiTokens.token, hashToken(token)),
        or(isNull(apiTokens.expiresAt), gt(apiTokens.expiresAt, now)),
      ),
    )
    .limit(1);
  if (result.length === 0) {
    return null;
  }
  const tokenData = result[0];
  // Update last used timestamp
  await db
    .update(apiTokens)
    .set({ lastUsedAt: now })
    .where(eq(apiTokens.id, tokenData.id));
  return {
    userId: tokenData.userId,
    orgId: tokenData.orgId,
  };
}
// Get all tokens for a user in an organization
export async function getUserApiTokens(
  userId: string,
  orgId: string,
): Promise<ApiToken[]> {
  return db
    .select()
    .from(apiTokens)
    .where(and(eq(apiTokens.userId, userId), eq(apiTokens.orgId, orgId)))
    .orderBy(apiTokens.createdAt);
}
// Revoke (delete) an API token
export async function revokeApiToken(
  tokenId: number,
  userId: string,
  orgId: string,
): Promise<boolean> {
  const result = await db
    .delete(apiTokens)
    .where(
      and(
        eq(apiTokens.id, tokenId),
        eq(apiTokens.userId, userId),
        eq(apiTokens.orgId, orgId),
      ),
    );
  return (
    (
      result as {
        rowsAffected: number;
      }
    ).rowsAffected > 0
  );
}
// Clean up expired tokens
export async function cleanupExpiredTokens(): Promise<void> {
  const now = new Date().toISOString();
  await db.delete(apiTokens).where(and(lt(apiTokens.expiresAt, now)));
}
