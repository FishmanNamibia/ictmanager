/**
 * Seed trigger data for Automation Pack v1 and execute one run.
 * Usage: node backend/scripts/seed-automation-demo.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const API_BASE_URL = (process.env.API_BASE_URL || 'http://localhost:3001/api').replace(/\/$/, '');
const TENANT_SLUG = process.env.DEMO_TENANT_SLUG || 'demo';
const EMAIL = process.env.DEMO_ADMIN_EMAIL || 'admin@demo.local';
const PASSWORD = process.env.DEMO_ADMIN_PASSWORD || 'Password1';

function toIsoDate(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function addDays(days) {
  return new Date(Date.now() + days * 86_400_000);
}

async function request(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const raw = await res.text();
  const payload = raw ? JSON.parse(raw) : null;

  if (!res.ok) {
    const message =
      (payload && typeof payload === 'object' && payload.message) || `HTTP ${res.status} for ${path}`;
    const err = new Error(typeof message === 'string' ? message : JSON.stringify(message));
    err.status = res.status;
    err.payload = payload;
    throw err;
  }
  return payload;
}

async function login() {
  const result = await request('/auth/login', {
    method: 'POST',
    body: { tenantSlug: TENANT_SLUG, email: EMAIL, password: PASSWORD },
  });
  if (!result?.accessToken) {
    throw new Error('Login did not return accessToken');
  }
  return result.accessToken;
}

async function ensureVendor(token) {
  const vendorName = 'Automation Demo Vendor';
  const vendors = await request('/vendors-contracts/vendors', { token });
  let vendor = vendors.find((item) => item.name === vendorName);
  if (!vendor) {
    vendor = await request('/vendors-contracts/vendors', {
      method: 'POST',
      token,
      body: {
        name: vendorName,
        serviceCategory: 'Software',
        contactPerson: 'Automation Owner',
        contactEmail: 'automation.owner@demo.local',
        status: 'active',
      },
    });
  } else {
    vendor = await request(`/vendors-contracts/vendors/${vendor.id}`, {
      method: 'PUT',
      token,
      body: {
        contactPerson: 'Automation Owner',
        contactEmail: 'automation.owner@demo.local',
        status: 'active',
      },
    });
  }
  return vendor;
}

async function ensureContract(token, vendorId) {
  const title = 'Automation Demo Contract - Expiring Soon';
  const contracts = await request(`/vendors-contracts/contracts?vendorId=${encodeURIComponent(vendorId)}`, { token });
  const payload = {
    vendorId,
    title,
    contractNumber: 'AUTO-CON-001',
    contractType: 'software_support',
    status: 'active',
    startDate: addDays(-60).toISOString(),
    endDate: addDays(5).toISOString(),
    renewalNoticeDays: 30,
    owner: 'automation.owner@demo.local',
    annualValue: 125000,
    currency: 'NAD',
  };

  let contract = contracts.find((item) => item.title === title);
  if (!contract) {
    contract = await request('/vendors-contracts/contracts', {
      method: 'POST',
      token,
      body: payload,
    });
  } else {
    contract = await request(`/vendors-contracts/contracts/${contract.id}`, {
      method: 'PUT',
      token,
      body: payload,
    });
  }
  return contract;
}

async function ensureLicense(token) {
  const softwareName = 'Automation Demo Suite';
  const licenses = await request('/licenses', { token });
  const payload = {
    softwareName,
    softwareCategory: 'security',
    vendor: 'Automation Demo Vendor',
    licenseType: 'subscription',
    totalSeats: 10,
    usedSeats: 15,
    expiryDate: toIsoDate(addDays(7)),
    businessOwner: 'ICT Operations',
    ictOwner: 'automation.owner@demo.local',
    criticality: 'high',
    notes: 'Seeded to trigger automation rules.',
  };

  let license = licenses.find((item) => item.softwareName === softwareName);
  if (!license) {
    license = await request('/licenses', {
      method: 'POST',
      token,
      body: payload,
    });
  } else {
    license = await request(`/licenses/${license.id}`, {
      method: 'PUT',
      token,
      body: payload,
    });
  }
  return license;
}

async function ensurePolicy(token) {
  const title = 'Automation Demo Policy Overdue';
  const policies = await request('/policies', { token });
  const payload = {
    title,
    policyType: 'security',
    policyDocumentType: 'policy',
    status: 'approved',
    responsibleOwner: 'ICT Operations',
    ictOwner: 'automation.owner@demo.local',
    riskLevel: 'high',
    reviewFrequency: 'annual',
    lastReviewDate: toIsoDate(addDays(-380)),
    nextReviewDue: toIsoDate(addDays(-5)),
    documentUrl: 'https://example.local/policies/automation-demo-policy.pdf',
    notes: 'Seeded to trigger overdue policy automation.',
  };

  let policy = policies.find((item) => item.title === title);
  if (!policy) {
    policy = await request('/policies', {
      method: 'POST',
      token,
      body: payload,
    });
  } else {
    policy = await request(`/policies/${policy.id}`, {
      method: 'PUT',
      token,
      body: payload,
    });
  }
  return policy;
}

async function ensureVulnerability(token) {
  const cveId = 'CVE-AUTO-2026-0001';
  const title = 'Automation Demo Critical Vulnerability';
  const vulnerabilities = await request('/cybersecurity/vulnerabilities', { token });
  const payload = {
    cveId,
    title,
    description: 'Seeded vulnerability to trigger automatic change request creation.',
    severity: 'critical',
    status: 'identified',
    affectedComponent: 'Demo Gateway',
    affectedVersion: '1.0.0',
    patchVersion: '1.0.1',
    discoveredDate: addDays(-1).toISOString(),
    targetRemediationDate: addDays(4).toISOString(),
    mitigation: 'Apply temporary network ACL and prioritize patch change.',
  };

  let vulnerability = vulnerabilities.find((item) => item.cveId === cveId);
  if (!vulnerability) {
    vulnerability = await request('/cybersecurity/vulnerabilities', {
      method: 'POST',
      token,
      body: payload,
    });
  } else {
    vulnerability = await request(`/cybersecurity/vulnerabilities/${vulnerability.id}`, {
      method: 'PUT',
      token,
      body: payload,
    });
  }
  return vulnerability;
}

function latestById(items) {
  return [...items].sort((a, b) => {
    const aTime = new Date(a.createdAt || a.updatedAt || 0).getTime();
    const bTime = new Date(b.createdAt || b.updatedAt || 0).getTime();
    return bTime - aTime;
  });
}

async function run() {
  console.log(`Using API: ${API_BASE_URL}`);
  const token = await login();

  const vendor = await ensureVendor(token);
  const contract = await ensureContract(token, vendor.id);
  const license = await ensureLicense(token);
  const policy = await ensurePolicy(token);
  const vulnerability = await ensureVulnerability(token);

  const runResult = await request('/automation/run', { method: 'POST', token });
  const status = await request('/automation/status', { token });

  const [risks, findings, tickets, changes] = await Promise.all([
    request('/risk-compliance/risks', { token }),
    request('/risk-compliance/findings', { token }),
    request('/service-desk/tickets', { token }),
    request('/change-management/changes', { token }),
  ]);

  const matched = {
    risks: latestById(
      risks.filter(
        (r) => r.title?.includes(contract.title) || r.title?.includes(license.softwareName),
      ),
    ).slice(0, 5),
    findings: latestById(
      findings.filter((f) => f.title?.includes(policy.title)),
    ).slice(0, 5),
    tickets: latestById(
      tickets.filter(
        (t) => t.title?.includes(contract.title) || t.title?.includes(license.softwareName),
      ),
    ).slice(0, 5),
    changes: latestById(
      changes.filter((c) => c.title?.includes(vulnerability.title)),
    ).slice(0, 5),
  };

  const summary = {
    seed: {
      vendorId: vendor.id,
      contractId: contract.id,
      licenseId: license.id,
      policyId: policy.id,
      vulnerabilityId: vulnerability.id,
    },
    run: {
      status: runResult.status,
      processedCount: runResult.processedCount,
      createdCount: runResult.createdCount,
      updatedCount: runResult.updatedCount,
      skippedCount: runResult.skippedCount,
      errorCount: runResult.errorCount,
      runId: runResult.runId,
    },
    status: {
      running: status.running,
      lastRun: status.lastRun
        ? {
            status: status.lastRun.status,
            trigger: status.lastRun.trigger,
            processedCount: status.lastRun.processedCount,
            createdCount: status.lastRun.createdCount,
            updatedCount: status.lastRun.updatedCount,
            errorCount: status.lastRun.errorCount,
          }
        : null,
      linkCount: status.linkSummary?.total ?? 0,
    },
    matched: {
      risks: matched.risks.map((r) => ({ id: r.id, title: r.title, status: r.status })),
      findings: matched.findings.map((f) => ({ id: f.id, title: f.title, status: f.status })),
      tickets: matched.tickets.map((t) => ({ id: t.id, title: t.title, status: t.status })),
      changes: matched.changes.map((c) => ({ id: c.id, title: c.title, status: c.status })),
    },
  };

  console.log(JSON.stringify(summary, null, 2));
}

run().catch((error) => {
  console.error('Automation demo seed failed');
  console.error(error);
  process.exit(1);
});
