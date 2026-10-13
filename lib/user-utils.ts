import type { User } from "@clerk/backend";
export function getUserDisplayName(user: User | null | undefined): string {
  if (!user) return "User";
  return (
    user.fullName ||
    user.firstName ||
    user.primaryEmailAddress?.emailAddress ||
    "User"
  );
}
export function getUserEmail(user: User | null | undefined): string {
  if (!user) return "";
  return user.primaryEmailAddress?.emailAddress || "";
}
export function getUserInitials(user: User | null | undefined): string {
  if (!user) return "U";
  if (user.fullName) {
    return user.fullName
      .split(" ")
      .map((name) => name.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  if (user.firstName) {
    return user.firstName.charAt(0).toUpperCase();
  }
  if (user.primaryEmailAddress?.emailAddress) {
    return user.primaryEmailAddress.emailAddress.charAt(0).toUpperCase();
  }
  return "U";
}
export function getUserImageUrl(user: User | null | undefined): string {
  return user?.imageUrl || "";
}
// For client-side user object (from useUser hook)
export type ClientUser = {
  id: string;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string;
  primaryEmailAddress?: {
    emailAddress: string;
  } | null;
};
export function getClientUserDisplayName(
  user: ClientUser | null | undefined,
): string {
  if (!user) return "User";
  return (
    user.fullName ||
    user.firstName ||
    user.primaryEmailAddress?.emailAddress ||
    "User"
  );
}
export function getClientUserEmail(
  user: ClientUser | null | undefined,
): string {
  if (!user) return "";
  return user.primaryEmailAddress?.emailAddress || "";
}
export function getClientUserInitials(
  user: ClientUser | null | undefined,
): string {
  if (!user) return "U";
  if (user.fullName) {
    return user.fullName
      .split(" ")
      .map((name) => name.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  if (user.firstName) {
    return user.firstName.charAt(0).toUpperCase();
  }
  if (user.primaryEmailAddress?.emailAddress) {
    return user.primaryEmailAddress.emailAddress.charAt(0).toUpperCase();
  }
  return "U";
}
