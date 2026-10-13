import { auth } from "@/lib/auth";
import {
  generateApiToken,
  getUserApiTokens,
  revokeApiToken,
} from "@/lib/api-tokens";

export async function tokens(request: Request): Promise<Response> {
  const { userId, orgId } = await auth(request);
  if (!userId || !orgId)
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    if (request.method === "GET") {
      const values = await getUserApiTokens(userId, orgId);
      return Response.json({
        tokens: values.map(({ token, ...rest }) => ({
          ...rest,
          tokenPreview: `${token.substring(0, 10)}...${token.substring(token.length - 4)}`,
        })),
      });
    }
    if (request.method === "DELETE") {
      const tokenId = new URL(request.url).searchParams.get("id");
      if (!tokenId || Number.isNaN(parseInt(tokenId, 10)))
        return Response.json(
          { error: "A valid token ID is required" },
          { status: 400 },
        );
      if (!(await revokeApiToken(parseInt(tokenId, 10), userId, orgId)))
        return Response.json({ error: "Token not found" }, { status: 404 });
      return Response.json({
        success: true,
        message: "Token revoked successfully",
      });
    }
    const { name, expiresInDays } = await request.json();
    if (
      !name ||
      typeof name !== "string" ||
      name.trim() === "" ||
      name.trim().length > 100
    )
      return Response.json(
        { error: "Token name is required and must be 100 characters or less" },
        { status: 400 },
      );
    if (expiresInDays !== undefined) {
      const days = Number(expiresInDays);
      if (!Number.isInteger(days) || days < 1 || days > 365)
        return Response.json(
          { error: "expiresInDays must be an integer between 1 and 365" },
          { status: 400 },
        );
    }
    const token = await generateApiToken(
      userId,
      orgId,
      name.trim(),
      expiresInDays,
    );
    return Response.json({
      success: true,
      token,
      message:
        "Token generated successfully. Make sure to copy it now - you won't be able to see it again!",
    });
  } catch {
    const error =
      request.method === "GET"
        ? "Failed to fetch tokens"
        : request.method === "DELETE"
          ? "Failed to revoke token"
          : "Failed to generate token";
    return Response.json({ error }, { status: 500 });
  }
}
