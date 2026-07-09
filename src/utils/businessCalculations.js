export function getTotalPremiumByClient(clientId, policies) {
  return policies
    .filter((policy) => policy.clientId === clientId)
    .reduce((total, policy) => total + Number(policy.premium || 0), 0);
}

export function calculateRevenueAtRisk(renewals, clients = []) {
  const clientById = new Map(clients.map((client) => [client.id, client]));

  return renewals.reduce((total, renewal) => {
    if (!renewal.ownerAttentionRequired && renewal.daysToExpiry > 30) return total;
    const client = clientById.get(renewal.clientId);
    return total + Number(renewal.revenueAtRisk ?? client?.estimatedRevenue ?? 0);
  }, 0);
}

export function getRenewalsDueSoon(renewals, days = 30) {
  return renewals.filter((renewal) => renewal.daysToExpiry <= days);
}

export function getHighPriorityClients(clients) {
  return clients.filter((client) => ['High', 'Critical'].includes(client.priorityLevel) || client.retentionRisk === 'High');
}

export function getOverdueTasks(tasks, asOfDate = '2026-07-09') {
  const today = new Date(`${asOfDate}T00:00:00Z`);
  return tasks.filter((task) => task.status !== 'Completed' && new Date(`${task.dueDate}T00:00:00Z`) < today);
}

export function getTeamWorkload(teamMembers, tasks = []) {
  return teamMembers.map((member) => {
    const assignedTasks = tasks.filter((task) => task.assignedUserId === member.id && task.status !== 'Completed');
    const overdueTasks = assignedTasks.filter((task) => task.status === 'Overdue');

    return {
      ...member,
      calculatedOpenTasks: assignedTasks.length,
      calculatedOverdueTasks: overdueTasks.length,
      workloadCategory: member.workloadScore >= 80 ? 'High' : member.workloadScore >= 65 ? 'Moderate' : 'Available',
    };
  });
}

export function getClientHealthCategory(score) {
  if (score >= 85) return 'Strong';
  if (score >= 72) return 'Stable';
  if (score >= 60) return 'Watch';
  return 'At Risk';
}

export function getRenewalReadinessCategory(score) {
  if (score >= 88) return 'Ready';
  if (score >= 75) return 'On Track';
  if (score >= 62) return 'Needs Work';
  return 'At Risk';
}

export function getClaimsExposure(claims, clientId) {
  const scopedClaims = clientId ? claims.filter((claim) => claim.clientId === clientId) : claims;

  return {
    count: scopedClaims.length,
    incurredAmount: scopedClaims.reduce((total, claim) => total + Number(claim.incurredAmount || 0), 0),
    reserveAmount: scopedClaims.reduce((total, claim) => total + Number(claim.reserveAmount || 0), 0),
    requiringReview: scopedClaims.filter((claim) => claim.executiveReviewRequired).length,
  };
}

export function getDocumentGapCount(documents, clientId) {
  return documents.filter((document) => {
    if (clientId && document.clientId !== clientId) return false;
    return ['Missing', 'Needs Review', 'Expired'].includes(document.status);
  }).length;
}

export function getComplianceRiskLevel(complianceItems, clientId) {
  const scopedItems = clientId ? complianceItems.filter((item) => item.clientId === clientId) : complianceItems;

  if (scopedItems.some((item) => item.status === 'Overdue' && item.severity === 'High')) return 'High';
  if (scopedItems.some((item) => item.severity === 'High' || item.status === 'Overdue')) return 'Elevated';
  if (scopedItems.some((item) => item.status === 'Open')) return 'Moderate';
  return 'Low';
}

export function getAverage(items, key) {
  if (!items.length) return 0;
  return Math.round(items.reduce((total, item) => total + Number(item[key] || 0), 0) / items.length);
}

export function getSum(items, key) {
  return items.reduce((total, item) => total + Number(item[key] || 0), 0);
}
