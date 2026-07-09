import fs from 'node:fs';
import path from 'node:path';

const dataDir = path.resolve('src/data');

const teamMembers = [
  ['USR-001', 'Alexandra Morgan', 'Owner', 68, 18, 2, ['CLI-001', 'CLI-002', 'CLI-003', 'CLI-004', 'CLI-005', 'CLI-006'], 'AM'],
  ['USR-002', 'Maya Srinivasan', 'Account Manager', 82, 24, 4, ['CLI-001', 'CLI-002', 'CLI-003', 'CLI-009', 'CLI-010', 'CLI-011', 'CLI-012'], 'MS'],
  ['USR-003', 'Julian Mercer', 'Placement Lead', 76, 19, 3, ['CLI-001', 'CLI-002', 'CLI-003', 'CLI-004', 'CLI-007', 'CLI-008'], 'JM'],
  ['USR-004', 'Arielle Chen', 'Account Manager', 71, 21, 2, ['CLI-004', 'CLI-005', 'CLI-006', 'CLI-013', 'CLI-014', 'CLI-015'], 'AC'],
  ['USR-005', 'Owen Patel', 'Placement Lead', 79, 22, 4, ['CLI-009', 'CLI-010', 'CLI-011', 'CLI-016', 'CLI-017', 'CLI-018'], 'OP'],
  ['USR-006', 'Sofia Almeida', 'Submission Specialist', 73, 20, 3, ['CLI-001', 'CLI-002', 'CLI-006', 'CLI-019', 'CLI-020', 'CLI-021'], 'SA'],
  ['USR-007', 'Elena Brooks', 'Claims Coordinator', 64, 15, 1, ['CLI-003', 'CLI-010', 'CLI-017', 'CLI-023', 'CLI-026'], 'EB'],
  ['USR-008', 'Nikhil Rao', 'Compliance Coordinator', 69, 17, 3, ['CLI-003', 'CLI-006', 'CLI-022', 'CLI-027', 'CLI-028'], 'NR'],
  ['USR-009', 'Priya Menon', 'Document Specialist', 61, 14, 2, ['CLI-002', 'CLI-006', 'CLI-014', 'CLI-019', 'CLI-029'], 'PM'],
  ['USR-010', 'Graham Holt', 'Account Manager', 58, 13, 1, ['CLI-022', 'CLI-023', 'CLI-024', 'CLI-025', 'CLI-026', 'CLI-027', 'CLI-028', 'CLI-029', 'CLI-030'], 'GH'],
].map(([id, name, role, workloadScore, openTasks, overdueTasks, assignedClients, avatarInitials]) => ({
  id,
  name,
  role,
  workloadScore,
  openTasks,
  overdueTasks,
  assignedClients,
  avatarInitials,
}));

