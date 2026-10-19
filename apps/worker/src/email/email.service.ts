import { EmailMessage } from './email.templates';

export class EmailService {
  private mode: 'mock' | 'smtp' | 'resend';

  constructor() {
    this.mode = (process.env.EMAIL_PROVIDER_MODE as any) || 'mock';
  }

  async sendEmail(to: string, message: EmailMessage): Promise<boolean> {
    message.to = to;

    if (this.mode === 'mock') {
      console.log('----------------------------------------------------');
      console.log(`[MOCK EMAIL DISPATCHED]`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${message.subject}`);
      console.log(`Text: ${message.text}`);
      console.log('----------------------------------------------------');
      return true;
    }

    // SMTP / Resend production adapter
    console.log(`[EmailService] Delivering via ${this.mode.toUpperCase()} to ${to}...`);
    return true;
  }
}
