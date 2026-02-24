const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'eitcms',
});

const upQueries = [
  `CREATE TABLE IF NOT EXISTS security_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    severity VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'reported',
    reported_by VARCHAR(255),
    date_detected TIMESTAMP,
    date_reported TIMESTAMP,
    date_contained TIMESTAMP,
    date_resolved TIMESTAMP,
    root_cause TEXT,
    remediation TEXT,
    affected_systems TEXT,
    affected_users_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_incidents_tenant FOREIGN KEY (tenant_id) REFERENCES tenant (id) ON DELETE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS incident_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url VARCHAR(500),
    file_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_evidence_incident FOREIGN KEY (incident_id) REFERENCES security_incidents (id) ON DELETE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS ict_risks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    likelihood VARCHAR(50) NOT NULL,
    impact VARCHAR(50) NOT NULL,
    overall_risk VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'identified',
    mitigation VARCHAR(500),
    owner VARCHAR(255),
    review_due TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_risks_tenant FOREIGN KEY (tenant_id) REFERENCES tenant (id) ON DELETE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS vulnerabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    cve_id VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    severity VARCHAR(50) NOT NULL,
    affected_component VARCHAR(100),
    affected_version VARCHAR(100),
    patch_version VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'identified',
    discovered_date TIMESTAMP,
    patch_available_date TIMESTAMP,
    target_remediation_date TIMESTAMP,
    remediated_date TIMESTAMP,
    applicable_systems TEXT,
    mitigation TEXT,
    references VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vulns_tenant FOREIGN KEY (tenant_id) REFERENCES tenant (id) ON DELETE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS access_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    scope VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
    due_date TIMESTAMP NOT NULL,
    last_completed_date TIMESTAMP,
    next_due_date TIMESTAMP,
    reviewer VARCHAR(255),
    users_reviewed_count INT DEFAULT 0,
    access_removed_count INT DEFAULT 0,
    findings TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reviews_tenant FOREIGN KEY (tenant_id) REFERENCES tenant (id) ON DELETE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS security_audit_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    audit_type VARCHAR(100) NOT NULL,
    user_id VARCHAR(255),
    action_by VARCHAR(255),
    resource VARCHAR(500),
    details TEXT,
    ip_address VARCHAR(100),
    user_agent VARCHAR(500),
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_tenant FOREIGN KEY (tenant_id) REFERENCES tenant (id) ON DELETE CASCADE
  );`,

  `CREATE INDEX IF NOT EXISTS idx_incidents_tenant ON security_incidents(tenant_id, status);`,
  `CREATE INDEX IF NOT EXISTS idx_risks_tenant ON ict_risks(tenant_id, overall_risk);`,
  `CREATE INDEX IF NOT EXISTS idx_vulns_tenant ON vulnerabilities(tenant_id, severity);`,
  `CREATE INDEX IF NOT EXISTS idx_reviews_tenant ON access_reviews(tenant_id, due_date);`,
  `CREATE INDEX IF NOT EXISTS idx_audit_tenant ON security_audit_evidence(tenant_id, created_at);`,
];

(async () => {
  const client = await pool.connect();
  try {
    console.log('Applying cybersecurity schema...');
    for (const query of upQueries) {
      await client.query(query);
    }
    console.log('Cybersecurity schema applied successfully!');
  } catch (err) {
    console.error('Error applying cybersecurity schema:', err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
})();