const clientSeeds = [
  ['CLI-001', 'SkyHigh Airlines', 'Commercial Airline', 'Dallas, TX', 'Scheduled passenger airline', 'USR-002', 'USR-003', 41200000, 4532000, '2026-08-12', 82, 'Medium', 'High', 'Strong', 8, 2, 96, 88, 'Regional airline with expanding Sun Belt routes and a mature safety management program.'],
  ['CLI-002', 'Coastal Air Transport', 'Commercial Airline', 'Seattle, WA', 'Regional passenger airline', 'USR-002', 'USR-003', 18700000, 2057000, '2026-08-15', 78, 'Medium', 'High', 'Stable', 6, 1, 92, 84, 'Coastal carrier with seasonal route swings and moderate weather-related exposure.'],
  ['CLI-003', 'Global Jet Solutions', 'Charter Operator', 'Teterboro, NJ', 'Executive charter', 'USR-002', 'USR-003', 32300000, 3876000, '2026-08-18', 74, 'High', 'Critical', 'Needs Attention', 11, 3, 88, 76, 'Large managed jet fleet with complex owner contracts and several open underwriting questions.'],
  ['CLI-004', 'Pacific Charters', 'Charter Operator', 'Van Nuys, CA', 'On-demand charter', 'USR-004', 'USR-003', 9400000, 1128000, '2026-08-28', 86, 'Low', 'Medium', 'Strong', 4, 0, 94, 91, 'Premium charter operator with newer aircraft and strong pilot training controls.'],
  ['CLI-005', 'AeroTech MRO', 'MRO', 'Tulsa, OK', 'Maintenance and repair', 'USR-004', 'USR-003', 6800000, 748000, '2026-09-03', 80, 'Medium', 'Medium', 'Stable', 5, 1, 93, 86, 'Heavy maintenance provider with products liability and cyber-control considerations.'],
  ['CLI-006', 'Meridian Flight Academy', 'Flight School', 'Mesa, AZ', 'Pilot training', 'USR-004', 'USR-005', 3100000, 341000, '2026-08-20', 69, 'High', 'High', 'Needs Attention', 10, 2, 84, 68, 'High-volume flight school with document gaps around instructor records and safety controls.'],
  ['CLI-007', 'Summit Gate FBO', 'FBO', 'Jackson, WY', 'Fixed base operator', 'USR-002', 'USR-003', 2300000, 276000, '2026-09-10', 77, 'Medium', 'Medium', 'Stable', 6, 1, 89, 82, 'Destination FBO with high-value transient aircraft and winter ramp exposure.'],
  ['CLI-008', 'Bayfront International Airport', 'Airport', 'Corpus Christi, TX', 'Airport authority', 'USR-002', 'USR-003', 4100000, 492000, '2026-09-01', 71, 'High', 'High', 'Needs Attention', 9, 1, 86, 74, 'Coastal airport with fuel farm, property and storm preparedness compliance issues.'],
  ['CLI-009', 'RotorPeak Utility', 'Helicopter Operator', 'Reno, NV', 'Utility rotorcraft', 'USR-002', 'USR-005', 6200000, 682000, '2026-08-22', 66, 'High', 'Critical', 'At Risk', 12, 2, 83, 70, 'Utility helicopter operator with external-load work and elevated loss sensitivity.'],
  ['CLI-010', 'MedLift Rotor Services', 'Helicopter Operator', 'Columbus, OH', 'Air medical', 'USR-002', 'USR-005', 7400000, 814000, '2026-09-15', 84, 'Low', 'Medium', 'Strong', 4, 1, 95, 90, 'Air medical operator with strong clinical credentialing and stable insurer appetite.'],
  ['CLI-011', 'Northstar Airlink', 'Commercial Airline', 'Fargo, ND', 'Essential air service', 'USR-002', 'USR-005', 10900000, 1199000, '2026-10-02', 91, 'Low', 'Medium', 'Strong', 3, 0, 97, 94, 'Commuter airline with clean losses and consistent documentation.'],
  ['CLI-012', 'CanyonJet Connect', 'Commercial Airline', 'Denver, CO', 'Regional passenger airline', 'USR-002', 'USR-005', 23900000, 2629000, '2026-09-18', 76, 'Medium', 'High', 'Stable', 7, 1, 91, 82, 'Mountain-route airline with runway performance and winter operations review needs.'],
  ['CLI-013', 'Sterling Charter Group', 'Charter Operator', 'Teterboro, NJ', 'Managed aircraft', 'USR-004', 'USR-003', 7400000, 888000, '2026-08-16', 81, 'Medium', 'High', 'Stable', 6, 1, 92, 86, 'Part 135 charter group with high-value passenger contractual requirements.'],
  ['CLI-014', 'Cobalt Air Charter', 'Charter Operator', 'Van Nuys, CA', 'Executive charter', 'USR-004', 'USR-005', 9100000, 1092000, '2026-08-30', 72, 'Medium', 'High', 'Needs Attention', 8, 2, 87, 78, 'Premium charter operator with owner-managed aircraft and pending training records.'],
  ['CLI-015', 'Vector Flight Academy', 'Flight School', 'Mesa, AZ', 'Pilot training', 'USR-004', 'USR-005', 1850000, 203500, '2026-08-01', 73, 'Medium', 'Medium', 'Stable', 5, 1, 92, 84, 'Part 141 school with high student volume and improving safety controls.'],
  ['CLI-016', 'Compass Wings Training', 'Flight School', 'Orlando, FL', 'Pilot training', 'USR-004', 'USR-005', 1680000, 184800, '2026-08-15', 62, 'High', 'High', 'Needs Attention', 9, 2, 85, 66, 'International student training program with incomplete medical tracking and safety manual updates.'],
  ['CLI-017', 'Palm Coast Flight Services', 'FBO', 'Naples, FL', 'Fixed base operator', 'USR-004', 'USR-005', 1820000, 218400, '2026-08-30', 79, 'Medium', 'Medium', 'Stable', 5, 1, 90, 82, 'Seasonal FBO with catastrophe property exposure and hangarkeepers concentration.'],
  ['CLI-018', 'Redstone Municipal Airport', 'Airport', 'Huntsville, AL', 'Airport authority', 'USR-004', 'USR-005', 2400000, 288000, '2026-10-01', 88, 'Low', 'Medium', 'Strong', 3, 0, 96, 92, 'Municipal airport with stable claims history and terminal improvement projects.'],
  ['CLI-019', 'Apex Aero Maintenance', 'MRO', 'Tulsa, OK', 'Maintenance and repair', 'USR-010', 'USR-003', 2800000, 308000, '2026-08-01', 83, 'Low', 'Medium', 'Strong', 4, 0, 94, 90, 'Heavy-check MRO with strong QA documentation and tooling controls.'],
  ['CLI-020', 'Precision Turbine Works', 'MRO', 'Indianapolis, IN', 'Engine components', 'USR-010', 'USR-005', 3200000, 352000, '2026-09-01', 75, 'Medium', 'Medium', 'Stable', 5, 1, 91, 80, 'Engine component repair shop with cyber-controlled tooling and products liability exposure.'],
  ['CLI-021', 'HarborHeli Tours', 'Helicopter Operator', 'New York, NY', 'Tour operations', 'USR-010', 'USR-005', 3100000, 341000, '2026-08-12', 68, 'High', 'High', 'Needs Attention', 8, 1, 86, 73, 'Urban tour helicopter operator with public exposure and noise-sensitive operations.'],
  ['CLI-022', 'Meridian Capital Flight Department', 'Corporate Aircraft Client', 'White Plains, NY', 'Corporate aviation', 'USR-010', 'USR-003', 2200000, 264000, '2026-10-01', 93, 'Low', 'Low', 'Strong', 2, 0, 98, 96, 'Corporate flight department with professional crew and excellent document discipline.'],
  ['CLI-023', 'NorthPier Energy Aviation', 'Corporate Aircraft Client', 'Houston, TX', 'Corporate aviation', 'USR-010', 'USR-005', 3100000, 372000, '2026-09-12', 78, 'Medium', 'Medium', 'Stable', 5, 1, 92, 84, 'Energy-sector flight department with international operations and contractual requirements.'],
  ['CLI-024', 'Arden Family Aviation', 'Private Aircraft Client', 'Palm Beach, FL', 'Private aircraft', 'USR-010', 'USR-003', 980000, 117600, '2026-09-08', 81, 'Medium', 'Low', 'Stable', 3, 0, 94, 82, 'Family office aircraft account with owner-pilot endorsements and seasonal storage.'],
  ['CLI-025', 'Luma Ridge Aircraft Trust', 'Private Aircraft Client', 'Bend, OR', 'Private aircraft', 'USR-010', 'USR-005', 740000, 88800, '2026-09-01', 70, 'Medium', 'Medium', 'Needs Attention', 4, 0, 91, 76, 'Owner-flown turboprop and light jet account needing recurrent training evidence.'],
  ['CLI-026', 'Coastal IFR Academy', 'Flight School', 'Norfolk, VA', 'Pilot training', 'USR-010', 'USR-005', 990000, 108900, '2026-09-06', 78, 'Medium', 'Medium', 'Stable', 4, 1, 93, 85, 'Instrument training academy with coastal operations and simulator expansion.'],
  ['CLI-027', 'RiverCity Aero Services', 'FBO', 'St. Louis, MO', 'Fixed base operator', 'USR-010', 'USR-003', 980000, 117600, '2026-10-11', 90, 'Low', 'Low', 'Strong', 2, 0, 96, 94, 'FBO with strong fueling controls and updated fire suppression systems.'],
  ['CLI-028', 'Cedar Valley Regional Airport', 'Airport', 'Cedar Rapids, IA', 'Airport authority', 'USR-010', 'USR-003', 1780000, 213600, '2026-09-24', 87, 'Low', 'Medium', 'Strong', 3, 0, 96, 91, 'Regional public airport with stable premises liability controls and renovation projects.'],
  ['CLI-029', 'Frontier Lift Helicopters', 'Helicopter Operator', 'Bozeman, MT', 'Utility rotorcraft', 'USR-010', 'USR-005', 3900000, 429000, '2026-09-20', 74, 'Medium', 'Medium', 'Stable', 5, 1, 90, 80, 'Remote utility and survey rotorcraft operator with mountain landing exposure.'],
  ['CLI-030', 'Crescent Peak Aviation LLC', 'Private Aircraft Client', 'Santa Fe, NM', 'Private aircraft', 'USR-010', 'USR-003', 690000, 82800, '2026-11-01', 92, 'Low', 'Low', 'Strong', 1, 0, 97, 95, 'Private turboprop account with professional management and clean loss history.'],
];

