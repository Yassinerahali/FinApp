// Convenience only: decides whether to SHOW the Admin tab. The real
// protection is in the database — admin_list_users() (see
// supabase/migration-009-admin-users.sql) rejects anyone but the admin.
export const ADMIN_EMAIL = "admin@choumchoum.com";

export function isAdmin(user) {
  return user?.email?.toLowerCase() === ADMIN_EMAIL;
}
