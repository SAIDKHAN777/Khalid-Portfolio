import { Resend } from 'resend';
import prisma from '@/lib/db';
import { logger } from '@/lib/logger';
import { captureServerError } from '@/lib/sentry';
import type { ContactNotificationJobData } from '../queue';

export async function processContactNotification(data: ContactNotificationJobData): Promise<void> {
  const { messageId, name, email, subject, message, createdAt } = data;
  logger.info({ messageId, email }, 'Processing background contact notification job');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@saidkhan.dev';
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  let emailSent = false;
  let telegramSent = false;

  // 1. Send Email Notification via Resend
  if (resendApiKey && resendApiKey !== 're_dev_placeholder') {
    try {
      const resend = new Resend(resendApiKey);
      const emailResult = await resend.emails.send({
        from: `Portfolio Contact <${fromEmail}>`,
        to: [adminEmail],
        replyTo: email,
        subject: `[Portfolio Inquiry] ${subject} - from ${name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h2 style="color: #111827; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">New Contact Form Inquiry</h2>
            <p><strong>From:</strong> ${name} &lt;<a href="mailto:${email}">${email}</a>&gt;</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Received At:</strong> ${createdAt}</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
            <h3 style="color: #374151;">Message:</h3>
            <div style="background-color: #f9fafb; padding: 16px; border-radius: 6px; white-space: pre-wrap; font-size: 14px; color: #1f2937;">${message}</div>
          </div>
        `,
      });

      if (emailResult.error) {
        throw new Error(`Resend API Error: ${emailResult.error.message}`);
      }
      emailSent = true;
      logger.info(
        { messageId, emailId: emailResult.data?.id },
        'Contact email notification sent via Resend'
      );
    } catch (err) {
      captureServerError(err, { messageId, service: 'Resend' });
      logger.error({ err, messageId }, 'Failed to dispatch email notification via Resend');
      // We don't rethrow immediately if we want Telegram alert to attempt dispatching too
    }
  } else {
    logger.info(
      { messageId, recipient: adminEmail },
      '[Dev Mock] Email notification simulated successfully'
    );
    emailSent = true;
  }

  // 2. Send Telegram Alert if configured
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChatId = process.env.TELEGRAM_CHAT_ID;

  if (tgToken && tgChatId) {
    try {
      const text = `📬 *New Portfolio Message*\n\n*From:* ${name} (${email})\n*Subject:* ${subject}\n\n*Message:*\n${message.slice(0, 500)}`;
      const tgRes = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: tgChatId,
          text,
          parse_mode: 'Markdown',
        }),
      });

      if (tgRes.ok) {
        telegramSent = true;
        logger.info({ messageId }, 'Telegram notification alert delivered');
      } else {
        const tgErr = await tgRes.text();
        logger.warn({ tgErr, messageId }, 'Telegram Bot notification returned non-OK response');
      }
    } catch (err) {
      captureServerError(err, { messageId, service: 'Telegram' });
      logger.error({ err, messageId }, 'Failed to send Telegram notification');
    }
  }

  // 3. Update database record status if processed
  if (emailSent || telegramSent) {
    logger.info(
      { messageId, emailSent, telegramSent },
      'Contact notification dispatched successfully'
    );
  }
}