const clients = clientSeeds.map(([
  id,
  name,
  clientType,
  location,
  industrySegment,
  assignedAccountManagerId,
  assignedPlacementLeadId,
  annualPremium,
  estimatedRevenue,
  renewalDate,
  clientHealthScore,
  retentionRisk,
  priorityLevel,
  relationshipStatus,
  openTasksCount,
  openClaimsCount,
  complianceScore,
  documentCompleteness,
  shortBusinessSummary,
]) => ({
  id,
  name,
  clientType,
  location,
  industrySegment,
  assignedAccountManagerId,
  assignedPlacementLeadId,
  annualPremium,
  estimatedRevenue,
  renewalDate,
  clientHealthScore,
  retentionRisk,
  priorityLevel,
  relationshipStatus,
  openTasksCount,
  openClaimsCount,
  complianceScore,
  documentCompleteness,
  shortBusinessSummary,
}));

const policyTypes = [
  'Hull and Liability',
  'Aviation General Liability',
  'Hangarkeepers Liability',
  'Airport Liability',
  'Workers Compensation',
  'Cyber',
  'Property',
  'Excess Liability',
];

const insurers = [
  "Lloyd's of London",
  'AIG Aviation',
  'Allianz Aerospace',
  'Chubb Aviation',
  'Zurich Aviation',
  'Global Aerospace',
  'Starr Aviation',
  'Old Republic Aerospace',
];

