/**
 * AICTE FlowGuard - Database Seed Script
 * Problem Statement ID: 26262
 *
 * Seeds:
 * 1. 10 Standard System Roles (RBAC)
 * 2. 10 Demo Users (One for each role) for local demonstration and testing
 * 3. Synthetic Demo Institution
 * 4. Sample Rule Versions with APH Provenance
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient, RoleType, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();

export const DEMO_USERS = [
  {
    email: 'institution@flowguard.local',
    fullName: 'Delhi Institute of Engineering & Technology (Registrar)',
    role: RoleType.INSTITUTION,
    region: 'NORTH',
  },
  {
    email: 'ro@flowguard.local',
    fullName: 'North Regional Office - Officer In-Charge',
    role: RoleType.REGIONAL_OFFICER,
    region: 'NORTH',
  },
  {
    email: 'bureau@flowguard.local',
    fullName: 'Approval Bureau Officer (HQ)',
    role: RoleType.BUREAU_OFFICER,
    region: 'CENTRAL',
  },
  {
    email: 'scrutiny@flowguard.local',
    fullName: 'Dr. A. K. Sharma (Senior Scrutiny Officer)',
    role: RoleType.SCRUTINY_OFFICER,
    region: 'NORTH',
  },
  {
    email: 'evc_coord@flowguard.local',
    fullName: 'Prof. Ramesh Rao (EVC Regional Coordinator)',
    role: RoleType.EVC_COORDINATOR,
    region: 'NORTH',
  },
  {
    email: 'evc_member@flowguard.local',
    fullName: 'Dr. Sunita Verma (EVC Committee Expert Member)',
    role: RoleType.EVC_MEMBER,
    region: 'NORTH',
  },
  {
    email: 'sac_shc@flowguard.local',
    fullName: 'Justice (Retd.) / Member Convener (SHC/SAC Panel)',
    role: RoleType.SAC_SHC,
    region: 'CENTRAL',
  },
  {
    email: 'authority@flowguard.local',
    fullName: 'Member Secretary / Competent Statutory Authority',
    role: RoleType.COMPETENT_AUTHORITY,
    region: 'CENTRAL',
  },
  {
    email: 'admin@flowguard.local',
    fullName: 'System Administrator (Technical Configuration)',
    role: RoleType.SYSTEM_ADMINISTRATOR,
    region: 'GLOBAL',
  },
  {
    email: 'auditor@flowguard.local',
    fullName: 'Independent Regulatory Auditor (Read-Only)',
    role: RoleType.AUDITOR,
    region: 'GLOBAL',
  },
];

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('CRITICAL: Seed script refuses to execute in production environment.');
    process.exit(1);
  }

  console.log('Seeding AICTE FlowGuard database with 9+ Demo Roles & Users (isDemo=true)...');

  // 1. Seed Roles
  for (const roleName of Object.values(RoleType)) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: {
        name: roleName,
        description: `Standard RBAC role for ${roleName}`,
        permissions: {},
      },
    });
  }

  // 2. Seed Synthetic Institution
  const demoInstitution = await prisma.institution.upsert({
    where: { aicteCode: '1-DEMO-2026-ENG' },
    update: {
      isDemo: true,
    },
    create: {
      aicteCode: '1-DEMO-2026-ENG',
      name: 'Delhi Institute of Technology & Applied Science',
      region: 'NORTH',
      state: 'Delhi',
      address: 'Plot 4, Institutional Area, Sector 6, New Delhi 110070',
      contactEmail: 'contact@ditas-demo.edu.in',
      contactPhone: '+91 11 2345 6789',
      isDemo: true,
    },
  });

  // 3. Seed Users
  for (const u of DEMO_USERS) {
    const userRole = await prisma.role.findUnique({ where: { name: u.role } });
    if (!userRole) continue;

    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        fullName: u.fullName,
        assignedRegion: u.region,
        isDemo: true,
      },
      create: {
        email: u.email,
        fullName: u.fullName,
        passwordHash: '$2b$10$demoHashedPasswordPlaceHolderForLocalDevOnly123',
        status: UserStatus.ACTIVE,
        assignedRegion: u.region,
        institutionId: u.role === RoleType.INSTITUTION ? demoInstitution.id : null,
        isDemo: true,
      },
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId_scopeType_scopeValue: {
          userId: user.id,
          roleId: userRole.id,
          scopeType: u.role === RoleType.INSTITUTION ? 'INSTITUTION' : 'REGION',
          scopeValue: u.role === RoleType.INSTITUTION ? demoInstitution.id : u.region,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: userRole.id,
        scopeType: u.role === RoleType.INSTITUTION ? 'INSTITUTION' : 'REGION',
        scopeValue: u.role === RoleType.INSTITUTION ? demoInstitution.id : u.region,
      },
    });
  }

  // 4. Seed APH Regulatory Rules
  const aphRules = [
    {
      ruleId: 'RULE-LOA-001',
      aphClause: 'Chapter I, Clause 1.3, 1.4',
      aphPageReference: 'Page 12',
      title: 'New Institution Application Submission & Fee Intake',
      description: 'Applicant completes new institution application & pays processing fee with mandatory document checklist',
      provenanceNotes: 'Mandatory atomic transition with SHA-256 hash generation and intake receipt (VERIFIED_STATUTORY)',
    },
    {
      ruleId: 'RULE-LOA-002',
      aphClause: 'Chapter I, Clause 1.5, 1.6',
      aphPageReference: 'Page 14',
      title: 'Application Intake & Scrutiny Assignment SLA',
      description: 'Regional Officer assigns submitted application to authorized Scrutiny Officer within SLA window',
      provenanceNotes: 'Case moves to Regional Scrutiny Queue (PROTOTYPE_POLICY: 3 working days)',
    },
    {
      ruleId: 'RULE-LOA-003',
      aphClause: 'Chapter I, Clause 1.7(a)',
      aphPageReference: 'Page 16',
      title: 'Technical Scrutiny Verification & Clearance',
      description: 'Scrutiny Officer examines documents; all parameters compliant with APH land, building, instructional norms',
      provenanceNotes: 'Requires land title, FDR/Trust deed, State NOC verification (VERIFIED_STATUTORY)',
    },
    {
      ruleId: 'RULE-LOA-004',
      aphClause: 'Chapter I, Clause 1.7(b)',
      aphPageReference: 'Page 17',
      title: 'Itemized Deficiency Issuance',
      description: 'Scrutiny Officer identifies missing/non-compliant documentation and issues structured notice',
      provenanceNotes: 'Records itemized deficiency rows and dispatches immediate notification (VERIFIED_STATUTORY)',
    },
    {
      ruleId: 'RULE-LOA-005',
      aphClause: 'Chapter I, Clause 1.7(c)',
      aphPageReference: 'Page 18',
      title: 'Institutional Deficiency Rectification & Resubmission',
      description: 'Institution uploads rectified documents addressing itemized deficiencies within response window',
      provenanceNotes: 'Preserves prior document versions with version diffs (PROTOTYPE_POLICY: 7 calendar days)',
    },
    {
      ruleId: 'RULE-LOA-006',
      aphClause: 'Chapter I, Clause 1.7(d)',
      aphPageReference: 'Page 19',
      title: 'Re-Scrutiny & Single Cure Opportunity Enforcement',
      description: 'Officer re-evaluates rectified evidence; maximum 1 re-scrutiny permitted before hearing/rejection',
      provenanceNotes: 'If still deficient, routes directly to Standing Hearing Committee (VERIFIED_STATUTORY)',
    },
    {
      ruleId: 'RULE-LOA-007',
      aphClause: 'Chapter I, Clause 1.8(a)',
      aphPageReference: 'Page 22',
      title: 'Expert Visit Committee (EVC) Scheduling',
      description: 'Application cleared scrutiny; coordinator schedules inspection and assigns 3-member roster',
      provenanceNotes: 'Enforces conflict-of-interest checks (PROTOTYPE_POLICY: 7 calendar days)',
    },
    {
      ruleId: 'RULE-LOA-008',
      aphClause: 'Chapter I, Clause 1.8(b), 1.9',
      aphPageReference: 'Page 24',
      title: 'EVC Physical/Virtual Inspection & Evidence Capture',
      description: 'EVC conducts inspection; captures geo-tagged photos, video link, and physical evaluation findings',
      provenanceNotes: 'Inspection completion requires explicit signed report upload (VERIFIED_STATUTORY)',
    },
    {
      ruleId: 'RULE-LOA-009',
      aphClause: 'Chapter I, Clause 1.9(c)',
      aphPageReference: 'Page 26',
      title: 'EVC Synthesis & Bureau Officer Review',
      description: 'Consolidated inspection findings reviewed prior to Competent Authority sanction',
      provenanceNotes: 'Regional Officer memo prepared for Executive Committee docket (VERIFIED_STATUTORY)',
    },
    {
      ruleId: 'RULE-LOA-010',
      aphClause: 'Chapter I, Clause 1.10, 1.11',
      aphPageReference: 'Page 28',
      title: 'Competent Authority Final Sanction (LoA Grant / Refusal)',
      description: 'Executive Committee / Competent Authority issues signed Letter of Approval or Speaking Order',
      provenanceNotes: 'Strictly human decision with digital signature; autonomous AI approval barred (VERIFIED_STATUTORY)',
    },
    {
      ruleId: 'RULE-EOA-001',
      aphClause: 'Chapter II, Clause 2.1, 2.2, Table 2.3',
      aphPageReference: 'Page 40',
      title: 'Routine EoA Self-Disclosure Submission',
      description: 'Existing accredited institution applies for annual Extension of Approval with no substantive changes',
      provenanceNotes: 'Expedited pathway under APH Table 2.3 (VERIFIED_STATUTORY)',
    },
    {
      ruleId: 'RULE-EOA-002',
      aphClause: 'Chapter II, Clause 2.3, Table 2.3',
      aphPageReference: 'Page 42',
      title: 'Automated Regulatory Pre-Check for Routine EoA',
      description: 'System verifies valid NBA/NAAC, land lease validity, and lack of pending FIRs/deficiencies',
      provenanceNotes: 'Clean cases routed directly to batch approval queue (VERIFIED_STATUTORY)',
    },
    {
      ruleId: 'RULE-EOA-003',
      aphClause: 'Chapter II, Clause 2.4',
      aphPageReference: 'Page 44',
      title: 'Competent Authority Batch Sanction for Routine EoA',
      description: 'Council / Competent Authority executes batch approval issuing digital EoA certificates',
      provenanceNotes: 'Annual April 30 statutory cutoff deadline (VERIFIED_STATUTORY)',
    },
    {
      ruleId: 'RULE-CHG-001',
      aphClause: 'Chapter II, Clause 2.5 - 2.14, Table 2.3',
      aphPageReference: 'Page 48',
      title: 'EoA with Substantive Changes (Intake / New Course / Site)',
      description: 'Institution requests course introduction, intake expansion, or campus relocation',
      provenanceNotes: 'Mandates specific scrutiny and inspection based on change type (VERIFIED_STATUTORY)',
    },
    {
      ruleId: 'RULE-SHC-001',
      aphClause: 'Chapter II, Clause 2.19, 2.20',
      aphPageReference: 'Page 55',
      title: 'Standing Hearing Committee Docketing',
      description: 'Applications deficient after re-scrutiny or adverse EVC report docketed before SHC quasi-judicial bench',
      provenanceNotes: 'Quasi-judicial bench composed of retired judges / senior academicians (VERIFIED_STATUTORY)',
    },
    {
      ruleId: 'RULE-SAC-001',
      aphClause: 'Chapter II, Clause 2.24(a)',
      aphPageReference: 'Page 62',
      title: 'Standing Appellate Committee (SAC) 7-Day Statutory Appeal Window',
      description: 'Institution aggrieved by Executive Committee rejection appeals to Council strictly within 7 calendar days',
      provenanceNotes: 'Strict statutory deadline: uploaded_at + 7 days 23:59:59 UTC; barred thereafter (VERIFIED_STATUTORY)',
    },
    {
      ruleId: 'RULE-DOC-001',
      aphClause: 'Chapter I, Clause 1.10 & Chapter II',
      aphPageReference: 'Page 30',
      title: '30-Year Land Leasehold & Certificate Validity Monitoring',
      description: 'Ongoing monitoring of registered land lease and periodic statutory clearances with early warnings',
      provenanceNotes: 'BullMQ alerts at T-180d, T-90d, T-30d, T-7d, and Expiry Date (VERIFIED_STATUTORY)',
    },
  ];

  for (const r of aphRules) {
    await prisma.ruleVersion.upsert({
      where: { ruleId: r.ruleId },
      update: {
        aphClause: r.aphClause,
        aphPageReference: r.aphPageReference,
        title: r.title,
        description: r.description,
        provenanceNotes: r.provenanceNotes,
      },
      create: {
        ruleId: r.ruleId,
        aphClause: r.aphClause,
        aphPageReference: r.aphPageReference,
        title: r.title,
        description: r.description,
        configurationStatus: 'APPROVED' as any,
        effectiveFrom: new Date('2024-01-01T00:00:00Z'),
        provenanceNotes: r.provenanceNotes,
      },
    });
  }

  // 5. Seed Institutions matching demo accounts
  const institutionsData = [
    {
      aicteCode: '1-SUNRISE-2026-ENG',
      name: 'Sunrise Institute of Technology',
      region: 'WEST',
      state: 'Maharashtra',
      address: 'Survey No. 42, Hinjewadi Phase 2, Pune 411057',
      contactEmail: 'registrar@sunrise-tech.edu.in',
      contactPhone: '+91 20 2293 8000',
    },
    {
      aicteCode: '1-GREEN-2026-ENG',
      name: 'Greenfield College of Engineering',
      region: 'NORTH',
      state: 'Uttar Pradesh',
      address: 'NH-91, Grand Trunk Road, Kanpur 208001',
      contactEmail: 'contact@greenfield.ac.in',
      contactPhone: '+91 512 258 1200',
    },
    {
      aicteCode: '1-XAVIER-2026-ENG',
      name: "St. Xavier's Technical Campus",
      region: 'SOUTH',
      state: 'Tamil Nadu',
      address: 'Mount-Poonamallee High Road, Chennai 600089',
      contactEmail: 'principal@stxaviers-campus.edu.in',
      contactPhone: '+91 44 2252 3400',
    },
    {
      aicteCode: '1-NISD-2026-ENG',
      name: 'National Institute of Skill Development',
      region: 'EAST',
      state: 'West Bengal',
      address: 'Sector V, Salt Lake City, Kolkata 700091',
      contactEmail: 'director@nisd-kolkata.gov.in',
      contactPhone: '+91 33 2357 5000',
    },
    {
      aicteCode: '1-RURAL-2026-ENG',
      name: 'Rural Engineering College',
      region: 'CENTRAL',
      state: 'Madhya Pradesh',
      address: 'Berasia Road, Bhopal 462038',
      contactEmail: 'office@rural-engg.org',
      contactPhone: '+91 755 273 4000',
    },
  ];

  const institutionMap = new Map<string, string>();
  institutionMap.set('1-DEMO-2026-ENG', demoInstitution.id);

  for (const inst of institutionsData) {
    const created = await prisma.institution.upsert({
      where: { aicteCode: inst.aicteCode },
      update: {
        name: inst.name,
        region: inst.region,
        state: inst.state,
      },
      create: inst,
    });
    institutionMap.set(inst.aicteCode, created.id);
  }

  // Find scrutiny officer and institution user
  const scrutinyUser = await prisma.user.findFirst({
    where: { email: 'scrutiny@flowguard.local' },
  });
  const roUser = await prisma.user.findFirst({
    where: { email: 'ro@flowguard.local' },
  });
  const evcUser = await prisma.user.findFirst({
    where: { email: 'evc_coord@flowguard.local' },
  });

  // 6. Seed Applications
  const applicationsData = [
    {
      applicationNumber: 'AICTE/2026/APP-1042',
      institutionCode: '1-SUNRISE-2026-ENG',
      type: 'NEW_INSTITUTION_LOA' as any,
      academicYear: '2026-27',
      currentState: 'SCRUTINY',
      workflowDefinitionKey: 'NEW_INSTITUTION_LOA_V1',
      workflowVersion: 1,
      assignedRegion: 'WEST',
      assignedOfficerId: scrutinyUser?.id,
      deficiencies: [
        {
          clauseReference: 'Chapter I, Clause 1.7(b), Table 7.2',
          observation: 'Cadre ratio in Computer Science Dept falls short by 2 Associate Professors per AICTE 2024-27 Norms Table 7.2.',
          requiredCorrection: 'Submit certified recruitment notifications or approved selection board roster within 14 calendar days.',
          status: 'RAISED' as any,
        },
      ],
    },
    {
      applicationNumber: 'AICTE/2026/APP-1038',
      institutionCode: '1-GREEN-2026-ENG',
      type: 'ROUTINE_EOA' as any,
      academicYear: '2026-27',
      currentState: 'HEARING_OR_COMMITTEE_REVIEW',
      workflowDefinitionKey: 'ROUTINE_EOA_V1',
      workflowVersion: 1,
      assignedRegion: 'NORTH',
      assignedOfficerId: roUser?.id,
      deficiencies: [],
    },
    {
      applicationNumber: 'AICTE/2026/APP-1035',
      institutionCode: '1-XAVIER-2026-ENG',
      type: 'NEW_INSTITUTION_LOA' as any,
      academicYear: '2026-27',
      currentState: 'APPROVED',
      workflowDefinitionKey: 'NEW_INSTITUTION_LOA_V1',
      workflowVersion: 1,
      assignedRegion: 'SOUTH',
      assignedOfficerId: scrutinyUser?.id,
      deficiencies: [],
    },
    {
      applicationNumber: 'AICTE/2026/APP-1029',
      institutionCode: '1-NISD-2026-ENG',
      type: 'EOA_SUBSTANTIVE_CHANGE' as any,
      academicYear: '2026-27',
      currentState: 'REJECTED',
      workflowDefinitionKey: 'EOA_SUBSTANTIVE_CHANGE_V1',
      workflowVersion: 1,
      assignedRegion: 'EAST',
      assignedOfficerId: roUser?.id,
      deficiencies: [
        {
          clauseReference: 'Chapter I, Clause 1.7(a)',
          observation: 'Non-contiguous land parcel separated by public road without safe underpass conveyance.',
          requiredCorrection: 'Provide municipal NOC or consolidation title deed.',
          status: 'RAISED' as any,
        },
      ],
    },
    {
      applicationNumber: 'AICTE/2026/APP-1022',
      institutionCode: '1-RURAL-2026-ENG',
      type: 'NEW_INSTITUTION_LOA' as any,
      academicYear: '2026-27',
      currentState: 'SUBMITTED',
      workflowDefinitionKey: 'NEW_INSTITUTION_LOA_V1',
      workflowVersion: 1,
      assignedRegion: 'CENTRAL',
      assignedOfficerId: roUser?.id,
      deficiencies: [],
    },
    {
      applicationNumber: 'AICTE/2026/APP-1015',
      institutionCode: '1-DEMO-2026-ENG',
      type: 'ROUTINE_EOA' as any,
      academicYear: '2026-27',
      currentState: 'SUBMITTED',
      workflowDefinitionKey: 'ROUTINE_EOA_V1',
      workflowVersion: 1,
      assignedRegion: 'NORTH',
      assignedOfficerId: scrutinyUser?.id,
      deficiencies: [],
    },
  ];

  for (const app of applicationsData) {
    const institutionId = institutionMap.get(app.institutionCode);
    if (!institutionId) continue;

    const createdApp = await prisma.application.upsert({
      where: { applicationNumber: app.applicationNumber },
      update: {
        currentState: app.currentState,
        assignedRegion: app.assignedRegion,
      },
      create: {
        applicationNumber: app.applicationNumber,
        institutionId,
        type: app.type,
        academicYear: app.academicYear,
        currentState: app.currentState,
        workflowDefinitionKey: app.workflowDefinitionKey,
        workflowVersion: app.workflowVersion,
        assignedRegion: app.assignedRegion,
        assignedOfficerId: app.assignedOfficerId,
      },
    });

    // Seed deficiencies
    if (app.deficiencies.length > 0 && scrutinyUser) {
      for (const def of app.deficiencies) {
        const existingDef = await prisma.deficiency.findFirst({
          where: { applicationId: createdApp.id, clauseReference: def.clauseReference },
        });
        if (!existingDef) {
          await prisma.deficiency.create({
            data: {
              applicationId: createdApp.id,
              clauseReference: def.clauseReference,
              observation: def.observation,
              requiredCorrection: def.requiredCorrection,
              status: def.status,
              createdById: scrutinyUser.id,
            },
          });
        }
      }
    }

    // Seed EVC event for APP-1038
    if (app.applicationNumber === 'AICTE/2026/APP-1038' && evcUser) {
      const existingEvc = await prisma.evcEvent.findFirst({
        where: { applicationId: createdApp.id },
      });
      if (!existingEvc) {
        await prisma.evcEvent.create({
          data: {
            applicationId: createdApp.id,
            coordinatorId: evcUser.id,
            mode: 'PHYSICAL',
            status: 'SCHEDULED',
            scheduledDate: new Date('2026-06-25T10:00:00Z'),
            locationOrLink: 'Kanpur Campus, Administrative Block B',
          },
        });
      }
    }

    // Seed Stage History
    const historyCount = await prisma.applicationStageHistory.count({
      where: { applicationId: createdApp.id },
    });
    if (historyCount === 0 && (scrutinyUser || roUser)) {
      await prisma.applicationStageHistory.create({
        data: {
          applicationId: createdApp.id,
          fromState: 'DRAFT',
          toState: app.currentState,
          actorId: (scrutinyUser || roUser)!.id,
          reason: `Initial lifecycle state set to ${app.currentState}`,
          workflowVersion: 1,
        },
      });
    }
  }

  // 7. Seed Compliance Obligations
  const obligationsData = [
    {
      institutionCode: '1-SUNRISE-2026-ENG',
      title: '30-Year Registered Land Lease Renewal & Conveyance Certificate',
      description: 'Continuous valid registered leasehold deed exceeding 30-year statutory requirement per APH Chapter I Clause 1.10.',
      evidenceRequired: 'Sub-Registrar certified deed with geo-boundary survey map',
      dueDate: new Date('2026-11-30T00:00:00Z'),
      status: 'OPEN' as any,
    },
    {
      institutionCode: '1-GREEN-2026-ENG',
      title: 'State Fire Service NOC & Structural Safety Audit Certificate',
      description: 'Annual periodic renewal of Municipal Fire Department Clearance for all instructional blocks.',
      evidenceRequired: 'Fire Safety Certificate signed by Chief Fire Officer',
      dueDate: new Date('2026-12-15T00:00:00Z'),
      status: 'OPEN' as any,
    },
    {
      institutionCode: '1-XAVIER-2026-ENG',
      title: 'Mandatory Public Disclosure & Anti-Ragging Affidavit Submission',
      description: 'Annual self-disclosure on institutional portal with online affidavit compliance.',
      evidenceRequired: 'URL link verification and signed affidavit scan',
      dueDate: new Date('2026-08-31T00:00:00Z'),
      status: 'FULFILLED' as any,
    },
  ];

  for (const ob of obligationsData) {
    const instId = institutionMap.get(ob.institutionCode);
    if (!instId) continue;
    const existing = await prisma.complianceObligation.findFirst({
      where: { institutionId: instId, title: ob.title },
    });
    if (!existing) {
      await prisma.complianceObligation.create({
        data: {
          institutionId: instId,
          title: ob.title,
          description: ob.description,
          evidenceRequired: ob.evidenceRequired,
          dueDate: ob.dueDate,
          status: ob.status,
        },
      });
    }
  }

  // 8. Seed Notifications for Scrutiny and RO users
  if (scrutinyUser) {
    const existingNotif = await prisma.notificationEvent.findFirst({
      where: { recipientId: scrutinyUser.id },
    });
    if (!existingNotif) {
      await prisma.notificationEvent.createMany({
        data: [
          {
            recipientId: scrutinyUser.id,
            title: 'New Technical Scrutiny Assigned',
            body: 'Application AICTE/2026/APP-1042 (Sunrise Institute of Technology) assigned for scrutiny review.',
            templateKey: 'SCRUTINY_ASSIGNMENT',
            deliveryStatus: 'SENT',
          },
          {
            recipientId: scrutinyUser.id,
            title: 'Deficiency Window Expiring in 48 Hours',
            body: 'Rectification deadline for AICTE/2026/APP-1042 approaching (July 2, 2026).',
            templateKey: 'DEFICIENCY_SLA_WARNING',
            deliveryStatus: 'SENT',
          },
        ],
      });
    }
  }

  // 9. Seed Audit Logs
  const auditLogsCount = await prisma.auditLog.count();
  if (auditLogsCount === 0 && scrutinyUser) {
    await prisma.auditLog.createMany({
      data: [
        {
          actorId: scrutinyUser.id,
          action: 'APPLICATION_SCRUTINY_STARTED',
          resourceType: 'Application',
          resourceId: 'AICTE/2026/APP-1042',
          ipAddress: '127.0.0.1',
          userAgent: 'FlowGuard Web Client / Firefox 128',
          changesAfter: { status: 'SCRUTINY', reviewer: scrutinyUser.fullName },
        },
        {
          actorId: scrutinyUser.id,
          action: 'DEFICIENCY_NOTICE_ISSUED',
          resourceType: 'Deficiency',
          resourceId: 'DEF-1042-01',
          ipAddress: '127.0.0.1',
          userAgent: 'FlowGuard Web Client / Firefox 128',
          changesAfter: { category: 'FACULTY', status: 'OPEN' },
        },
      ],
    });
  }

  console.log(`Database seeded with ${DEMO_USERS.length} demo accounts, ${aphRules.length} APH regulatory rules, 6 applications, and initial compliance/audit data.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
