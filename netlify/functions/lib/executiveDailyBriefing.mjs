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

function createPriority({ data, rank, type, recordId, clientId, title, summary, businessImpact, financialImpact = 'Operational impact', owner, dueDate, recommendedAction, route, label, secondaryActions = [] }) {
  return {
    rank,
    type,
    recordId,
    clientId,
    clientName: clientName(data, clientId),
    title,
    summary,
    businessImpact,
    financialImpact,
    owner,
    dueDate,
    recommendedAction,
    primaryAction: { label, route },
    secondaryActions,
    highlightTarget: `${type}-attention`,
    presenterNote: `Show how the ${type} priority is ranked from the shared business record.`,
  };
}

function taskPriority(data, task, rank = 1) {
  return createPriority({
    data,
    rank,
    type: 'task',
    recordId: task.id,
    clientId: task.clientId,
    title: task.title,
    summary: `${task.priority} priority ${task.category.toLowerCase()} work is ${task.status.toLowerCase()}.`,
    businessImpact: task.businessImpact,
    owner: ownerName(data, task.assignedUserId),
    dueDate: task.dueDate,
    recommendedAction: 'Confirm ownership and complete or reassign the next step today.',
    route: task.relatedModule === 'Renewals' ? '/renewals' : task.relatedModule === 'Claims' ? '/claims' : '/tasks',
    label: 'Open Work Item',
  });
}

function submissionPriority(data, submission, rank = 1) {
  return createPriority({
    data,
    rank,
    type: 'submission',
    recordId: submission.id,
    clientId: submission.clientId,
    title: `${submission.completionPercent}% complete submission requires coordination`,
    summary: `${submission.documentGaps.length} document gaps remain before the package is insurer-ready.`,
    businessImpact: submission.nextAction,
    owner: 'Submission Team',
    dueDate: data.renewals.find((item) => item.clientId === submission.clientId)?.expiryDate ?? 'Current cycle',
    recommendedAction: submission.nextAction,
    route: `/submissions/${encodeURIComponent(submission.id)}`,
    label: 'Open Submission',
  });
}

function placementPriority(data, negotiation, rank = 1) {
  return createPriority({
    data,
    rank,
    type: 'placement',
    recordId: negotiation.id,
    clientId: negotiation.clientId,
    title: negotiation.decisionRequired ? 'Placement decision is required' : 'Underwriter response is outstanding',
    summary: `${negotiation.quotesReceived} quotes received from ${negotiation.insurersApproached} approached insurers.`,
    businessImpact: negotiation.pendingQuestions[0] ?? `Recommended insurer: ${negotiation.recommendedInsurer}.`,
    financialImpact: `${money(negotiation.estimatedSavings)} savings opportunity`,
    owner: ownerName(data, data.clients.find((client) => client.id === negotiation.clientId)?.assignedPlacementLeadId),
    dueDate: data.renewals.find((item) => item.id === negotiation.renewalId)?.expiryDate ?? 'Current cycle',
    recommendedAction: negotiation.decisionRequired ? 'Review the quote comparison and prepare the client recommendation.' : 'Respond to the outstanding underwriter question.',
    route: `/market-placement/${encodeURIComponent(negotiation.id)}`,
    label: 'Open Placement',
  });
}

function claimRolePriority(data, claim, rank = 1) {
  return createPriority({
    data,
    rank,
    type: 'claim',
    recordId: claim.id,
    clientId: claim.clientId,
    title: `${claim.claimType} requires ${claim.executiveReviewRequired ? 'intervention' : 'follow-up'}`,
    summary: `${money(claim.incurredAmount)} incurred, ${money(claim.reserveAmount)} reserved, and ${claim.daysOpen} days open.`,
    businessImpact: claim.executiveReviewRequired ? 'Claim exposure may affect renewal strategy and client confidence.' : 'Timely communication is required to maintain claim momentum.',
    financialImpact: money(claim.reserveAmount),
    owner: 'Claims Team',
    dueDate: claim.dateOfLoss,
    recommendedAction: claim.nextAction,
    route: `/claims/${encodeURIComponent(claim.id)}`,
    label: 'Open Claim',
  });
}