const policies = clients.flatMap((client, clientIndex) => {
  const primaryType = client.clientType === 'Airport'
    ? 'Airport Liability'
    : client.clientType === 'FBO'
      ? 'Hangarkeepers Liability'
      : client.clientType === 'MRO'
        ? 'Aviation General Liability'
        : 'Hull and Liability';
  const types = [primaryType, policyTypes[(clientIndex + 3) % policyTypes.length]];
  if (client.annualPremium > 5000000) types.push('Excess Liability');
  return types.map((policyType, idx) => {
    const premium = Math.round(client.annualPremium * (idx === 0 ? 0.64 : idx === 1 ? 0.24 : 0.12));
    const expiry = idx === 0 ? client.renewalDate : addDays(client.renewalDate, 30 + idx * 12);
    return {
      id: `POL-${String(clientIndex * 3 + idx + 1).padStart(3, '0')}`,
      clientId: client.id,
      policyType,
      insurer: insurers[(clientIndex + idx) % insurers.length],
      premium,
      estimatedCommission: Math.round(premium * (policyType === 'Cyber' ? 0.15 : 0.11)),
      limit: limitForPolicy(policyType, client.annualPremium),
      deductible: deductibleForPolicy(policyType, client.annualPremium),
      effectiveDate: addDays(expiry, -365),
      expiryDate: expiry,
      status: client.priorityLevel === 'Critical' && idx === 0 ? 'Action Required' : idx === 0 ? 'Active' : 'Reviewing',
      optimizationOpportunity: opportunityFor(client, policyType),
      coverageConcern: concernFor(client, policyType),
    };
  });
});

const renewals = clients.slice(0, 18).map((client, index) => {
  const daysToExpiry = daysBetween('2026-07-09', client.renewalDate);
  const readinessScore = Math.max(42, Math.min(96, Math.round((client.documentCompleteness + client.complianceScore) / 2 - (client.openTasksCount > 7 ? 8 : 0))));
  return {
    id: `REN-${String(index + 1).padStart(3, '0')}`,
    clientId: client.id,
    assignedUserId: index % 2 === 0 ? client.assignedAccountManagerId : client.assignedPlacementLeadId,
    expiryDate: client.renewalDate,
    currentStage: stageFromReadiness(readinessScore, daysToExpiry),
    readinessScore,
    premiumAtRenewal: client.annualPremium,
    revenueAtRisk: client.retentionRisk === 'High' ? client.estimatedRevenue : Math.round(client.estimatedRevenue * 0.45),
    daysToExpiry,
    missingItems: missingItemsFor(client),
    priorityReason: priorityReasonFor(client, daysToExpiry),
    ownerAttentionRequired: client.priorityLevel === 'Critical' || client.retentionRisk === 'High',
  };
});

