import { Injectable, OnModuleInit, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { RoleType } from '../common/enums';
import { PrismaService } from '../prisma/prisma.service';

export interface StageTransitionRule {
  transitionName: string;
  targetStage: string;
  buttonLabel?: string;
  authorizedRoles: string[];
  requiresEvidence?: boolean;
  requiresReason?: boolean;
  requiredEvidenceTypes?: string[];
  aphRuleCitation?: string;
  validationRules?: string[];
  sideEffects?: any;
}

export interface StageDefinition {
  key: string;
  displayName: string;
  description: string;
  ownerRole: string;
  permittedRoles: string[];
  isTerminal: boolean;
  aphClauseCitation?: string;
  allowedTransitions: StageTransitionRule[];
  defaultDeadlinePolicy?: any;
}

export interface WorkflowTemplate {
  key: string;
  name: string;
  version: string;
  status: string;
  applicationCategory: string;
  aphSourceReference: string;
  description: string;
  initialStage: string;
  terminalStages: string[];
  allowedStages: string[];
  mandatoryDocumentsOnSubmission?: string[];
  statutoryConstraints?: string[];
}

@Injectable()
export class WorkflowLoaderService implements OnModuleInit {
  private templates: Map<string, WorkflowTemplate> = new Map();
  private stages: Map<string, StageDefinition> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.loadDefinitions();
  }

  private loadDefinitions() {
    const rootDir = path.resolve(__dirname, '../../../../workflow-config');

    // 1. Load Application Templates
    const appTypesDir = path.join(rootDir, 'application-types');
    if (fs.existsSync(appTypesDir)) {
      const files = fs.readdirSync(appTypesDir).filter((f) => f.endsWith('.json'));
      for (const f of files) {
        try {
          const raw = fs.readFileSync(path.join(appTypesDir, f), 'utf-8');
          const data: WorkflowTemplate = JSON.parse(raw);
          this.templates.set(data.key, data);
        } catch (err) {
          console.error(`Failed to load workflow template file ${f}:`, err);
        }
      }
    }

    // 2. Load Stage Definitions
    const stagesDir = path.join(rootDir, 'stage-definitions');
    if (fs.existsSync(stagesDir)) {
      const files = fs.readdirSync(stagesDir).filter((f) => f.endsWith('.json'));
      for (const f of files) {
        try {
          const raw = fs.readFileSync(path.join(stagesDir, f), 'utf-8');
          const data: StageDefinition = JSON.parse(raw);
          this.stages.set(data.key, data);
        } catch (err) {
          console.error(`Failed to load stage definition file ${f}:`, err);
        }
      }
    }

    console.log(`[WorkflowLoader] Loaded ${this.templates.size} workflow templates & ${this.stages.size} regulatory stages.`);
  }

  getAllTemplates(): WorkflowTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplate(key: string): WorkflowTemplate {
    const template = this.templates.get(key);
    if (!template) {
      throw new NotFoundException(`Workflow template '${key}' not found.`);
    }
    return template;
  }

  getAllStages(): StageDefinition[] {
    return Array.from(this.stages.values());
  }

  getStage(key: string): StageDefinition {
    const stage = this.stages.get(key);
    if (!stage) {
      throw new NotFoundException(`Stage definition '${key}' not found.`);
    }
    return stage;
  }

  async getRules() {
    return this.prisma.ruleVersion.findMany({
      orderBy: { ruleId: 'asc' },
    });
  }

  /**
   * Validate transition using loaded regulatory rules
   */
  validateTransition(
    currentStageKey: string,
    targetStageKey: string,
    userRole: RoleType,
    templateKey?: string,
  ): StageTransitionRule {
    const stage = this.stages.get(currentStageKey);
    if (!stage) {
      throw new BadRequestException(`Current stage '${currentStageKey}' is not a recognized workflow stage.`);
    }

    // Map role enum to role string in config (e.g. SCRUTINY_OFFICER -> ROLE_SCRUTINY_OFFICER)
    const roleString = `ROLE_${userRole}`;

    const transition = stage.allowedTransitions.find(
      (t) =>
        t.targetStage === targetStageKey ||
        (targetStageKey === 'APPROVED' && t.targetStage === 'CLOSED_APPROVED') ||
        (targetStageKey === 'REJECTED' && t.targetStage === 'CLOSED_REJECTED'),
    );

    if (!transition) {
      throw new BadRequestException(
        `Invalid stage transition: no regulatory path from '${currentStageKey}' to '${targetStageKey}' exists.`,
      );
    }

    const isAuthorized =
      transition.authorizedRoles.includes(roleString) ||
      transition.authorizedRoles.includes(userRole as any);

    if (!isAuthorized) {
      throw new ForbiddenException(
        `Role '${userRole}' is not authorized to execute transition '${transition.transitionName}' from '${currentStageKey}' to '${targetStageKey}'. Authorized: [${transition.authorizedRoles.join(', ')}]`,
      );
    }

    return transition;
  }
}