function complianceRolePriority(data, item, rank = 1) {
  return createPriority({
    data,
    rank,
    type: 'compliance',
    recordId: item.id,
    clientId: item.clientId,
    title: `${item.findingType} is ${item.status.toLowerCase()}`,
    summary: `${item.severity} severity finding due ${item.dueDate}.`,
    businessImpact: item.businessImpact,
    owner: ownerName(data, item.assignedUserId),
    dueDate: item.dueDate,
    recommendedAction: item.correctiveAction,
    route: '/compliance-risk',
    label: 'Open Risk Record',
  });
}

function rolePriorities(data, selectedRole, selectedUserId) {
  const openTasks = data.tasks.filter((task) => task.status !== 'Complete');
  const overdueTasks = openTasks.filter((task) => task.status === 'Overdue').sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const selectedUser = data.teamMembers.find((member) => member.id === selectedUserId);
  const assignedClients = new Set(selectedUser?.assignedClients ?? []);

  if (/operations/i.test(selectedRole)) {
    const delayedRenewal = data.renewals.slice().sort((a, b) => a.readinessScore - b.readinessScore)[0];
    const blockedSubmission = data.submissions.slice().sort((a, b) => a.completionPercent - b.completionPercent)[0];
    return [
      overdueTasks[0] && taskPriority(data, overdueTasks[0], 1),
      delayedRenewal && { ...renewalPriority({ ...data, renewals: [delayedRenewal] }), rank: 2 },
      blockedSubmission && submissionPriority(data, blockedSubmission, 3),
    ].filter(Boolean);
  }

  if (/account manager/i.test(selectedRole)) {
    const task = openTasks.filter((item) => item.assignedUserId === selectedUserId || assignedClients.has(item.clientId)).sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
    const renewal = data.renewals.filter((item) => item.assignedUserId === selectedUserId || assignedClients.has(item.clientId)).sort((a, b) => a.daysToExpiry - b.daysToExpiry)[0];
    const document = data.documents.find((item) => assignedClients.has(item.clientId) && /missing|expired|needs review/i.test(item.status));
    return [
      task && taskPriority(data, task, 1),
      renewal && { ...renewalPriority({ ...data, renewals: [renewal] }), rank: 2 },
      document && createPriority({ data, rank: 3, type: 'document', recordId: document.id, clientId: document.clientId, title: `${document.documentType} requires client follow-up`, summary: `${document.status} document is required for ${document.requiredFor}.`, businessImpact: document.businessImpact, owner: ownerName(data, selectedUserId), dueDate: document.expiryDate ?? 'Current cycle', recommendedAction: 'Send a focused client request and confirm the follow-up date.', route: `/documents/${encodeURIComponent(document.id)}`, label: 'Open Document' }),
    ].filter(Boolean);
  }

  if (/placement/i.test(selectedRole)) {
    const negotiations = data.negotiations.slice().sort((a, b) => Number(b.decisionRequired) - Number(a.decisionRequired) || b.estimatedSavings - a.estimatedSavings);
    const readySubmission = data.submissions.slice().sort((a, b) => b.completionPercent - a.completionPercent)[0];
    return [
      negotiations[0] && placementPriority(data, negotiations[0], 1),
      negotiations[1] && placementPriority(data, negotiations[1], 2),
      readySubmission && submissionPriority(data, readySubmission, 3),
    ].filter(Boolean);
  }

  if (/claims/i.test(selectedRole)) {
    return data.claims.filter((claim) => claim.status !== 'Closed').sort((a, b) => Number(b.executiveReviewRequired) - Number(a.executiveReviewRequired) || b.reserveAmount - a.reserveAmount).slice(0, 3).map((claim, index) => claimRolePriority(data, claim, index + 1));
  }

  if (/compliance|risk advisor/i.test(selectedRole)) {
    return data.compliance.filter((item) => item.status !== 'Closed').sort((a, b) => Number(b.status === 'Overdue') - Number(a.status === 'Overdue') || priorityRank(b.severity) - priorityRank(a.severity)).slice(0, 3).map((item, index) => complianceRolePriority(data, item, index + 1));
  }

  return [renewalPriority(data), claimPriority(data), compliancePriority(data)].map((item, index) => ({ ...item, rank: index + 1 }));
}