const submissions = renewals.slice(0, 10).map((renewal, index) => {
  const client = byId(clients, renewal.clientId);
  const completionPercent = Math.max(45, Math.min(98, Math.round((renewal.readinessScore + client.documentCompleteness) / 2)));
  return {
    id: `SUB-${String(index + 1).padStart(3, '0')}`,
    clientId: client.id,
    completionPercent,
    status: completionPercent < 70 ? 'Data Request Pending' : completionPercent < 88 ? 'In Review' : 'Ready for Market',
    aircraftScheduleStatus: client.clientType === 'Airport' || client.clientType === 'MRO' ? 'Not Applicable' : statusFromScore(client.documentCompleteness),
    pilotRosterStatus: client.clientType === 'Airport' || client.clientType === 'FBO' || client.clientType === 'MRO' ? 'Not Applicable' : statusFromScore(client.clientHealthScore),
    claimsHistoryStatus: client.openClaimsCount > 1 ? 'Needs Narrative' : 'Complete',
    safetyControlsStatus: statusFromScore(client.complianceScore),
    maintenanceRecordsStatus: client.clientType === 'MRO' ? 'Detailed Review' : statusFromScore(client.documentCompleteness),
    documentGaps: renewal.missingItems,
    underwriterConcerns: concernsForSubmission(client),
    nextAction: nextSubmissionAction(client, completionPercent),
  };
});

const negotiations = renewals.slice(0, 8).map((renewal, index) => {
  const client = byId(clients, renewal.clientId);
  const targetPremium = Math.round(renewal.premiumAtRenewal * (1.05 + index * 0.006));
  const bestQuote = Math.round(targetPremium * (client.retentionRisk === 'High' ? 1.04 : 0.97));
  return {
    id: `NEG-${String(index + 1).padStart(3, '0')}`,
    clientId: client.id,
    renewalId: renewal.id,
    insurersApproached: insurers.slice(index % 3, (index % 3) + 4),
    quotesReceived: 2 + (index % 3),
    bestQuote,
    targetPremium,
    estimatedSavings: Math.max(0, targetPremium - bestQuote),
    currentStatus: index % 3 === 0 ? 'Negotiation' : index % 3 === 1 ? 'Marketed' : 'Submission Ready',
    pendingQuestions: pendingQuestionsFor(client),
    recommendedInsurer: insurers[(index + 2) % insurers.length],
    decisionRequired: client.priorityLevel === 'Critical' || index % 4 === 0,
  };
});

const claims = clients
  .filter((client) => client.openClaimsCount > 0)
  .slice(0, 12)
  .map((client, index) => {
    const policy = policies.find((item) => item.clientId === client.id);
    const severity = index % 4 === 0 || client.priorityLevel === 'Critical' ? 'High' : index % 3 === 0 ? 'Medium' : 'Low';
    const incurredAmount = Math.round(client.annualPremium * (severity === 'High' ? 0.14 : severity === 'Medium' ? 0.065 : 0.025));
    return {
      id: `CLM-${String(index + 1).padStart(3, '0')}`,
      clientId: client.id,
      policyId: policy.id,
      claimType: claimTypeFor(client, index),
      severity,
      status: severity === 'High' ? 'Executive Review' : index % 2 === 0 ? 'Open' : 'Monitoring',
      incurredAmount,
      reserveAmount: Math.round(incurredAmount * 0.72),
      dateOfLoss: addDays('2026-07-09', -(28 + index * 9)),
      daysOpen: 28 + index * 9,
      executiveReviewRequired: severity === 'High',
      nextAction: severity === 'High' ? 'Prepare executive claim note' : 'Monitor adjuster update',
    };
  });

