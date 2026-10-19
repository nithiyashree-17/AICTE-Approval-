/**
 * @flowguard/validation
 * Zod validation schemas for forms, API request DTOs, and input sanitization.
 */

import { z } from 'zod';
import { ApplicationType, RoleType } from '@flowguard/shared-types';

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const TransitionRequestSchema = z.object({
  targetStage: z.string(),
  reason: z.string().optional(),
  evidenceDocumentIds: z.array(z.string().uuid()).optional(),
});

export const DeficiencyCreateSchema = z.object({
  clauseReference: z.string().min(1),
  observation: z.string().min(5),
  requiredCorrection: z.string().min(5),
});

export const DeficiencyResponseSchema = z.object({
  institutionResponse: z.string().min(5),
  documentVersionId: z.string().uuid().optional(),
});

export const EvcScheduleSchema = z.object({
  scheduledDate: z.string().datetime(),
  mode: z.enum(['PHYSICAL', 'VIRTUAL', 'HYBRID']),
  locationOrLink: z.string().min(3),
  committeeMemberUserIds: z.array(z.string().uuid()).min(1),
});
