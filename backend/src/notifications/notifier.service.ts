import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotifierService {
  private readonly logger = new Logger(NotifierService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (host && port) {
      this.transporter = nodemailer.createTransport({ host, port, secure: false, auth: user && pass ? { user, pass } : undefined });
      this.logger.log('SMTP notifier configured');
    } else {
      this.logger.warn('SMTP not configured — emails will be logged only');
    }
  }

  async sendEmail(to: string, subject: string, html: string, text?: string) {
    if (!this.transporter) {
      this.logger.log(`Email (mock) to ${to}: ${subject}\n${text || html}`);
      return;
    }
    try {
      await this.transporter.sendMail({ from: process.env.SMTP_FROM || 'no-reply@local', to, subject, text, html });
      this.logger.log(`Email sent to ${to}`);
    } catch (e) {
      this.logger.error('Failed to send email', e as any);
    }
  }
}