const compliance = clients
  .filter((client) => client.complianceScore < 94 || client.priorityLevel === 'Critical')
  .slice(0, 14)
  .map((client, index) => ({
    id: `CMP-${String(index + 1).padStart(3, '0')}`,
    clientId: client.id,
    findingType: findingTypeFor(client),
    severity: client.complianceScore < 86 ? 'High' : client.complianceScore < 92 ? 'Medium' : 'Low',
    dueDate: addDays('2026-07-09', index - 2),
    status: index < 2 ? 'Overdue' : index < 8 ? 'Open' : 'In Progress',
    assignedUserId: 'USR-008',
    businessImpact: businessImpactFor(client),
    correctiveAction: correctiveActionFor(client),
  }));

const documents = clients.slice(0, 22).map((client, index) => ({
  id: `DOC-${String(index + 1).padStart(3, '0')}`,
  clientId: client.id,
  documentType: documentTypeFor(client, index),
  status: client.documentCompleteness < 75 ? 'Missing' : client.documentCompleteness < 88 ? 'Needs Review' : 'Approved',
  expiryDate: addDays(client.renewalDate, -5),
  requiredFor: index % 2 === 0 ? 'Renewal Submission' : 'Market Placement',
  uploadedDate: client.documentCompleteness < 75 ? null : addDays('2026-07-09', -(index + 2)),
  missingReason: client.documentCompleteness < 75 ? 'Client has not provided final support file' : '',
  businessImpact: client.documentCompleteness < 75 ? 'Blocks market submission and may delay quote release' : 'Supports renewal readiness',
}));

const tasks = [
  ...renewals.slice(0, 8).map((renewal, index) => {
    const client = byId(clients, renewal.clientId);
    return {
      id: `TSK-${String(index + 1).padStart(3, '0')}`,
      clientId: client.id,
      assignedUserId: renewal.assignedUserId,
      title: renewal.missingItems[0] ? `Resolve ${renewal.missingItems[0]}` : 'Confirm renewal readiness',
      category: 'Renewal',
      priority: client.priorityLevel,
      dueDate: addDays('2026-07-09', index + 1),
      status: index < 2 ? 'Overdue' : 'Open',
      relatedModule: 'Renewals',
      businessImpact: renewal.priorityReason,
    };
  }),
  ...submissions.slice(0, 6).map((submission, index) => ({
    id: `TSK-${String(index + 9).padStart(3, '0')}`,
    clientId: submission.clientId,
    assignedUserId: 'USR-006',
    title: submission.nextAction,
    category: 'Submission',
    priority: submission.completionPercent < 70 ? 'High' : 'Medium',
    dueDate: addDays('2026-07-09', index + 3),
    status: 'Open',
    relatedModule: 'Submissions',
    businessImpact: 'Improves quote readiness and reduces underwriter follow-up',
  })),
  ...compliance.slice(0, 5).map((item, index) => ({
    id: `TSK-${String(index + 15).padStart(3, '0')}`,
    clientId: item.clientId,
    assignedUserId: item.assignedUserId,
    title: item.correctiveAction,
    category: 'Compliance',
    priority: item.severity,
    dueDate: item.dueDate,
    status: item.status,
    relatedModule: 'Compliance',
    businessImpact: item.businessImpact,
  })),
];

const activities = [
  ['CLI-003', 'USR-003', '2026-07-09T14:25:00Z', 'Placement Update', 'Underwriter feedback received on executive jet program', 'Market Placement', 'High'],
  ['CLI-001', 'USR-002', '2026-07-09T13:50:00Z', 'Renewal Update', 'Renewal submitted to market with complete exposure schedule', 'Renewals', 'High'],
  ['CLI-006', 'USR-006', '2026-07-09T12:40:00Z', 'Submission Request', 'Additional instructor records requested from client', 'Submissions', 'Medium'],
  ['CLI-009', 'USR-007', '2026-07-09T11:15:00Z', 'Claim Update', 'Reserve movement flagged for review', 'Claims', 'High'],
  ['CLI-008', 'USR-008', '2026-07-09T10:30:00Z', 'Compliance Update', 'Fuel farm inspection certificate remains outstanding', 'Compliance', 'High'],
  ['CLI-004', 'USR-003', '2026-07-08T16:10:00Z', 'Placement Update', 'Preferred quote received below target premium', 'Market Placement', 'Medium'],
  ['CLI-017', 'USR-010', '2026-07-08T15:35:00Z', 'Document Update', 'Statement of values approved for property placement', 'Documents', 'Medium'],
  ['CLI-022', 'USR-010', '2026-07-08T13:05:00Z', 'Client Update', 'Client health review completed with strong retention outlook', 'Clients', 'Low'],
].map(([clientId, userId, timestamp, activityType, summary, relatedModule, importanceLevel], index) => ({
  id: `ACT-${String(index + 1).padStart(3, '0')}`,
  clientId,
  userId,
  timestamp,
  activityType,
  summary,
  relatedModule,
  importanceLevel,
}));

