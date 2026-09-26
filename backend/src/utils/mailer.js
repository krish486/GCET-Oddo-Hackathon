const nodemailer = require('nodemailer');

const isTest = process.env.NODE_ENV === 'test';

const transporter = isTest
  ? nodemailer.createTransport({
      jsonTransport: true,
    })
  : nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

async function verifyMailer() {
  if (isTest) return;

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP_USER and SMTP_PASS must be configured.');
  }

  await transporter.verify();
  console.log('Email service is ready.');
}

async function sendPasswordResetOtp({ to, otp }) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  return transporter.sendMail({
    from,
    to,
    subject: 'StockSense Password Reset Verification Code',
    text: `Your StockSense verification code is ${otp}. It expires in 10 minutes.`,
  });
}

module.exports = {
  transporter,
  verifyMailer,
  sendPasswordResetOtp,
};