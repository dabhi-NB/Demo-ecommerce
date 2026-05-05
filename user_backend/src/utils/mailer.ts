// import nodemailer from 'nodemailer';

// // Configure this with your SMTP credentials or use environment variables
// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: Number(process.env.SMTP_PORT) || 587,
//   secure: false, // true for 465, false for other ports
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   },
// });

// export async function sendMail({ to, subject, html }: { to: string; subject: string; html: string }) {
//   const info = await transporter.sendMail({
//     from: process.env.SMTP_FROM || process.env.SMTP_USER,
//     to,
//     subject,
//     text: html.replace(/<[^>]*>/g, ''),
//     html,
//   });
//   return info;
// }





//my code
import nodemailer from 'nodemailer';
import { getSetting } from './settingsHelper';
import config from '../config';

export async function sendMail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  // 🔹 DB se lo (primary)
  const host = (await getSetting('mail.mailers.smtp.host')) || config.SMTP_HOST;
  const port =
    parseInt(await getSetting('mail.mailers.smtp.port') || '') || config.SMTP_PORT;
  const user =
    (await getSetting('mail.mailers.smtp.username')) || config.SMTP_USER;
  const pass =
    (await getSetting('mail.mailers.smtp.password')) || config.SMTP_PASS;
  const encryption =
    (await getSetting('mail.mailers.smtp.encryption')) || 'tls';

  if (!host || !port || !user || !pass) {
    throw new Error('SMTP configuration missing (DB / ENV)');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: encryption === 'ssl', // ssl = 465
    auth: {
      user,
      pass,
    },
  });

  return transporter.sendMail({
    from: config.SMTP_FROM || user,
    to,
    subject,
    text: html.replace(/<[^>]*>/g, ''),
    html,
  });
}
