import nodemailer from "nodemailer";

export function mailFrom() {
  const user = process.env.SMTP_USER || "";
  return process.env.SMTP_FROM?.includes("@") ? process.env.SMTP_FROM : `"QueryAI" <${user}>`;
}

export function createMailer() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
}
