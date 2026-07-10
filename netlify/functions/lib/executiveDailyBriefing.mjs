function money(value) {
  const number = Number(value) || 0;
  if (number >= 1_000_000) return `$${(number / 1_000_000).toFixed(number >= 10_000_000 ? 1 : 2)}M`;
  if (number >= 1_000) return `$${Math.round(number / 1_000)}K`;
  return `$${number.toLocaleString('en-US')}`;
}

function clientName(data, id) {
  return data.clients.find((client) => client.id === id)?.name ?? id;
}

function ownerName(data, id) {
  return data.teamMembers.find((member) => member.id === id)?.name ?? id ?? 'Unassigned';
}

function firstMissingDocument(data, clientId) {
  return data.documents.find((document) => document.clientId === clientId && /missing|needs review|expired/i.test(document.status ?? ''));
}

function priorityRank(priority) {
  const ranks = { Critical: 4, High: 3, Medium: 2, Low: 1 };
  return ranks[priority] ?? 0;
}

function renewalPriority(data) {
  const renewal = data.renewals
    .slice()
    .sort((a, b) => Number(b.ownerAttentionRequired) - Number(a.ownerAttentionRequired) || b.revenueAtRisk - a.revenueAtRisk || a.daysToExpiry - b.daysToExpiry)[0];
  const document = firstMissingDocument(data, renewal.clientId);
  return {
    rank: 1,
    type: 'renewal',
    recordId: renewal.id,
    clientId: renewal.clientId,
    clientName: clientName(data, renewal.clientId),
    title: renewal.missingItems.length ? `Renewal blocked by ${renewal.missingItems[0]}` : 'Renewal readiness requires executive review',
    summary: `The renewal expires in ${renewal.daysToExpiry} days and is currently in ${renewal.currentStage}.`,
    businessImpact: renewal.priorityReason,
    financialImpact: money(renewal.revenueAtRisk),
    owner: ownerName(data, renewal.assignedUserId),
    dueDate: renewal.expiryDate,
    recommendedAction: renewal.missingItems.length ? `Resolve ${renewal.missingItems.slice(0, 2).join(' and ')} before market progress.` : 'Review readiness, market status, and next action.',
    primaryAction: { label: 'Open Renewal', route: `/renewals/${encodeURIComponent(renewal.id)}?briefingPriority=1&highlight=renewal-readiness` },
    secondaryActions: [
      { label: 'Open Client 360', route: `/clients/${encodeURIComponent(renewal.clientId)}?briefingPriority=1&highlight=client-health` },
      { label: 'View Missing Documents', route: document ? `/documents/${encodeURIComponent(document.id)}?briefingPriority=1&highlight=missing-document` : `/documents?clientId=${encodeURIComponent(renewal.clientId)}&briefingPriority=1&highlight=missing-document` },
    ],
    highlightTarget: 'renewal-readiness',
    presenterNote: 'Lead with revenue protection: this priority shows why the owner starts from decisions, not menus.',
  };
}

function claimPriority(data) {
  const claim = data.claims
    .filter((item) => item.executiveReviewRequired || item.severity === 'High')
    .sort((a, b) => b.incurredAmount - a.incurredAmount)[0];
  return {
    rank: 2,
    type: 'claim',
    recordId: claim.id,
    clientId: claim.clientId,
    clientName: clientName(data, claim.clientId),
    title: `${claim.claimType} exposure requires review`,
    summary: `${money(claim.incurredAmount)} incurred with ${claim.daysOpen} days open.`,
    businessImpact: 'Claim exposure may affect renewal narrative, client communication, and insurer confidence.',
    financialImpact: money(claim.incurredAmount),
    owner: 'Claims Team',
    dueDate: claim.dateOfLoss,
    recommendedAction: claim.nextAction,
    primaryAction: { label: 'Open Claim', route: `/claims/${encodeURIComponent(claim.id)}?briefingPriority=2&highlight=claim-exposure` },
    secondaryActions: [
      { label: 'Open Client 360', route: `/clients/${encodeURIComponent(claim.clientId)}?briefingPriority=2&highlight=claim-context` },
      { label: 'Open Renewals', route: `/renewals?clientId=${encodeURIComponent(claim.clientId)}&briefingPriority=2&highlight=renewal-impact` },
    ],
    highlightTarget: 'claim-exposure',
    presenterNote: 'Show that claim work is connected to renewal strategy and client confidence.',
  };
}

