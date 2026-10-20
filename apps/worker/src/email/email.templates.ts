export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export class EmailTemplates {
  private static layout(title: string, contentHtml: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .header { background: #0f172a; padding: 20px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; letter-spacing: 0.5px; }
    .body { padding: 24px; line-height: 1.6; }
    .badge { display: inline-block; padding: 4px 10px; font-size: 12px; font-weight: 600; border-radius: 4px; background: #e0f2fe; color: #0369a1; }
    .footer { background: #f1f5f9; padding: 16px; font-size: 12px; text-align: center; color: #64748b; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>AICTE FlowGuard</h1>
    </div>
    <div class="body">
      <h2>${title}</h2>
      ${contentHtml}
    </div>
    <div class="footer">
      AICTE FlowGuard System
    </div>
  </div>
</body>
</html>
`;
  }

  static applicationSubmitted(appNumber: string, instName: string): EmailMessage {
    const title = `Application Submission Acknowledged: ${appNumber}`;
    const html = this.layout(
      title,
      `<p>Dear Registrar / Representative of <strong>${instName}</strong>,</p>
       <p>Your application <strong>${appNumber}</strong> has been successfully received by the AICTE Regional Intake Office.</p>
       <p>The case has been placed in the Technical Scrutiny queue. You can track real-time progress via your portal dashboard.</p>`,
    );
    return {
      to: '',
      subject: `[AICTE FlowGuard] Receipt Confirmation: Application ${appNumber}`,
      html,
      text: `Your application ${appNumber} for ${instName} has been acknowledged.`,
    };
  }

  static deficiencyIssued(appNumber: string, observation: string, correction: string): EmailMessage {
    const title = `Technical Deficiency Notice: ${appNumber}`;
    const html = this.layout(
      title,
      `<p>A technical deficiency has been raised during Technical Scrutiny:</p>
       <div style="background:#fff1f2;border-left:4px solid #f43f5e;padding:12px;margin:16px 0;">
         <p><strong>Observation:</strong> ${observation}</p>
         <p><strong>Required Correction:</strong> ${correction}</p>
       </div>
       <p>Please log in to your Institution Dashboard and upload the certified rectifications before the statutory cutoff.</p>`,
    );
    return {
      to: '',
      subject: `[URGENT] AICTE Deficiency Notice: Application ${appNumber}`,
      html,
      text: `Deficiency raised for ${appNumber}. Observation: ${observation}`,
    };
  }

  static complianceReminder(titleText: string, dueDate: string, daysLeft: number): EmailMessage {
    const title = `Compliance Reminder: ${daysLeft} Days Remaining`;
    const html = this.layout(
      title,
      `<p>This is an automated reminder regarding compliance obligation: <strong>${titleText}</strong>.</p>
       <p>Due Date: <strong>${dueDate}</strong></p>
       <p>Please ensure all verified revenue/statutory certificates are uploaded prior to the deadline to maintain institutional standing.</p>`,
    );
    return {
      to: '',
      subject: `[Reminder] AICTE Compliance Obligation: ${titleText} (${daysLeft} Days Left)`,
      html,
      text: `Reminder: ${titleText} is due on ${dueDate}.`,
    };
  }
}
