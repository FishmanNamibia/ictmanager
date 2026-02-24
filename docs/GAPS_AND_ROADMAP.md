# I-ICTMS — Gaps & Product Roadmap

This document tracks missing components and the planned roadmap for the Integrated ICT Management System. Priorities: **🔴 Critical**, **🟠 Major**, **🟡 Important**.

---

## 1. LICENSE EXPIRY & COMPLIANCE MONITORING (MAJOR GAP)

| Status | Item | What should exist |
|--------|------|-------------------|
| ✅ In place | License expiry dates | `SoftwareLicense.expiryDate` |
| ✅ In place | Over-licensed alerts | `usedSeats > totalSeats` → overAllocated |
| ✅ Done | License renewal countdown (30/60/90 days) | Dashboard widgets + API: `expiringIn30`, `expiringIn60`, `expiringIn90` |
| 🟡 Planned | Under-licensed alerts | Flag when usage approaches entitlement (e.g. used ≥ 90% of total) |
| 🟡 Planned | License usage vs entitlement | Widget: usage % per license / vendor |
| 🟡 Planned | Vendor-specific license dashboards | Filter by vendor; per-vendor expiry/renewal view |
| ✅ Done | Compliance risk score | `complianceRiskScore` 0–100 in API + dashboard widget |
| ✅ Done | **Dashboard widgets** | "Licenses expiring in 30 days", "Renewals due this quarter", "License compliance risk" |
| 🟡 Planned | **Module** | License lifecycle management; auto alerts & reminders |

**Audit risk:** Without this, audit risk remains high.

---

## 2. ICT POLICIES & GOVERNANCE (BIG MISSING PIECE)

| Status | Item | What should exist |
|--------|------|-------------------|
| ✅ Done | ICT policy repository | `policies` table + Policies API (CRUD); types: Acceptable Use, Security, DR, Backup, Data Protection |
| ✅ Done | Policy ownership & approval tracking | `responsibleOwner`, `status` (draft \| approved \| expired) |
| ✅ Done | Policy review dates | `lastReviewDate`, `nextReviewDue` |
| 🟡 Planned | Policy compliance mapping | Which controls/standards each policy supports |
| 🟡 Planned | Staff policy acknowledgement | Record of staff acknowledging policies |
| ✅ Done | **ICT Governance Module** | Policies CRUD; Status: Draft \| Approved \| Expired; run `backend/scripts/policies-migration.sql` |
| ✅ Done | **Dashboard** | "Policies overdue for review" widget; governance stats in dashboard API |

**Essential for auditors & executives.**

---

## 3. CYBERSECURITY & INFORMATION SECURITY (CRITICAL)

| Status | Item | What should exist |
|--------|------|-------------------|
| ❌ Missing | Cyber risk register | ICT risks with threat category, impact, likelihood |
| ❌ Missing | Security incidents | Incidents log (date, description, severity, status) |
| ❌ Missing | Vulnerability tracking | Known vulns, patch status |
| ❌ Missing | User access reviews | Last review date, next due |
| ❌ Missing | MFA / RBAC audit | Evidence of MFA and role assignments |
| ❌ Missing | Cyber maturity scoring | Score against a framework |
| 🟡 Planned | **Cybersecurity Module** | Security incidents, ICT risk register, controls (ISO 27001, COBIT), residual risk |
| 🟡 Planned | **Dashboard** | Cyber risk heatmap, open security issues, last access review date |

**Without this, you cannot claim "secure" ICT.**

---

## 4. IMPLEMENTATION & PROJECT TRACKING (VERY IMPORTANT)

| Status | Item | What should exist |
|--------|------|-------------------|
| ❌ Missing | ICT projects register | Projects with status, timeline, budget |
| ❌ Missing | System implementation tracking | Rollouts, upgrades, decommissioning |
| ❌ Missing | Milestones & timelines | Per-project milestones |
| ❌ Missing | Budget tracking | Budget vs actual |
| ❌ Missing | RAID logs | Risks, Assumptions, Issues, Dependencies |
| ❌ Missing | Benefits realisation | Expected vs actual benefits |
| 🟡 Planned | **ICT Projects Module** | Projects, milestones, budget, health (RAG) |
| 🟡 Planned | **Dashboard** | Project health (RAG), delayed projects, budget overruns |

**Shows ICT delivery, not just operations.**

---

## 5. APPLICATION & SYSTEM HEALTH (DEPTH MISSING)