const businessMetrics = {
  totalManagedPremium: sum(clients, 'annualPremium'),
  estimatedAnnualRevenue: sum(clients, 'estimatedRevenue'),
  renewalRevenuePipeline: sum(renewals, 'premiumAtRenewal'),
  revenueAtRisk: sum(renewals.filter((item) => item.ownerAttentionRequired), 'revenueAtRisk'),
  retentionRate: 94,
  activeClients: clients.length,
  openHighPriorityTasks: tasks.filter((task) => task.status !== 'Completed' && ['High', 'Critical'].includes(task.priority)).length,
  renewalsDue30Days: renewals.filter((item) => item.daysToExpiry <= 30).length,
  renewalsAtRisk: renewals.filter((item) => item.ownerAttentionRequired).length,
  openClaims: claims.filter((claim) => claim.status !== 'Closed').length,
  claimsRequiringReview: claims.filter((claim) => claim.executiveReviewRequired).length,
  averageClientHealth: average(clients, 'clientHealthScore'),
  averageComplianceScore: average(clients, 'complianceScore'),
  documentCompletionRate: average(clients, 'documentCompleteness'),
  teamUtilization: average(teamMembers, 'workloadScore'),
  projectedMonthlyRevenue: Math.round(sum(clients, 'estimatedRevenue') / 12),
  policyOptimizationOpportunities: policies.filter((policy) => policy.optimizationOpportunity).length,
  negotiationSavingsOpportunity: sum(negotiations, 'estimatedSavings'),
};

const files = {
  'clients.json': clients,
  'teamMembers.json': teamMembers,
  'policies.json': policies,
  'renewals.json': renewals,
  'submissions.json': submissions,
  'negotiations.json': negotiations,
  'claims.json': claims,
  'compliance.json': compliance,
  'documents.json': documents,
  'tasks.json': tasks,
  'activities.json': activities,
  'businessMetrics.json': businessMetrics,
};

for (const [file, value] of Object.entries(files)) {
  fs.writeFileSync(path.join(dataDir, file), `${JSON.stringify(value, null, 2)}\n`);
}

for (const file of ['aircraft.json', 'pilots.json', 'aiInsights.json', 'marketConditions.json']) {
  const target = path.join(dataDir, file);
  if (fs.existsSync(target)) fs.unlinkSync(target);
}

function sum(items, key) {
  return items.reduce((total, item) => total + Number(item[key] || 0), 0);
}

function average(items, key) {
  return Math.round(sum(items, key) / Math.max(items.length, 1));
}

function byId(items, id) {
  return items.find((item) => item.id === id);
}

function addDays(date, days) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function daysBetween(start, end) {
  return Math.ceil((new Date(`${end}T00:00:00Z`) - new Date(`${start}T00:00:00Z`)) / 86400000);
}

function limitForPolicy(policyType, premium) {
  if (policyType === 'Excess Liability') return 1000000000;
  if (policyType === 'Airport Liability') return 500000000;
  if (policyType === 'Hull and Liability') return premium > 10000000 ? 750000000 : 250000000;
  if (policyType === 'Cyber') return 50000000;
  return 100000000;
}

function deductibleForPolicy(policyType, premium) {
  if (policyType === 'Cyber') return 100000;
  if (policyType === 'Workers Compensation') return 0;
  if (premium > 10000000) return 250000;
  if (premium > 3000000) return 100000;
  return 25000;
}

function opportunityFor(client, policyType) {
  if (client.retentionRisk === 'High') return 'Restructure deductible and limit options before renewal meeting';
  if (policyType === 'Cyber') return 'Bundle cyber controls evidence to improve commission-adjusted terms';
  if (client.documentCompleteness > 90) return 'Use strong submission quality to request preferred pricing';
  return '';
}

