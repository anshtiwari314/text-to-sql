export function adminEmailId() {
  return (process.env.ADMIN_EMAIL_ID || "").trim().toLowerCase();
}

export function isAdminEmail(email?: string | null) {
  const admin = adminEmailId();
  if (!admin || !email) return false;
  return email.trim().toLowerCase() === admin;
}