| Status | Item | What should exist |
|--------|------|-------------------|
| ✅ In place | Application list & criticality | `Application.criticality`, `healthStatus` |
| ✅ In place | Hosting type | `Application.hostingType` |
| ❌ Missing | System uptime | Uptime % or SLA tracking |
| ❌ Missing | System availability SLA | Target vs actual |
| ❌ Missing | Dependency mapping | App-to-app or app-to-infra dependencies |
| ❌ Missing | End-of-life systems | EoL date, vendor support status |
| ❌ Missing | Vendor support status | Supported / extended / EoL |
| 🟡 Planned | **Enhancements** | Support status, EoL date, health score, SLA fields |
| 🟡 Planned | **Dashboard** | High-risk systems, unsupported systems, systems due for upgrade |

---

## 6. DATA GOVERNANCE & INFORMATION MANAGEMENT (ABSENT)

| Status | Item | What should exist |
|--------|------|-------------------|
| ❌ Missing | Data classification | Public / Confidential / Restricted |
| ❌ Missing | Data ownership | Owner per dataset |
| ❌ Missing | Retention & disposal rules | Retention period, disposal approval |
| ❌ Missing | Data sharing agreements | Agreements register |
| ❌ Missing | Privacy & POPIA alignment | Data protection compliance |
| 🟡 Planned | **Data Governance Module** | Datasets register, classification, retention, disposal |

**Becoming mandatory in government & SOEs.**

---

## 7. SERVICE DESK & ITSM (PARTIALLY MISSING)

| Status | Item | What should exist |
|--------|------|-------------------|
| ❌ Missing | Incident management | Incidents workflow, priority, SLA |
| ❌ Missing | Service requests | Request types, fulfilment |
| ❌ Missing | SLA tracking | Target resolution times |
| ❌ Missing | Change management (CAB) | Changes, approval workflow |
| ❌ Missing | Problem management | Problems linked to incidents |
| ❌ Missing | Knowledge base | Articles, runbooks |
| 🟡 Planned | **ITSM Module** | Incidents, Requests, Changes, Problems, KB |
| 🟡 Planned | **Dashboard** | SLA compliance %, average resolution time, repeated incidents |

---

## 8. STAFF PERFORMANCE & WORKLOAD (NOT YET THERE)

| Status | Item | What should exist |
|--------|------|-------------------|
| ✅ Partial | Skills & certifications | Staff profiles, skills, certification expiry |
| ❌ Missing | Workload allocation | Capacity %, assignment to projects/tickets |
| ❌ Missing | Ticket assignment | Link staff to incidents/requests |
| ❌ Missing | Skills gaps | Gap analysis vs role requirements |
| ❌ Missing | Training tracking | Training history, planned training |
| ❌ Missing | Succession planning | Critical role coverage |
| 🟡 Planned | **ICT HR Module** | Skills matrix, certifications, training, capacity utilisation |

---

## 9. EXECUTIVE & AUDITOR VIEW (NEEDS EXPANSION)

| Status | Item | What should exist |
|--------|------|-------------------|
| ✅ In place | Executive dashboard | High-level KPIs, risk exposure, strategic alignment |
| ❌ Missing | Executive ICT scorecard | Single scorecard (KPIs, targets) |
| ❌ Missing | Risk exposure summary | Consolidated risk view |
| ❌ Missing | Audit evidence repository | Downloadable evidence, logs |
| ❌ Missing | Compliance dashboard | Compliance status by domain |
| ❌ Missing | **Auditor mode** | Read-only access, evidence download, logs & approvals |

---

## Implementation phases (suggested)

| Phase | Focus | Deliverables |
|-------|--------|--------------|
| **Phase 1** | License compliance & governance | License expiry widgets (30/60/90), renewals due, compliance score; ICT Policies module (repository, review dates, overdue widget) |
| **Phase 2** | Security & projects | Cybersecurity module (risks, incidents); ICT Projects module (register, RAG, budget) |
| **Phase 3** | Applications & data | App health depth (SLA, EoL, support status); Data Governance module |
| **Phase 4** | ITSM & HR | Service desk (incidents, requests, SLA); Staff workload & training |
| **Phase 5** | Executive & auditor | Scorecard, audit evidence, auditor role & read-only mode |

---

*Last updated: from product backlog. Use this doc to track progress and prioritise sprints.*

---

## Automation Pack v1 (Implemented)

The following cross-module automations are now active in backend scheduling and can also be triggered on demand:

- Vendor contract expiry risk:
  - Creates/updates Risk Register item.
  - Creates/updates Service Desk ticket.
- License compliance risk (over-allocation / critical expiry / expired):
  - Creates/updates Risk Register item.
  - Creates/updates Service Desk ticket.
- Policy overdue review:
  - Creates/updates Compliance Audit Finding.
- High/Critical open vulnerability:
  - Creates/updates Change Request for remediation.

Idempotency and traceability:

- `automation_links` table keeps source-to-target links to prevent duplicate automation records.
- `automation_runs` table stores run status and counters.

API endpoints:

- `GET /api/automation/status` - tenant automation status/history.
- `POST /api/automation/run` - manual tenant run (ICT Manager role).
