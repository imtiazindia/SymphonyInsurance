import { promises as fs } from 'node:fs';
import path from 'node:path';

const DATA_FILES = [
  'activities',
  'aviationRiskIndex',
  'businessMetrics',
  'claims',
  'clients',
  'compliance',
  'documents',
  'negotiations',
  'policies',
  'renewals',
  'submissions',
  'tasks',
  'teamMembers',
];

let cachedData;
let cachedAt = 0;
const CACHE_MS = 30_000;

async function readJson(name) {
  const filePath = path.join(process.cwd(), 'src', 'data', `${name}.json`);
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

export async function loadBusinessData() {
  const now = Date.now();
  if (cachedData && now - cachedAt < CACHE_MS) {
    return cachedData;
  }

  const entries = await Promise.all(DATA_FILES.map(async (name) => [name, await readJson(name)]));
  cachedData = Object.fromEntries(entries);
  cachedAt = now;
  return cachedData;
}
