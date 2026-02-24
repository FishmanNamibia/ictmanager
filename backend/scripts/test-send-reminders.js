require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Client } = require('pg');
const nodemailer = require('nodemailer');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://root:root@localhost:5432/iictms';

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (host && port) return nodemailer.createTransport({ host, port, secure: false, auth: user && pass ? { user, pass } : undefined });
  return null;
}

async function run() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  const transporter = createTransporter();

  const tenantRes = await client.query(`SELECT id FROM tenants WHERE slug='demo'`);
  if (!tenantRes.rows.length) { console.error('demo tenant missing'); process.exit(1); }
  const tenantId = tenantRes.rows[0].id;

  // find policies due today or within 30 days
  const policies = await client.query(`SELECT * FROM policies WHERE tenant_id=$1 AND next_review_due IS NOT NULL AND next_review_due <= (CURRENT_DATE + INTERVAL '30 days') ORDER BY next_review_due`, [tenantId]);

  for (const p of policies.rows) {
    // get users who haven't acknowledged
    const userRes = await client.query(`SELECT u.* FROM users u WHERE u.tenant_id=$1 AND u.role IN ('ict_staff','ict_manager') AND u.id NOT IN (SELECT user_id FROM policy_acknowledgements ack WHERE ack.tenant_id=$1 AND ack.policy_id=$2)`, [tenantId, p.id]);
    for (const u of userRes.rows) {
      const subject = `REMINDER: Policy review due - ${p.title}`;
      const html = `<p>Hi ${u.fullName},</p><p>Please review policy <b>${p.title}</b> due on <b>${p.next_review_due?.toISOString().slice(0,10) || p.next_review_due}</b>.</p>`;
      if (!transporter) {
        console.log(`(mock email) To: ${u.email} Subject: ${subject}\n${html}`);
      } else {
        await transporter.sendMail({ from: process.env.SMTP_FROM || 'no-reply@local', to: u.email, subject, html });
        console.log(`Email sent to ${u.email}`);
      }
    }
  }

  await client.end();
}

run().catch((e)=>{console.error(e); process.exit(1);});
