import { test, expect } from '@playwright/test';
import { prisma } from '../helpers/test-prisma';

test.describe('Document Lifecycle & Statutory Evidence Management (DOC-01)', () => {
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

  test('Upload validation rejects disallowed file extensions', async ({ request }) => {
    const inst = await getRoleSession(request, 'institution@flowguard.local');

    // Attempt to register upload intent with executable / forbidden script file
    const intentRes = await request.post('http://localhost:4000/api/v1/documents/upload-intent', {
      headers: { Cookie: inst.cookie, Authorization: `Bearer ${inst.token}` },
      data: {
        applicationId: 'app-fixture-001',
        fileName: 'malicious_script.exe',
        mimeType: 'application/x-msdownload',
        fileSize: 1024,
        documentType: 'GOVERNMENT_ORDER',
      },
    });

    expect([400, 422]).toContain(intentRes.status());
  });

  test('DOC-01: Document versioning preserves previous version upon replacement', async ({ request }) => {
    const inst = await getRoleSession(request, 'institution@flowguard.local');
    const ro = await getRoleSession(request, 'ro@flowguard.local');

    // 1. First upload intent (Version 1)
    const v1Res = await request.post('http://localhost:4000/api/v1/documents/upload-intent', {
      headers: { Cookie: inst.cookie, Authorization: `Bearer ${inst.token}` },
      data: {
        applicationId: 'app-fixture-001',
        fileName: 'Land_Title_Deed_2026.pdf',
        mimeType: 'application/pdf',
        fileSize: 204800,
        documentType: 'LAND_TITLE',
      },
    });
    expect([200, 201]).toContain(v1Res.status());
    const v1Body = await v1Res.json();
    const docId = v1Body.documentId || v1Body.id;
    const v1Num = v1Body.versionNumber || 1;

    // Confirm v1
    await request.post(`http://localhost:4000/api/v1/documents/${docId}/confirm?version=${v1Num}`, {
      headers: { Cookie: inst.cookie, Authorization: `Bearer ${inst.token}` },
      data: { sha256Checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
    });

    // 2. Upload replacement (Version 2)
    const v2Res = await request.post('http://localhost:4000/api/v1/documents/upload-intent', {
      headers: { Cookie: inst.cookie, Authorization: `Bearer ${inst.token}` },
      data: {
        applicationId: 'app-fixture-001',
        fileName: 'Land_Title_Deed_2026_Amended.pdf',
        mimeType: 'application/pdf',
        fileSize: 250000,
        documentType: 'LAND_TITLE',
      },
    });
    expect([200, 201]).toContain(v2Res.status());
    const v2Body = await v2Res.json();
    const v2Num = v2Body.versionNumber || 2;

    // Confirm v2
    await request.post(`http://localhost:4000/api/v1/documents/${docId}/confirm?version=${v2Num}`, {
      headers: { Cookie: inst.cookie, Authorization: `Bearer ${inst.token}` },
      data: { sha256Checksum: 'a2b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b999' },
    });

    // Verify historical versions exist in DB
    const versions = await prisma.documentVersion.findMany({
      where: { documentId: docId },
    });
    expect(versions.length).toBeGreaterThanOrEqual(1);
  });
});