function compliancePriority(data) {
  const item = data.compliance
    .slice()
    .sort((a, b) => Number(b.status === 'Overdue') - Number(a.status === 'Overdue') || priorityRank(b.severity) - priorityRank(a.severity) || a.dueDate.localeCompare(b.dueDate))[0];
  return {
    rank: 3,
    type: 'compliance',
    recordId: item.id,
    clientId: item.clientId,
    clientName: clientName(data, item.clientId),
    title: `${item.findingType} ${item.status.toLowerCase()}`,
    summary: `${item.severity} severity finding due ${item.dueDate}.`,
    businessImpact: item.businessImpact,
    financialImpact: 'Underwriting impact not directly quantified',
    owner: ownerName(data, item.assignedUserId),
    dueDate: item.dueDate,
    recommendedAction: item.correctiveAction,
    primaryAction: { label: 'Open Compliance', route: `/compliance/${encodeURIComponent(item.id)}?briefingPriority=3&highlight=compliance-action` },
    secondaryActions: [
      { label: 'Open Client 360', route: `/clients/${encodeURIComponent(item.clientId)}?briefingPriority=3&highlight=compliance-context` },
      { label: 'Open Documents', route: `/documents?clientId=${encodeURIComponent(item.clientId)}&briefingPriority=3&highlight=evidence-gap` },
    ],
    highlightTarget: 'compliance-action',
    presenterNote: 'Position compliance as a practical underwriting and insurability signal, not paperwork.',
  };
}

function summarizeScenario(scenario) {
  const byScenario = {
    peak: 'Renewal peak season is increasing the importance of readiness, documents, and team capacity.',
    claims: 'Claims exposure is the dominant executive theme today.',
    compliance: 'Compliance and corrective action follow-up should remain visible in renewal planning.',
    hardening: 'Market hardening makes placement timing, quote quality, and ARI movement more important.',
    growth: 'Growth momentum is positive, with workload and execution capacity requiring attention.',
    healthy: 'The portfolio remains stable, with a small number of high-value decisions requiring focus.',
  };
  return byScenario[scenario] ?? byScenario.healthy;
}

export function getExecutiveDailyBriefing({ data, selectedRole = 'CEO', selectedUserId = 'USR-001', currentDate = '2026-07-10', scenario = 'healthy' }) {
  const metrics = data.businessMetrics;
  const domesticAri = data.aviationRiskIndex.domestic;
  const priorities = [renewalPriority(data), claimPriority(data), compliancePriority(data)].map((item, index) => ({ ...item, rank: index + 1 }));
  const user = data.teamMembers.find((member) => member.id === selectedUserId);
  const openTasks = data.tasks.filter((task) => task.status !== 'Complete');
  const dueToday = openTasks.filter((task) => task.dueDate === currentDate);
  const overdue = openTasks.filter((task) => task.status === 'Overdue' || task.dueDate < currentDate);
  const businessHealthScore = Math.round((metrics.retentionRate + metrics.averageClientHealth + metrics.averageComplianceScore + metrics.documentCompletionRate) / 4);
  const healthLabel = businessHealthScore >= 88 ? 'Stable' : businessHealthScore >= 78 ? 'Watch' : 'Needs Attention';

  return {
    status: 'success',
    intent: 'executive_daily_briefing',
    title: "Today's Executive Briefing",
    greeting: 'Good morning.',
    currentDate,
    selectedRole,
    selectedUserId,
    generatedAt: new Date().toISOString(),
    openingSentence: `${priorities.length} matters require executive attention today. ${summarizeScenario(scenario)}`,
    businessHealth: {
      label: healthLabel,
      score: businessHealthScore,
      summary: `The brokerage is in ${healthLabel.toLowerCase()} status, with ${priorities.length} matters requiring executive attention.`,
    },
    portfolio: {
      activeClients: metrics.activeClients,
      managedPremium: money(metrics.totalManagedPremium),
      revenueAtRisk: money(metrics.revenueAtRisk),
      retentionRate: `${metrics.retentionRate}%`,
      ari: {
        score: domesticAri.score,
        category: domesticAri.category,
        change: domesticAri.change,
      },
    },
    priorityCount: priorities.length,
    priorities,
    standardWork: {
      openTasks: user?.openTasks ?? openTasks.length,
      dueToday: dueToday.length,
      overdue: user?.overdueTasks ?? overdue.length,
      teamOpenTasks: openTasks.length,
    },
    recommendedSequence: priorities.map((priority) => `Review ${priority.clientName} ${priority.type}`),
    suggestedQueries: [
      'Which documents are blocking revenue?',
      'Show claims affecting renewals',
      `Prepare ${priorities[0].clientName} meeting brief`,
      'What remains?',
    ],
    presenterNotes: [
      "Instead of navigating the system manually, the platform prepares the owner's priorities for the day.",
      ...priorities.map((priority) => priority.presenterNote),
    ],
    sourceSummary: {
      dataSourcesUsed: ['businessMetrics', 'renewals', 'claims', 'compliance', 'documents', 'tasks', 'teamMembers', 'clients', 'aviationRiskIndex', 'activities'],
      scenario,
      deterministic: true,
    },
  };
}
