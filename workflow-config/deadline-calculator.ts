/**
 * AICTE FlowGuard - Authoritative Deadline & Timing Engine
 * Bifurcates Statutory Deadlines (strict legal cutoffs) from Configurable Prototype Policies.
 */

import type { TimePolicy } from './types.ts';

export interface CalculatedDeadline {
  dueTimestamp: string; // ISO-8601 UTC string
  dueDateFormatted: string; // YYYY-MM-DD
  isStrictStatutoryCutoff: boolean;
  reminderSchedules: {
    scheduledTimestamp: string;
    offsetDays: number;
    label: string;
  }[];
}

export class DeadlineCalculator {
  /**
   * Computes exact SAC 7-day appeal window under APH Clause 2.24(a).
   * Strict statutory cutoff: exactly 7 calendar days from decision upload timestamp,
   * terminating at 23:59:59.999 UTC of the 7th calendar day.
   */
  public static calculateSacAppealDeadline(decisionUploadedAt: string | Date): CalculatedDeadline {
    const uploadDate = new Date(decisionUploadedAt);
    if (isNaN(uploadDate.getTime())) {
      throw new Error(`Invalid decisionUploadedAt timestamp: ${decisionUploadedAt}`);
    }

    // Add 7 calendar days
    const deadline = new Date(uploadDate.getTime());
    deadline.setUTCDate(deadline.getUTCDate() + 7);
    deadline.setUTCHours(23, 59, 59, 999);

    const dueTimestamp = deadline.toISOString();
    const dueDateFormatted = dueTimestamp.split('T')[0];

    // Notification offsets: Day 1 (immediate), Day 4 (+3d from start), Day 7 (+6d from start)
    const reminderSchedules = [
      {
        scheduledTimestamp: uploadDate.toISOString(),
        offsetDays: 0,
        label: 'DAY_1_IMMEDIATE',
      },
      {
        scheduledTimestamp: new Date(uploadDate.getTime() + 3 * 86400000).toISOString(),
        offsetDays: 3,
        label: 'DAY_4_REMINDER',
      },
      {
        scheduledTimestamp: new Date(uploadDate.getTime() + 6 * 86400000).toISOString(),
        offsetDays: 6,
        label: 'DAY_7_FINAL_NOTICE',
      },
    ];

    return {
      dueTimestamp,
      dueDateFormatted,
      isStrictStatutoryCutoff: true,
      reminderSchedules,
    };
  }

  /**
   * Validates whether an appeal submission timestamp falls within the statutory 7-day limit.
   */
  public static isSacAppealWithinStatutoryLimit(
    decisionUploadedAt: string | Date,
    appealSubmittedAt: string | Date = new Date()
  ): boolean {
    const deadline = this.calculateSacAppealDeadline(decisionUploadedAt);
    const submissionTime = new Date(appealSubmittedAt).getTime();
    const cutoffTime = new Date(deadline.dueTimestamp).getTime();

    return submissionTime <= cutoffTime;
  }

  /**
   * Computes due date and reminder schedule from a given stage or policy TimePolicy.
   */
  public static calculateDeadlineFromPolicy(
    startTimestamp: string | Date,
    timePolicy: TimePolicy
  ): CalculatedDeadline {
    const start = new Date(startTimestamp);
    if (isNaN(start.getTime())) {
      throw new Error(`Invalid startTimestamp: ${startTimestamp}`);
    }

    const deadline = new Date(start.getTime());

    if (timePolicy.durationUnit === 'HOURS') {
      deadline.setUTCHours(deadline.getUTCHours() + timePolicy.durationValue);
    } else if (timePolicy.durationUnit === 'WORKING_DAYS') {
      // Prototype calculation: skip weekends (Saturday=6, Sunday=0)
      let addedDays = 0;
      while (addedDays < timePolicy.durationValue) {
        deadline.setUTCDate(deadline.getUTCDate() + 1);
        const day = deadline.getUTCDay();
        if (day !== 0 && day !== 6) {
          addedDays++;
        }
      }
      deadline.setUTCHours(18, 0, 0, 0); // End of working day
    } else {
      // CALENDAR_DAYS or DAYS
      deadline.setUTCDate(deadline.getUTCDate() + timePolicy.durationValue);
      deadline.setUTCHours(23, 59, 59, 999);
    }

    const dueTimestamp = deadline.toISOString();
    const dueDateFormatted = dueTimestamp.split('T')[0];

    // Build scheduled reminder points based on warningOffsets
    const reminderSchedules = timePolicy.warningOffsets.map((offsetDays) => {
      const scheduled = new Date(deadline.getTime());
      scheduled.setUTCDate(scheduled.getUTCDate() + offsetDays);
      return {
        scheduledTimestamp: scheduled.toISOString(),
        offsetDays,
        label: offsetDays < 0 ? `T_MINUS_${Math.abs(offsetDays)}D` : offsetDays === 0 ? 'DUE_DATE' : `T_PLUS_${offsetDays}D`,
      };
    });

    return {
      dueTimestamp,
      dueDateFormatted,
      isStrictStatutoryCutoff: timePolicy.isStrictStatutoryCutoff,
      reminderSchedules,
    };
  }

  /**
   * Generates a deterministic idempotency key for notifications and BullMQ jobs.
   * Pattern: "{entityId}:{policyKey}:{offset}:{recipientId}:{deadlineVersion}"
   */
  public static generateIdempotencyKey(
    entityId: string,
    policyKey: string,
    offset: number | string,
    recipientId: string,
    deadlineVersion: number = 1
  ): string {
    return `${entityId}:${policyKey}:${offset}:${recipientId}:v${deadlineVersion}`;
  }
}