function roleKpis(data, selectedRole, priorities, user) {
  const openTasks = data.tasks.filter((task) => task.status !== 'Complete');
  const assignedClients = new Set(user?.assignedClients ?? []);
  if (/operations/i.test(selectedRole)) return [
    { label: 'Open Operational Work', value: openTasks.length, helper: 'Across active workflows.' },
    { label: 'Overdue Tasks', value: openTasks.filter((task) => task.status === 'Overdue').length, helper: 'Requires ownership confirmation.' },
    { label: 'Renewals Delayed', value: data.renewals.filter((item) => item.readinessScore < 70).length, helper: 'Readiness below 70%.' },
    { label: 'Submissions Blocked', value: data.submissions.filter((item) => item.completionPercent < 80).length, helper: 'Not yet market-ready.' },
    { label: 'Team Utilization', value: `${data.businessMetrics.teamUtilization}%`, helper: 'Current operating capacity.' },
    { label: 'Operations Priorities', value: priorities.length, helper: 'Ranked for review.' },
  ];
  if (/account manager/i.test(selectedRole)) return [
    { label: 'Assigned Clients', value: assignedClients.size, helper: 'Current relationship portfolio.' },
    { label: 'Open Tasks', value: openTasks.filter((task) => task.assignedUserId === user?.id || assignedClients.has(task.clientId)).length, helper: 'Assigned client work.' },
    { label: 'Overdue Tasks', value: user?.overdueTasks ?? 0, helper: 'Needs attention today.' },
    { label: 'Renewals Due Soon', value: data.renewals.filter((item) => assignedClients.has(item.clientId) && item.daysToExpiry <= 60).length, helper: 'Within 60 days.' },
    { label: 'Documents Pending', value: data.documents.filter((item) => assignedClients.has(item.clientId) && /missing|expired|needs review/i.test(item.status)).length, helper: 'Client follow-up needed.' },
    { label: 'Client Priorities', value: priorities.length, helper: 'Ranked for today.' },
  ];
  if (/placement/i.test(selectedRole)) return [
    { label: 'Active Placements', value: data.negotiations.length, helper: 'Current market activity.' },
    { label: 'Quotes Received', value: data.negotiations.reduce((sum, item) => sum + item.quotesReceived, 0), helper: 'Across active placements.' },
    { label: 'Underwriter Questions', value: data.negotiations.reduce((sum, item) => sum + item.pendingQuestions.length, 0), helper: 'Awaiting response.' },
    { label: 'Decisions Pending', value: data.negotiations.filter((item) => item.decisionRequired).length, helper: 'Client or broker decision.' },
    { label: 'Savings Opportunity', value: money(data.negotiations.reduce((sum, item) => sum + item.estimatedSavings, 0)), helper: 'Estimated client value.' },
    { label: 'Placement Priorities', value: priorities.length, helper: 'Ranked for review.' },
  ];
  if (/claims/i.test(selectedRole)) return [
    { label: 'Open Claims', value: data.claims.filter((item) => item.status !== 'Closed').length, helper: 'Current claim files.' },
    { label: 'Requiring Intervention', value: data.claims.filter((item) => item.executiveReviewRequired).length, helper: 'Brokerage action needed.' },
    { label: 'High Severity', value: data.claims.filter((item) => item.severity === 'High').length, helper: 'Prioritized exposure.' },
    { label: 'Average Claim Age', value: `${Math.round(data.claims.reduce((sum, item) => sum + item.daysOpen, 0) / Math.max(data.claims.length, 1))} days`, helper: 'Across active records.' },
    { label: 'Outstanding Exposure', value: money(data.claims.reduce((sum, item) => sum + item.reserveAmount, 0)), helper: 'Total reserves.' },
    { label: 'Claims Priorities', value: priorities.length, helper: 'Ranked for intervention.' },
  ];
  if (/compliance|risk advisor/i.test(selectedRole)) return [
    { label: 'Open Findings', value: data.compliance.filter((item) => item.status !== 'Closed').length, helper: 'Current risk advisory work.' },
    { label: 'Overdue Findings', value: data.compliance.filter((item) => item.status === 'Overdue').length, helper: 'Corrective action late.' },
    { label: 'High-Severity Findings', value: data.compliance.filter((item) => item.severity === 'High').length, helper: 'Elevated insurability impact.' },
    { label: 'Renewals Affected', value: new Set(data.compliance.filter((item) => item.status !== 'Closed').map((item) => item.clientId)).size, helper: 'Client records requiring context.' },
    { label: 'Aviation Risk Index', value: data.aviationRiskIndex.domestic.score, helper: data.aviationRiskIndex.domestic.category },
    { label: 'Risk Priorities', value: priorities.length, helper: 'Ranked for advisory action.' },
  ];
  return [
    { label: 'Business Health', value: data.businessMetrics.averageClientHealth, helper: 'Average client health.' },
    { label: 'Revenue At Risk', value: money(data.businessMetrics.revenueAtRisk), helper: 'Validated from renewal records.' },
    { label: 'Active Clients', value: data.businessMetrics.activeClients, helper: 'Current demonstration portfolio.' },
    { label: 'Retention', value: `${data.businessMetrics.retentionRate}%`, helper: 'Portfolio retention indicator.' },
    { label: 'ARI', value: data.aviationRiskIndex.domestic.score, helper: data.aviationRiskIndex.domestic.category },
    { label: 'Executive Priorities', value: priorities.length, helper: 'Ranked for owner review.' },
  ];
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
  const user = data.teamMembers.find((member) => member.id === selectedUserId);
  const priorities = rolePriorities(data, selectedRole, selectedUserId);
  const openTasks = data.tasks.filter((task) => task.status !== 'Complete');
  const dueToday = openTasks.filter((task) => task.dueDate === currentDate);
  const overdue = openTasks.filter((task) => task.status === 'Overdue' || task.dueDate < currentDate);
  const businessHealthScore = Math.round((metrics.retentionRate + metrics.averageClientHealth + metrics.averageComplianceScore + metrics.documentCompletionRate) / 4);
  const healthLabel = businessHealthScore >= 88 ? 'Stable' : businessHealthScore >= 78 ? 'Watch' : 'Needs Attention';
  const title = /operations/i.test(selectedRole)
    ? "Today's Operations Briefing"
    : /account manager/i.test(selectedRole)
      ? 'My Client Service Briefing'
      : /placement/i.test(selectedRole)
        ? "Today's Placement Briefing"
        : /claims/i.test(selectedRole)
          ? "Today's Claims Briefing"
          : /compliance|risk advisor/i.test(selectedRole)
            ? "Today's Risk Advisory Briefing"
            : "Today's Executive Briefing";
  const focusLabel = /owner|executive|ceo/i.test(selectedRole) ? 'executive attention' : `${selectedRole.toLowerCase()} attention`;

  return {
    status: 'success',
    intent: 'executive_daily_briefing',
    title,
    greeting: 'Good morning.',
    currentDate,
    selectedRole,
    selectedUserId,
    generatedAt: new Date().toISOString(),
    openingSentence: `${priorities.length} matters require ${focusLabel} today. ${summarizeScenario(scenario)}`,
    businessHealth: {
      label: healthLabel,
      score: businessHealthScore,
      summary: `The brokerage is in ${healthLabel.toLowerCase()} status, with ${priorities.length} matters ranked for this workspace.`,
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
    kpis: roleKpis(data, selectedRole, priorities, user),
    standardWork: {
      openTasks: user?.openTasks ?? openTasks.length,
      dueToday: dueToday.length,
      overdue: user?.overdueTasks ?? overdue.length,
      teamOpenTasks: openTasks.length,
    },
    recommendedSequence: priorities.map((priority) => `Review ${priority.clientName} ${priority.type}`),
    suggestedQueries: [
      ...(/operations/i.test(selectedRole) ? ['Where are the workflow bottlenecks?', 'Which teams are overloaded?']
        : /account manager/i.test(selectedRole) ? ['Which clients need me today?', 'Which documents are missing?']
          : /placement/i.test(selectedRole) ? ['Which quotes arrived today?', 'Show underwriter questions']
            : /claims/i.test(selectedRole) ? ['Which claims require intervention?', 'Show claims awaiting carrier response']
              : /compliance|risk advisor/i.test(selectedRole) ? ['Which clients present the highest risk?', 'Show overdue corrective actions']
                : ['Which documents are blocking revenue?', 'Show claims affecting renewals']),
      `Prepare ${priorities[0].clientName} meeting brief`,
      'What remains?',
    ],
    presenterNotes: [
      `Instead of navigating modules manually, the platform prepares the ${selectedRole} priorities for the day.`,
      ...priorities.map((priority) => priority.presenterNote),
    ],
    sourceSummary: {
      dataSourcesUsed: ['businessMetrics', 'renewals', 'claims', 'compliance', 'documents', 'tasks', 'teamMembers', 'clients', 'aviationRiskIndex', 'activities'],
      scenario,
      deterministic: true,
    },
  };
}
