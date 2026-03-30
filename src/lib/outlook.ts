import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp-mail.outlook.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.OUTLOOK_EMAIL,
    pass: process.env.OUTLOOK_PASSWORD,
  },
});

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  isHtml?: boolean;
  trackingPixelUrl?: string;
}

export async function sendEmail(payload: EmailPayload) {
  const fromEmail = process.env.OUTLOOK_EMAIL;
  if (!fromEmail || !process.env.OUTLOOK_PASSWORD) {
    throw new Error("Outlook email credentials not configured. Set OUTLOOK_EMAIL and OUTLOOK_PASSWORD in .env");
  }

  let htmlBody = payload.body;
  if (payload.trackingPixelUrl) {
    htmlBody += `<img src="${payload.trackingPixelUrl}" width="1" height="1" style="display:none" />`;
  }

  const result = await transporter.sendMail({
    from: fromEmail,
    to: payload.to,
    subject: payload.subject,
    ...(payload.isHtml === false
      ? { text: payload.body }
      : { html: htmlBody }),
  });

  return result;
}

export async function verifyConnection() {
  return transporter.verify();
}
