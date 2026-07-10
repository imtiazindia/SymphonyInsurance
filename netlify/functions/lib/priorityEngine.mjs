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

function priorityScore(item) {
  return item.priorityScore ?? 0;
}

export function buildSmartPriorities(data) {
  const highRevenueItems = data.renewals
    .slice()
    .sort((a, b) => b.revenueAtRisk - a.revenueAtRisk)
    .slice(0, 4)
    .map((renewal) => ({
      id: `priority-revenue-${renewal.id}`,
      category: 'High Revenue Items',
      title: clientName(data, renewal.clientId),
      issue: `${money(renewal.revenueAtRisk)} revenue at risk`,
      businessImpact: renewal.priorityReason,
      owner: ownerName(data, renewal.assignedUserId),
      primaryAction: { label: 'Open Renewal', route: `/renewals/${encodeURIComponent(renewal.id)}` },
      secondaryAction: { label: 'Open Client', route: `/clients/${encodeURIComponent(renewal.clientId)}` },
      priorityScore: 95 + (renewal.ownerAttentionRequired ? 8 : 0),
    }));

  const blockedWork = data.documents
    .filter((document) => /missing|needs review|expired/i.test(document.status ?? '') || /block/i.test(document.businessImpact ?? ''))
    .slice(0, 4)
    .map((document) => ({
      id: `priority-document-${document.id}`,
      category: 'Blocked Work',
      title: clientName(data, document.clientId),
      issue: `${document.documentType} ${document.status}`,
      businessImpact: document.businessImpact || 'Document dependency may affect workflow readiness.',
      owner: 'Account Team',
      primaryAction: { label: 'Open Document', route: `/documents/${encodeURIComponent(document.id)}` },
      secondaryAction: { label: 'Open Client', route: `/clients/${encodeURIComponent(document.clientId)}` },
      priorityScore: /missing/i.test(document.status) ? 93 : 82,
    }));

  const openClaims = data.claims
    .filter((claim) => claim.executiveReviewRequired || claim.severity === 'High')
    .slice()
    .sort((a, b) => b.incurredAmount - a.incurredAmount)
    .slice(0, 4)
    .map((claim) => ({
      id: `priority-claim-${claim.id}`,
      category: 'Open Claims',
      title: clientName(data, claim.clientId),
      issue: `${claim.claimType} claim`,
      businessImpact: `${money(claim.incurredAmount)} incurred and ${claim.daysOpen} days open.`,
      owner: 'Claims Team',
      primaryAction: { label: 'Open Claim', route: `/claims/${encodeURIComponent(claim.id)}` },
      secondaryAction: { label: 'Open Client', route: `/clients/${encodeURIComponent(claim.clientId)}` },
      priorityScore: 88 + (claim.executiveReviewRequired ? 7 : 0),
    }));

  const compliance = data.compliance
    .filter((item) => item.status === 'Overdue' || item.severity === 'High')
    .slice(0, 4)
    .map((item) => ({
      id: `priority-compliance-${item.id}`,
      category: 'Compliance',
      title: clientName(data, item.clientId),
      issue: item.findingType,
      businessImpact: item.businessImpact,
      owner: ownerName(data, item.assignedUserId),
      primaryAction: { label: 'Open Compliance', route: `/compliance/${encodeURIComponent(item.id)}` },
      secondaryAction: { label: 'Open Client', route: `/clients/${encodeURIComponent(item.clientId)}` },
      priorityScore: item.status === 'Overdue' ? 86 : 78,
    }));

  const teamRequests = data.teamMembers
    .filter((member) => member.workloadScore >= 80 || member.overdueTasks > 2)
    .slice()
    .sort((a, b) => b.workloadScore - a.workloadScore)
    .slice(0, 4)
    .map((member) => ({
      id: `priority-team-${member.id}`,
      category: 'Team Requests',
      title: member.name,
      issue: `${member.workloadScore} workload score`,
      businessImpact: `${member.openTasks} open tasks and ${member.overdueTasks} overdue tasks may slow service execution.`,
      owner: member.role,
      primaryAction: { label: 'Open Account Manager', route: '/account-manager' },
      secondaryAction: { label: 'Open Clients', route: '/clients' },
      priorityScore: 76 + Math.min(20, member.overdueTasks * 3),
    }));

  const all = [...highRevenueItems, ...blockedWork, ...openClaims, ...compliance, ...teamRequests]
    .sort((a, b) => priorityScore(b) - priorityScore(a));

  return {
    title: 'My Priorities',
    summary: `${all.length} ranked priorities combine high revenue items, blocked work, claims, compliance, documents, and team requests.`,
    categories: [
      { label: 'High Revenue Items', count: highRevenueItems.length },
      { label: 'Blocked Work', count: blockedWork.length },
      { label: 'Open Claims', count: openClaims.length },
      { label: 'Compliance', count: compliance.length },
      { label: 'Team Requests', count: teamRequests.length },
    ],
    items: all.slice(0, 12),
  };
}
