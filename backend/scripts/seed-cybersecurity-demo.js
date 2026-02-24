const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'eitcms',
});

(async () => {
  const client = await pool.connect();
  try {
    console.log('Seeding cybersecurity demo data...');

    const tenantResult = await client.query(
      `SELECT id FROM tenant WHERE slug = 'demo' LIMIT 1`,
    );
    if (!tenantResult.rows.length) {
      console.log('Demo tenant not found. Please run seed.js first.');
      process.exit(1);
    }
    const tenantId = tenantResult.rows[0].id;

    // Seed Security Incidents
    await client.query(
      `INSERT INTO security_incidents (tenant_id, title, description, severity, status, reported_by, date_detected, date_reported, root_cause, remediation, affected_systems, affected_users_count)
       VALUES 
       ($1, 'Suspicious Login Attempt', 'Multiple failed login attempts from unknown IP', 'high', 'investigating', 'admin@demo.local', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NULL, NULL, ARRAY['User Portal'], 1),
       ($1, 'Data Export Anomaly', 'Unusual bulk data export detected', 'critical', 'contained', 'admin@demo.local', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', 'Compromised API key', 'Key rotated, access revoked', ARRAY['Database'], 150),
       ($1, 'Malware Detection on Workstation', 'Trojan detected during scan', 'medium', 'resolved', 'admin@demo.local', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', 'Downloaded infected file', 'System quarantined and cleaned', ARRAY['Workstation'], 1)
       ON CONFLICT DO NOTHING`,
      [tenantId],
    );

    // Seed ICT Risks
    await client.query(
      `INSERT INTO ict_risks (tenant_id, title, description, category, likelihood, impact, overall_risk, status, mitigation, owner, review_due)
       VALUES
       ($1, 'Ransomware Attack', 'Potential ransomware infection affecting critical systems', 'malware', 'high', 'critical', 'critical', 'mitigating', 'Regular backups, EDR solutions, security awareness training', 'ICT Manager', NOW() + INTERVAL '30 days'),
       ($1, 'Unauthorized Access to Admin Panel', 'Risk of unauthorized admin access due to weak credentials', 'unauthorized_access', 'medium', 'high', 'high', 'identified', 'MFA enforcement, password policy review, access logs monitoring', 'Security Officer', NOW() + INTERVAL '45 days'),
       ($1, 'DDoS Attack on Web Services', 'Potential DDoS attack disrupting service availability', 'ddos', 'low', 'high', 'medium', 'monitored', 'DDoS protection service, rate limiting, traffic filtering', 'Network Admin', NOW() + INTERVAL '60 days')
       ON CONFLICT DO NOTHING`,
      [tenantId],
    );

    // Seed Vulnerabilities
    await client.query(
      `INSERT INTO vulnerabilities (tenant_id, cve_id, title, description, severity, affected_component, affected_version, patch_version, status, discovered_date, patch_available_date, target_remediation_date, applicable_systems, mitigation)
       VALUES
       ($1, 'CVE-2024-1234', 'Critical RCE in OpenSSL', 'Remote code execution vulnerability in OpenSSL', 'critical', 'OpenSSL', '3.0.8', '3.0.9', 'patched', NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '3 days', ARRAY['Web Server', 'API Server'], 'Patched to version 3.0.9'),
       ($1, 'CVE-2024-5678', 'SQL Injection in Custom App', 'SQL injection vulnerability allowing data extraction', 'high', 'CustomApp', '2.1.0', '2.1.1', 'in_progress', NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days', NOW() + INTERVAL '5 days', ARRAY['CustomApp'], 'Input validation implemented, testing in progress'),
       ($1, 'CVE-2024-9999', 'Weak Password Policy', 'System allows weak password configurations', 'medium', 'Active Directory', '2019', '2019 SP1', 'identified', NOW() - INTERVAL '20 days', NOW() - INTERVAL '19 days', NOW() + INTERVAL '30 days', ARRAY['Identity System'], 'Plan to enforce password complexity policy')
       ON CONFLICT DO NOTHING`,
      [tenantId],
    );

    // Seed Access Reviews
    await client.query(
      `INSERT INTO access_reviews (tenant_id, title, description, scope, status, due_date, last_completed_date, next_due_date, reviewer, users_reviewed_count, access_removed_count, findings)
       VALUES
       ($1, 'Q4 2025 Admin Access Review', 'Review of all administrative access across systems', 'admins', 'completed', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NOW() + INTERVAL '85 days', 'security@demo.local', 12, 2, 'Two accounts with excessive permissions were remediated'),
       ($1, 'Q1 2026 User Access Review', 'Annual review of standard user access rights', 'all_users', 'in_progress', NOW() + INTERVAL '10 days', NULL, NULL, 'manager@demo.local', 45, 0, NULL),
       ($1, 'Q2 2026 Contractor Access Review', 'Review of contractor and vendor access', 'contractors', 'scheduled', NOW() + INTERVAL '60 days', NULL, NULL, 'compliance@demo.local', 0, 0, NULL)
       ON CONFLICT DO NOTHING`,
      [tenantId],
    );

    // Seed Security Audit Evidence
    await client.query(
      `INSERT INTO security_audit_evidence (tenant_id, audit_type, user_id, action_by, resource, details, ip_address, success)
       VALUES
       ($1, 'mfa_verification', 'admin@demo.local', 'system', 'Web Portal Login', 'MFA verification successful', '192.168.1.100', true),
       ($1, 'rbac_change', NULL, 'admin@demo.local', 'User Role: staff1@demo.local', 'Role changed from Staff to Manager', '192.168.1.50', true),
       ($1, 'permission_escalation', 'exec@demo.local', 'system', 'Reports Module', 'Executive access granted to Finance Reports', '10.0.0.45', true),
       ($1, 'login_success', 'admin@demo.local', 'system', 'Web Portal', 'Successful login', '192.168.1.100', true),
       ($1, 'login_failed', NULL, 'system', 'Web Portal', 'Failed login attempt - wrong password', '203.0.113.45', false)
       ON CONFLICT DO NOTHING`,
      [tenantId],
    );

    console.log('Cybersecurity demo data seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding cybersecurity data:', err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
})();
