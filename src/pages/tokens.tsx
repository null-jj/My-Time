import { usePageLoading } from "@/lib/contexts/page-loading-context";
import { createSignal, createEffect, createMemo } from "solid-js";
import { useOrganizationContext } from "@/lib/contexts/organization-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  KeyRound,
  Plus,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
} from "@/components/icons";
import { OrganizationSwitcher } from "@/components/ui/organization-switcher";
import { formatDate } from "@/lib/time-format";
type TokenEntry = {
  id: number;
  name: string;
  tokenPreview: string;
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
};
export default function TokensPage() {
  const organizationContext = useOrganizationContext(),
    organization = () => organizationContext.currentOrganization,
    orgLoading = () => organizationContext.loading;
  const orgId = createMemo(() => organization()?.id);
  const [tokens, setTokens] = createSignal<TokenEntry[]>([]);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  // Create form
  const [showCreate, setShowCreate] = createSignal(false);
  const [newName, setNewName] = createSignal("");
  const [expiresInDays, setExpiresInDays] = createSignal("90");
  const [revoking, setRevoking] = createSignal(false);
  const [copying, setCopying] = createSignal(false);
  const [creating, setCreating] = createSignal(false);
  // Newly created token (show once)
  const [newToken, setNewToken] = createSignal<string | null>(null);
  const [copied, setCopied] = createSignal(false);
  const fetchTokens = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tokens", { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setTokens(data.tokens);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };
  createEffect(
    () => [orgId()],
    () => {
      if (!orgId()) return;
      fetchTokens();
    },
  );
  const handleCreate = async (e: SubmitEvent) => {
    e.preventDefault();
    if (!newName().trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: newName().trim(),
          expiresInDays: expiresInDays()
            ? parseInt(expiresInDays())
            : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create token");
      }
      const data = await res.json();
      setNewToken(data.token);
      setNewName("");
      setExpiresInDays("90");
      setShowCreate(false);
      await fetchTokens();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  };
  const handleRevoke = async (tokenId: number, tokenName: string) => {
    if (!confirm(`Revoke token "${tokenName}"? This cannot be undone.`)) return;
    setRevoking(true);
    setError(null);
    try {
      const res = await fetch(`/api/tokens?id=${tokenId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to revoke token");
      }
      await fetchTokens();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRevoking(false);
    }
  };
  const handleCopy = async (text: string) => {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } finally {
      setCopying(false);
    }
  };
  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };
  usePageLoading(
    () => orgLoading() || loading() || creating() || revoking() || copying(),
  );
  const view = createMemo(() => {
    if (orgLoading()) {
      return (
        <div class="max-w-4xl mx-auto p-6 space-y-6">
          <div class="flex items-center justify-between">
            <div class="space-y-2">
              <Skeleton class="h-8 w-40" />
              <Skeleton class="h-4 w-72" />
            </div>
            <Skeleton class="h-8 w-32 rounded-md" />
          </div>
          <Card>
            <CardHeader>
              <div class="flex items-center justify-between">
                <Skeleton class="h-6 w-32" />
                <Skeleton class="h-9 w-36 rounded-md" />
              </div>
            </CardHeader>
            <CardContent class="space-y-3">
              {Array.from({ length: 3 }).map(() => (
                <div class="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div class="space-y-1.5 flex-1">
                    <Skeleton class="h-4 w-36" />
                    <Skeleton class="h-3 w-64" />
                  </div>
                  <Skeleton class="h-8 w-8 rounded-md" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      );
    }
    return (
      <div class="max-w-4xl mx-auto p-6 space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-foreground mb-2">API Tokens</h1>
            <p class="text-muted-foreground">
              Manage API tokens for CLI access and integrations.
            </p>
          </div>
          <OrganizationSwitcher variant="compact" />
        </div>

        {error() && (
          <div class="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error()}
          </div>
        )}

        {/* Newly created token banner */}
        {newToken() && (
          <Card class="border-primary/50 bg-primary/5">
            <CardContent class="pt-6">
              <div class="flex items-start gap-3">
                <AlertTriangle class="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-foreground mb-1">
                    Token created successfully
                  </p>
                  <p class="text-sm text-muted-foreground mb-3">
                    Copy this token now — you won&apos;t be able to see it
                    again.
                  </p>
                  <div class="flex items-center gap-2">
                    <code class="flex-1 p-2 bg-muted rounded text-sm font-mono break-all">
                      {newToken()}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const token = newToken();
                        if (token) void handleCopy(token);
                      }}
                      class="shrink-0"
                    >
                      {copied() ? (
                        <Check class="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy class="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div class="mt-3">
                    <p class="text-xs text-muted-foreground mb-1">
                      Use with CLI:
                    </p>
                    <code class="text-xs bg-muted p-1.5 rounded block font-mono">
                      dtr login --token {newToken()}
                    </code>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setNewToken(null)}
                  class="shrink-0"
                >
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create token form */}
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <KeyRound class="h-5 w-5" />
                Your Tokens
              </div>
              {!showCreate() && (
                <Button size="sm" onClick={() => setShowCreate(true)}>
                  <Plus class="h-4 w-4 mr-1" />
                  Generate Token
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {showCreate() && (
              <form
                onSubmit={handleCreate}
                class="mb-6 p-4 bg-muted/50 rounded-lg border border-border space-y-4"
              >
                <div>
                  <label class="text-sm font-medium text-foreground block mb-1">
                    Token Name
                  </label>
                  <Input
                    value={newName()}
                    onInput={(e) => setNewName(e.target.value)}
                    placeholder="e.g. My Laptop CLI"
                    maxlength={100}
                    required
                  />
                </div>
                <div>
                  <label class="text-sm font-medium text-foreground block mb-1">
                    Expires In (days)
                  </label>
                  <Input
                    type="number"
                    value={expiresInDays()}
                    onInput={(e) => setExpiresInDays(e.target.value)}
                    placeholder="90"
                    min={1}
                    max={365}
                  />
                  <p class="text-xs text-muted-foreground mt-1">
                    Leave empty for no expiration. Max 365 days.
                  </p>
                </div>
                <div class="flex gap-2">
                  <Button
                    type="submit"
                    disabled={creating() || !newName().trim()}
                  >
                    {creating() ? "Creating..." : "Create Token"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreate(false);
                      setNewName("");
                      setExpiresInDays("90");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {loading() ? (
              <div class="text-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                <p class="mt-2 text-muted-foreground">Loading tokens...</p>
              </div>
            ) : tokens().length === 0 ? (
              <div class="text-center py-8 text-muted-foreground">
                <KeyRound class="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No API tokens yet.</p>
                <p class="text-sm mt-1">
                  Generate a token to use with the DTR CLI.
                </p>
              </div>
            ) : (
              <div class="space-y-3">
                {tokens().map((token) => (
                  <div class="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2">
                        <span class="font-medium text-foreground">
                          {token.name}
                        </span>
                        {token.expiresAt && isExpired(token.expiresAt) && (
                          <Badge variant="destructive" class="text-xs">
                            Expired
                          </Badge>
                        )}
                        {token.expiresAt && !isExpired(token.expiresAt) && (
                          <Badge variant="outline" class="text-xs">
                            Expires{" "}
                            {formatDate(token.expiresAt, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </Badge>
                        )}
                        {!token.expiresAt && (
                          <Badge variant="secondary" class="text-xs">
                            No expiration
                          </Badge>
                        )}
                      </div>
                      <div class="text-sm text-muted-foreground mt-1">
                        <code class="text-xs font-mono">
                          {token.tokenPreview}
                        </code>
                        <span class="mx-2">·</span>
                        Created{" "}
                        {formatDate(token.createdAt, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        {token.lastUsedAt && (
                          <>
                            <span class="mx-2">·</span>
                            Last used{" "}
                            {formatDate(token.lastUsedAt, {
                              month: "short",
                              day: "numeric",
                            })}
                          </>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevoke(token.id, token.name)}
                      class="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 ml-2"
                    >
                      <Trash2 class="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  });
  return <>{view()}</>;
}
