import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

function ensureEnv() {
  const user = (process.env.EMAIL || process.env.EMAIL_USER || '').trim();
  const pass = (process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS || '').trim();
  if (!user || !pass) {
    const missing = [];
    if (!user) missing.push('EMAIL or EMAIL_USER');
    if (!pass) missing.push('EMAIL_PASSWORD or EMAIL_PASS');
    throw new Error(
      `Missing env: ${missing.join(', ')}. For Gmail, use a 16-character App Password (with 2FA enabled).`
    );
  }
  return { user, pass };
}

function createTransporter() {
  const { user, pass } = ensureEnv();
  if ((process.env.NODE_ENV || 'development') === 'development') {
    console.log('[mailer] EMAIL set:', !!user, 'PASSWORD set:', !!pass);
  }
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  });
}

const transporter = createTransporter();

export const sendMail = async ({ to, subject, html }) => {
  const { user } = ensureEnv();
  const mailOptions = {
    from: `Instagram Clone <${user}>`,
    to,
    subject,
    html,
    text: html.replace(/<[^>]+>/g, ' '),
  };
  return transporter.sendMail(mailOptions);
};

export const verifyTransport = async () => {
  try {
    const ok = await transporter.verify();
    console.log('📧 SMTP Ready:', ok);
  } catch (e) {
    console.error('📧 SMTP Verify Failed:', e?.message || e);
  }
};

export default transporter;
