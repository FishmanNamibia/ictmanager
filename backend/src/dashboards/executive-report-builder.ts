/**
 * Executive Report Builder - Streamlined, concise report generation
 * Removes verbose, repetitive content and focuses on actionable insights
 */

export type ReportSection = {
  title: string;
  summary: string;
  keyMetrics: Array<{ label: string; value: string | number; status: 'good' | 'warning' | 'critical' }>;
  keyRisks: string[];
  recommendations: string[];
  boardAttentionLevel: 'low' | 'medium' | 'high' | 'critical';
  dataConfidence: { level: 'high' | 'moderate' | 'low'; narrative: string };
};

export function buildStreamlinedSections(data: {
  core: any;
  risks: any;
  cybersecurity: any;
  serviceDesk: any;
  changes: any;
  drOverview: any;
  vendors: any;
  governance: any;
  policyCompliance: any;
  dataGovernance: any;
  executiveScore: number;
  sourceConnected: any;
  dataGaps: {
    posture: boolean;
    operations: boolean;
    cyber: boolean;
    dr: boolean;
    supplier: boolean;
    governance: boolean;
  };
  confidenceLevels: {
    posture: any;
    operations: any;
    cyber: any;
    dr: any;
    supplier: any;
    governance: any;
  };
}): ReportSection[] {
  const { core, risks, cybersecurity, serviceDesk, changes, drOverview, vendors, governance, policyCompliance, dataGovernance, executiveScore, sourceConnected, dataGaps, confidenceLevels } = data;

  return [
    // 1. ICT Performance & Risk Posture
    {
      title: 'ICT Performance & Risk Posture',
      summary: `Performance score: ${executiveScore}/100. Managing ${core.summary.criticalSystems} critical systems across ${core.applications.total} applications. ${risks.risks.highScore > 0 ? `${risks.risks.highScore} high-priority risks require attention.` : 'No critical risks currently open.'} ${dataGaps.posture ? 'Note: Application and risk records require further population to support full assurance.' : ''}`,
      keyMetrics: [
        { label: 'Performance Score', value: `${executiveScore}/100`, status: executiveScore >= 75 ? 'good' : executiveScore >= 50 ? 'warning' : 'critical' },
        { label: 'Critical Systems', value: core.summary.criticalSystems, status: core.applications.criticalHealth > 0 ? 'warning' : 'good' },
        { label: 'Open Risks', value: risks.risks.open, status: risks.risks.highScore > 0 ? 'critical' : risks.risks.open > 5 ? 'warning' : 'good' },
        { label: 'Total Applications', value: core.applications.total, status: 'good' },
      ],
      keyRisks: [
        risks.risks.highScore > 0 ? `${risks.risks.highScore} high-score risks unresolved` : null,
        core.applications.criticalHealth > 0 ? `${core.applications.criticalHealth} critical apps with health issues` : null,
        dataGaps.posture ? 'Data quality limits assessment accuracy' : null,
      ].filter(Boolean) as string[],
      recommendations: [
        risks.risks.highScore > 0 ? 'Assign ownership to all high-score risks within 30 days' : null,
        core.applications.criticalHealth > 0 ? 'Address critical application health issues immediately' : null,
        'Conduct monthly reviews of highest-risk systems',
      ].filter(Boolean) as string[],
      boardAttentionLevel: core.ictPerformanceScore < 50 || risks.risks.highScore > 0 ? 'high' : 'medium',
      dataConfidence: confidenceLevels.posture,
    },

    // 2. Operations & Service Continuity
    {
      title: 'Operations & Service Continuity',
      summary: `${serviceDesk.openTickets} tickets open (${serviceDesk.overdueTickets} overdue). Average resolution: ${serviceDesk.averageResolutionTime}hrs. ${changes.changes.pendingApprovals} change approvals pending. ${dataGaps.operations ? 'Service desk data is not yet fully integrated — improving data capture is a management priority.' : ''}`,
      keyMetrics: [
        { label: 'Open Tickets', value: serviceDesk.openTickets, status: serviceDesk.overdueTickets > 5 ? 'critical' : serviceDesk.overdueTickets > 0 ? 'warning' : 'good' },
        { label: 'Overdue Tickets', value: serviceDesk.overdueTickets, status: serviceDesk.overdueTickets > 0 ? 'warning' : 'good' },
        { label: 'Avg Resolution (hrs)', value: serviceDesk.averageResolutionTime, status: serviceDesk.averageResolutionTime > 48 ? 'warning' : 'good' },
        { label: 'Pending Approvals', value: changes.changes.pendingApprovals, status: changes.changes.pendingApprovals > 5 ? 'warning' : 'good' },
      ],
      keyRisks: [
        serviceDesk.overdueTickets > 5 ? `${serviceDesk.overdueTickets} overdue tickets may impact user productivity` : null,
        changes.changes.pendingApprovals > 0 ? `${changes.changes.pendingApprovals} pending approvals blocking changes` : null,
        dataGaps.operations ? 'Incomplete service desk data limits visibility' : null,
      ].filter(Boolean) as string[],
      recommendations: [
        serviceDesk.overdueTickets > 0 ? 'Institute weekly reviews of overdue tickets' : null,
        changes.changes.pendingApprovals > 0 ? 'Expedite pending change approvals' : null,
        'Validate all support requests flow through service desk',
      ].filter(Boolean) as string[],
      boardAttentionLevel: serviceDesk.overdueTickets > 5 ? 'high' : serviceDesk.openTickets > 0 || changes.changes.pendingApprovals > 0 ? 'medium' : 'low',
      dataConfidence: confidenceLevels.operations,
    },

    // 3. Cybersecurity
    {
      title: 'Cybersecurity',
      summary: `${cybersecurity.incidentStats.activeIncidents} active incidents. ${cybersecurity.vulnerabilityStats.unpatchedCount} unpatched vulnerabilities (${cybersecurity.vulnerabilityStats.overduePatchCount} overdue). ${cybersecurity.accessReviewStats.overdueCount} overdue access reviews. ${dataGaps.cyber ? 'Cybersecurity monitoring coverage is limited — absence of data does not imply absence of risk. Strengthening monitoring is an urgent management action.' : ''}`,
      keyMetrics: [
        { label: 'Active Incidents', value: cybersecurity.incidentStats.activeIncidents, status: cybersecurity.incidentStats.activeIncidents > 0 ? 'critical' : 'good' },
        { label: 'Critical Risks', value: cybersecurity.riskStats.criticalCount, status: cybersecurity.riskStats.criticalCount > 0 ? 'critical' : 'good' },
        { label: 'Overdue Patches', value: cybersecurity.vulnerabilityStats.overduePatchCount, status: cybersecurity.vulnerabilityStats.overduePatchCount > 0 ? 'warning' : 'good' },
        { label: 'Overdue Reviews', value: cybersecurity.accessReviewStats.overdueCount, status: cybersecurity.accessReviewStats.overdueCount > 0 ? 'warning' : 'good' },
      ],
      keyRisks: [
        cybersecurity.vulnerabilityStats.overduePatchCount > 0 ? `${cybersecurity.vulnerabilityStats.overduePatchCount} overdue vulnerability patches` : null,
        cybersecurity.incidentStats.activeIncidents > 0 ? `${cybersecurity.incidentStats.activeIncidents} active security incidents` : null,
        cybersecurity.accessReviewStats.overdueCount > 0 ? `${cybersecurity.accessReviewStats.overdueCount} overdue access reviews` : null,
        dataGaps.cyber ? 'Limited security monitoring coverage' : null,
      ].filter(Boolean) as string[],
      recommendations: [
        cybersecurity.vulnerabilityStats.overduePatchCount > 0 ? 'Prioritize overdue patches on critical assets' : null,
        cybersecurity.accessReviewStats.overdueCount > 0 ? 'Clear access review backlog within 14 days' : null,
        'Validate incident detection and logging completeness',
      ].filter(Boolean) as string[],
      boardAttentionLevel: cybersecurity.incidentStats.activeIncidents > 0 || cybersecurity.vulnerabilityStats.overduePatchCount > 0 ? 'high' : 'medium',
      dataConfidence: confidenceLevels.cyber,
    },

    // 4. Business Continuity & DR
    {
      title: 'Business Continuity & Disaster Recovery',
      summary: `${drOverview.summary.activePlans} active DR plans (${drOverview.summary.automatedFailoverPlans} automated). ${drOverview.summary.plansNeedingReview} need review. ${drOverview.summary.uncoveredCriticalApps} critical systems lack DR coverage. ${dataGaps.dr ? 'DR records are incomplete — gaps in continuity planning documentation are themselves a risk requiring management attention.' : ''}`,
      keyMetrics: [
        { label: 'Active DR Plans', value: drOverview.summary.activePlans, status: drOverview.summary.uncoveredCriticalApps > 0 ? 'warning' : 'good' },
        { label: 'Automated Plans', value: drOverview.summary.automatedFailoverPlans, status: drOverview.summary.automatedFailoverPlans === 0 ? 'warning' : 'good' },
        { label: 'Plans Needing Review', value: drOverview.summary.plansNeedingReview, status: drOverview.summary.plansNeedingReview > 0 ? 'warning' : 'good' },
        { label: 'Critical DR Gaps', value: drOverview.summary.uncoveredCriticalApps, status: drOverview.summary.uncoveredCriticalApps > 0 ? 'critical' : 'good' },
      ],
      keyRisks: [
        drOverview.summary.uncoveredCriticalApps > 0 ? `${drOverview.summary.uncoveredCriticalApps} critical systems without DR coverage` : null,
        drOverview.summary.automatedFailoverPlans === 0 ? 'No automated failover - reliant on manual processes' : null,
        drOverview.summary.plansNeedingReview > 0 ? `${drOverview.summary.plansNeedingReview} DR plans require review` : null,
        dataGaps.dr ? 'Incomplete DR inventory' : null,
      ].filter(Boolean) as string[],
      recommendations: [
        drOverview.summary.uncoveredCriticalApps > 0 ? 'Develop DR plans for uncovered critical systems within 45 days' : null,
        drOverview.summary.plansNeedingReview > 0 ? 'Complete quarterly DR plan reviews' : null,
        'Increase automation in failover processes',
      ].filter(Boolean) as string[],
      boardAttentionLevel: drOverview.summary.uncoveredCriticalApps > 0 ? 'high' : drOverview.summary.plansNeedingReview > 0 ? 'medium' : 'low',
      dataConfidence: confidenceLevels.dr,
    },

    // 5. Supplier Management
    {
      title: 'Supplier Management',
      summary: `${vendors.expiringIn90Days} contracts expiring in 90 days. ${vendors.expiredContracts} already expired. ${vendors.lowPerformanceVendors} vendors below performance thresholds. Average SLA: ${vendors.averageSlaMetPercent}%. ${dataGaps.supplier ? 'Supplier and contract records require further population to support complete oversight.' : ''}`,
      keyMetrics: [
        { label: 'Expiring (90 days)', value: vendors.expiringIn90Days, status: vendors.expiringIn90Days > 5 ? 'warning' : 'good' },
        { label: 'Expired Contracts', value: vendors.expiredContracts, status: vendors.expiredContracts > 0 ? 'critical' : 'good' },
        { label: 'Low Performance', value: vendors.lowPerformanceVendors, status: vendors.lowPerformanceVendors > 0 ? 'warning' : 'good' },
        { label: 'Avg SLA Met', value: `${vendors.averageSlaMetPercent}%`, status: vendors.averageSlaMetPercent < 90 ? 'warning' : 'good' },
      ],
      keyRisks: [
        vendors.expiredContracts > 0 ? `${vendors.expiredContracts} expired contracts create support risk` : null,
        vendors.expiringIn90Days > 0 ? `${vendors.expiringIn90Days} contracts approaching renewal` : null,
        vendors.lowPerformanceVendors > 0 ? `${vendors.lowPerformanceVendors} vendors underperforming` : null,
        dataGaps.supplier ? 'Incomplete supplier records' : null,
      ].filter(Boolean) as string[],
      recommendations: [
        vendors.expiredContracts > 0 ? 'Renew or replace expired contracts immediately' : null,
        vendors.expiringIn90Days > 0 ? 'Initiate renewal process for expiring contracts' : null,
        vendors.lowPerformanceVendors > 0 ? 'Review underperforming vendor relationships' : null,
      ].filter(Boolean) as string[],
      boardAttentionLevel: vendors.expiredContracts > 0 ? 'high' : vendors.expiringIn90Days > 0 ? 'medium' : 'low',
      dataConfidence: confidenceLevels.supplier,
    },

    // 6. Governance & Compliance
    {
      title: 'Governance & Compliance',
      summary: `Policy compliance: ${policyCompliance.overallCompliancePercent}%. ${governance.overdueForReview} policies overdue for review. ${dataGovernance.pendingDPIA} pending DPIA assessments. ${dataGovernance.lowQualityAssets} low-quality data assets. ${dataGaps.governance ? 'Governance records require further development — building out this data is itself a compliance and oversight priority.' : ''}`,
      keyMetrics: [
        { label: 'Policy Compliance', value: `${policyCompliance.overallCompliancePercent}%`, status: policyCompliance.overallCompliancePercent >= 90 ? 'good' : policyCompliance.overallCompliancePercent >= 75 ? 'warning' : 'critical' },
        { label: 'Overdue Reviews', value: governance.overdueForReview, status: governance.overdueForReview > 0 ? 'warning' : 'good' },
        { label: 'Pending DPIA', value: dataGovernance.pendingDPIA, status: dataGovernance.pendingDPIA > 0 ? 'warning' : 'good' },
        { label: 'Low Quality Assets', value: dataGovernance.lowQualityAssets, status: dataGovernance.lowQualityAssets > 5 ? 'warning' : 'good' },
      ],
      keyRisks: [
        governance.overdueForReview > 0 ? `${governance.overdueForReview} policies overdue for review` : null,
        dataGovernance.pendingDPIA > 0 ? `${dataGovernance.pendingDPIA} DPIA assessments incomplete` : null,
        policyCompliance.overallCompliancePercent < 80 ? 'Policy compliance below acceptable threshold' : null,
        dataGaps.governance ? 'Incomplete governance records' : null,
      ].filter(Boolean) as string[],
      recommendations: [
        governance.overdueForReview > 0 ? 'Complete overdue policy reviews within 30 days' : null,
        dataGovernance.pendingDPIA > 0 ? 'Finalize pending DPIA assessments' : null,
        policyCompliance.overallCompliancePercent < 100 ? 'Improve policy acknowledgement tracking' : null,
      ].filter(Boolean) as string[],
      boardAttentionLevel: governance.overdueForReview > 0 || dataGovernance.pendingDPIA > 0 ? 'medium' : 'low',
      dataConfidence: confidenceLevels.governance,
    },
  ];
}
