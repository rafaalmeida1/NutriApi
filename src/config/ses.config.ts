import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export function createSMTPTransporter(): Transporter {
  const host = process.env.SMTP_HOST || 'email-smtp.sa-east-1.amazonaws.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || '';
  const password = process.env.SMTP_PASSWORD || '';

  if (!user || !password) {
    console.warn('⚠️  SMTP credentials não configuradas. Emails não serão enviados.');
    // Retornar um transporter mock que não faz nada
    return nodemailer.createTransport({
      jsonTransport: true, // Apenas loga, não envia
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === 'true', // true para 465, false para outras portas
    auth: {
      user,
      pass: password,
    },
    tls: {
      rejectUnauthorized: false, // Para desenvolvimento
    },
  });
}

export const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || 'no-reply@bitrafa.com.br';
export const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || 'Nutri Thata';
