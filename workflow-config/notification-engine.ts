/**
 * AICTE FlowGuard - Notification Template Compiler and Dispatch Helper
 */

import type { NotificationPolicy, NotificationTemplate, ApplicationContext } from './types.ts';
import { getNotificationPolicy } from './notification-policies/index.ts';

export interface CompiledNotification {
  subject: string;
  inAppTitle: string;
  inAppBody: string;
  emailSubject: string;
  emailHtml: string;
  recipients: string[];
  idempotencyKey: string;
}

export class NotificationEngine {
  /**
   * Replaces handlebars-style variables {{variableName}} in string template
   */
  public static interpolate(template: string, variables: Record<string, string | number | undefined>): string {
    return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
      const val = variables[key];
      return val !== undefined ? String(val) : '';
    });
  }

  /**
   * Compiles notification templates with real runtime context variables
   */
  public static compileNotification(
    policyKey: string,
    variables: Record<string, string | number | undefined>,
    recipients: string[],
    offsetLabel: string = 'IMMEDIATE',
    entityId: string
  ): CompiledNotification {
    const policy = getNotificationPolicy(policyKey);
    const tmpl: NotificationTemplate = policy.templates;

    const inAppBody = this.interpolate(tmpl.inAppBodyTemplate, variables);
    const emailHtml = this.interpolate(tmpl.emailHtmlTemplate, variables);
    const emailSubject = this.interpolate(tmpl.emailSubjectTemplate, variables);
    const subject = this.interpolate(tmpl.subject, variables);
    const inAppTitle = tmpl.inAppTitle;

    const idempotencyKey = `${entityId}:${policyKey}:${offsetLabel}:${recipients.join(',')}`;

    return {
      subject,
      inAppTitle,
      inAppBody,
      emailSubject,
      emailHtml,
      recipients,
      idempotencyKey,
    };
  }

  /**
   * Recheck precondition:
   * Returns true if case is still eligible to receive notification, false if obsolete/resolved.
   */
  public static isNotificationEligible(
    policy: NotificationPolicy,
    context: ApplicationContext,
    isObligationOpen: boolean = true
  ): boolean {
    // If obligation must be open and it has already been closed/fulfilled -> suppress
    if (policy.recheckCondition.obligationMustBeOpen && !isObligationOpen) {
      return false;
    }

    // If policy is stage-bound and case has already advanced past allowed stages -> suppress
    if (policy.recheckCondition.caseMustBeInStages && policy.recheckCondition.caseMustBeInStages.length > 0) {
      if (!policy.recheckCondition.caseMustBeInStages.includes(context.currentStage)) {
        return false;
      }
    }

    return true;
  }
}
