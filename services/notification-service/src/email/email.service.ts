import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

export interface SendEmailOptions {
  to: string;
  subject: string;
  context: {
    title: string;
    firstName: string;
    message: string;
    details?: string;
  };
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private mailer: MailerService) {}

  async send(options: SendEmailOptions): Promise<void> {
    try {
      await this.mailer.sendMail({
        to: options.to,
        subject: options.subject,
        html: this.buildHtml(options.context),
      });
      this.logger.log(`Email envoye a ${options.to} — ${options.subject}`);
    } catch (err) {
      this.logger.error(`Echec envoi email a ${options.to} : ${err.message}`);
    }
  }

  private buildHtml(ctx: SendEmailOptions['context']): string {
    const details = ctx.details
      ? `<div style="background:#f7fafc;border-left:4px solid #1a56db;padding:12px 16px;margin-top:20px;color:#4a5568;font-size:14px;white-space:pre-line">${ctx.details}</div>`
      : '';

    return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif">
  <div style="max-width:600px;margin:40px auto">
    <div style="background:#1a56db;padding:24px 32px;border-radius:8px 8px 0 0">
      <h1 style="color:#fff;margin:0;font-size:20px">NovaCampus — ${ctx.title}</h1>
    </div>
    <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none">
      <p style="color:#1a202c;font-size:16px">Bonjour ${ctx.firstName},</p>
      <p style="color:#2d3748;font-size:15px;line-height:1.6">${ctx.message}</p>
      ${details}
    </div>
    <div style="background:#f4f6f8;padding:16px 32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
      <p style="color:#a0aec0;font-size:12px;margin:0">Ce message a été envoyé automatiquement par NovaCampus. Merci de ne pas y répondre.</p>
    </div>
  </div>
</body>
</html>`;
  }
}