function concernFor(client, policyType) {
  if (client.complianceScore < 88) return 'Compliance item may delay binding approval';
  if (client.openClaimsCount > 1) return 'Open claims may affect final pricing';
  if (policyType === 'Property' && client.location.includes('FL')) return 'Catastrophe exposure requires updated values';
  return 'No material coverage concern';
}

function stageFromReadiness(score, days) {
  if (score < 65 || days < 25) return 'At Risk';
  if (score < 75) return 'Data Collection';
  if (score < 85) return 'Submission Ready';
  if (score < 92) return 'Marketed';
  return 'Negotiation';
}

function statusFromScore(score) {
  if (score < 75) return 'Missing Information';
  if (score < 88) return 'Needs Review';
  return 'Complete';
}

function missingItemsFor(client) {
  const items = [];
  if (client.documentCompleteness < 85) items.push('Updated exposure documents');
  if (client.openClaimsCount > 0) items.push('Current loss run');
  if (client.complianceScore < 90) items.push('Compliance corrective action');
  if (client.clientType.includes('Flight')) items.push('Instructor roster');
  if (client.clientType.includes('Helicopter')) items.push('Operations manual supplement');
  return items.slice(0, 3);
}

function priorityReasonFor(client, days) {
  if (client.priorityLevel === 'Critical') return 'Executive attention required due to revenue concentration and open items';
  if (days <= 30) return 'Renewal due inside 30 days';
  if (client.retentionRisk === 'High') return 'Retention risk requires account leadership review';
  return 'Routine renewal tracking';
}

function concernsForSubmission(client) {
  const concerns = [];
  if (client.openClaimsCount > 0) concerns.push('Open claims require concise loss narrative');
  if (client.documentCompleteness < 80) concerns.push('Document gaps may slow quote release');
  if (client.complianceScore < 90) concerns.push('Compliance findings may create subjectivities');
  return concerns.length ? concerns : ['Submission quality is aligned with market expectations'];
}

function nextSubmissionAction(client, completionPercent) {
  if (completionPercent < 70) return 'Request missing client documents';
  if (client.openClaimsCount > 0) return 'Attach updated claims narrative';
  return 'Release submission to selected markets';
}

function pendingQuestionsFor(client) {
  const questions = [];
  if (client.openClaimsCount > 0) questions.push('Can the client provide a current loss narrative?');
  if (client.documentCompleteness < 85) questions.push('When will the final exposure schedule be uploaded?');
  if (client.complianceScore < 90) questions.push('Has the corrective action plan been approved?');
  return questions.length ? questions : ['Confirm final premium indication acceptance.'];
}

function claimTypeFor(client, index) {
  if (client.clientType === 'FBO') return 'Ground handling liability';
  if (client.clientType === 'Helicopter Operator') return 'Operational incident';
  if (client.clientType === 'Flight School') return 'Training aircraft damage';
  if (client.clientType === 'Airport') return 'Premises liability';
  return index % 2 === 0 ? 'Aircraft physical damage' : 'Passenger liability allegation';
}

function findingTypeFor(client) {
  if (client.documentCompleteness < 80) return 'Document completeness';
  if (client.clientType === 'Airport' || client.clientType === 'FBO') return 'Facility certificate';
  if (client.clientType === 'MRO') return 'Quality control evidence';
  return 'Operational compliance';
}

function businessImpactFor(client) {
  if (client.priorityLevel === 'Critical') return 'Could delay renewal decision and increase revenue at risk';
  if (client.retentionRisk === 'High') return 'May weaken retention position during renewal';
  return 'May create underwriting follow-up if unresolved';
}

function correctiveActionFor(client) {
  if (client.documentCompleteness < 80) return 'Collect missing renewal support documents';
  if (client.complianceScore < 88) return 'Confirm corrective action plan with client leadership';
  return 'Upload evidence and mark control ready for review';
}

function documentTypeFor(client, index) {
  if (client.clientType === 'Flight School') return 'Instructor Roster';
  if (client.clientType === 'Airport') return 'Facility Inspection Certificate';
  if (client.clientType === 'FBO') return 'Statement of Values';
  if (client.clientType === 'MRO') return 'Quality Manual';
  if (index % 3 === 0) return 'Aircraft Schedule';
  if (index % 3 === 1) return 'Loss Runs';
  return 'Safety Controls Summary';
}
