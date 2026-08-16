export function displayName(user) {
  if (!user) return "";
  const first = user.user_metadata?.first_name?.trim();
  const last = user.user_metadata?.last_name?.trim();
  const full = [first, last].filter(Boolean).join(" ");
  return full || user.email;
}

export function initials(user) {
  if (!user) return "?";
  const first = user.user_metadata?.first_name?.trim();
  const last = user.user_metadata?.last_name?.trim();
  if (first || last) {
    return `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase() || "?";
  }
  return (user.email?.[0] || "?").toUpperCase();
}

export function avatarUrl(user) {
  return user?.user_metadata?.avatar_url || null;
}
