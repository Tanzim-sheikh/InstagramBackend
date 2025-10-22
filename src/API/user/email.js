import { sendMail } from "../../helper/common/mailer.js";

export const sendVerificationEmail = async ({ name, email, otp }) => {
  return sendMail({
    to: email,
    subject: 'Verify your email',
    html: `<p>Hello ${name},</p><p>Your verification code is <b>${otp}</b>. It expires in 10 minutes.</p>`
  });
};

export const sendPasswordResetEmail = async ({ name, email, otp }) => {
  return sendMail({
    to: email,
    subject: 'Password reset code',
    html: `<p>Hello ${name},</p><p>Your password reset code is <b>${otp}</b>. It expires in 10 minutes.</p>`
  });
};
