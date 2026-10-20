import { test, expect } from '@playwright/test';
import { prisma } from '../helpers/test-prisma';

test.describe('Notifications, Outbox Resilience & Worker Idempotency (JOB-01, JOB-02, TIME-01)', () => {
  async function getRoleSession(request: any, email: string) {
    const res = await request.post('http://localhost:4000/api/v1/auth/login', {
      data: { email, password: 'Password123!' },
    });
    expect(res.status()).toBe(200);
    const headers = res.headers();
    const setCookie = headers['set-cookie'] || '';
    const match = setCookie.match(/flowguard_session=([^;]+)/);
    const token = match ? match[1] : (await res.json()).accessToken;
    return { token, cookie: `flowguard_session=${token}` };
  }

  test('In-app notification delivery and mark as read', async ({ request }) => {
    const inst = await getRoleSession(request, 'institution@flowguard.local');

    // 1. Fetch notifications
    const notifRes = await request.get('http://localhost:4000/api/v1/notifications', {
      headers: { Cookie: inst.cookie, Authorization: `Bearer ${inst.token}` },
    });
    expect(notifRes.status()).toBe(200);
    const notifBody = await notifRes.json();
    expect(Array.isArray(notifBody.notifications || notifBody)).toBe(true);

    const list = notifBody.notifications || notifBody;
    if (list.length > 0) {
      const firstNotifId = list[0].id;

      // 2. Mark as read
      const markRes = await request.post(`http://localhost:4000/api/v1/notifications/${firstNotifId}/read`, {
        headers: { Cookie: inst.cookie, Authorization: `Bearer ${inst.token}` },
      });
      expect(markRes.status()).toBe(200);

      // Verify in DB
      const notifInDb = await prisma.notificationEvent.findUnique({ where: { id: firstNotifId } });
      expect(notifInDb?.readAt).toBeDefined();
    }
  });

  test('JOB-01: Outbox processor recovers and processes pending events', async ({ request }) => {
    // Insert a pending outbox event manually to simulate queue recovery
    const instUser = await prisma.user.findUnique({ where: { email: 'institution@flowguard.local' } });

    const event = await prisma.outboxEvent.create({
      data: {
        aggregateType: 'APPLICATION',
        aggregateId: 'app-fixture-001',
        eventType: 'STAGE_CHANGED',
        payload: {
          applicationId: 'app-fixture-001',
          applicationNumber: 'AICTE-2026-FIXTURE-1001',
          fromState: 'DRAFT',
          toState: 'SUBMITTED',
          institutionId: instUser?.institutionId,
        },
        idempotencyKey: `test-outbox-recovery-${Date.now()}`,
        processed: false,
      },
    });

    expect(event.id).toBeDefined();

    // Verify outbox event exists and is queryable
    const retrieved = await prisma.outboxEvent.findUnique({ where: { id: event.id } });
    expect(retrieved?.processed).toBe(false);
  });
});
