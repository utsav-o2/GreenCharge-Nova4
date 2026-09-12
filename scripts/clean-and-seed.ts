import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { PrismaClient } from '@prisma/client';
import { v5 as uuidv5 } from 'uuid';

export const UUID_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

export function getMedian(values: number[]): number {
  if (values.length === 0) return 0;
  values.sort((a, b) => a - b);
  const half = Math.floor(values.length / 2);
  if (values.length % 2) return values[half];
  return (values[half - 1] + values[half]) / 2.0;
}

export function getDeterministicBays(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return (Math.abs(hash) % 4) + 1; // 1 to 4
}

export function cleanRows(records: any[]) {
  const powerByConnector: Record<string, number[]> = {};
  for (const row of records) {
    const power = parseFloat(row.power_kw);
    if (!isNaN(power)) {
      if (!powerByConnector[row.connector_type]) {
        powerByConnector[row.connector_type] = [];
      }
      powerByConnector[row.connector_type].push(power);
    }
  }

  const medianPowerByConnector: Record<string, number> = {};
  for (const [connector, values] of Object.entries(powerByConnector)) {
    medianPowerByConnector[connector] = getMedian(values);
  }

  const cleanedRecords = [];

  for (const row of records) {
    let name = row.name ? row.name.trim() : '';
    let city = row.city ? row.city.trim() : '';
    let state = row.state ? row.state.trim() : '';
    let connectorType = row.connector_type ? row.connector_type.trim() : '';
    let operator = row.operator || 'Unknown Operator';
    let usageType = row.usage_type || 'Public';
    let lat = parseFloat(row.lat);
    let lng = parseFloat(row.lng);

    let needsReview = false;

    const lowerState = state.toLowerCase();
    if (['keral', 'keraka', 'lerala'].includes(lowerState)) {
      state = 'Kerala';
    } else if (lowerState === 'uttar pradesh') {
      state = 'Uttar Pradesh';
    }

    if (!state) {
      needsReview = true;
    }

    if (connectorType === 'Unknown') {
      needsReview = true;
    }

    let isImputed = false;
    let powerKw = parseFloat(row.power_kw);
    if (isNaN(powerKw)) {
      powerKw = medianPowerByConnector[connectorType] || 0;
      isImputed = true;
    }

    const uuidSeed = `${name}-${lat}-${lng}`;
    const stationId = uuidv5(uuidSeed, UUID_NAMESPACE);
    const totalBays = getDeterministicBays(name);

    cleanedRecords.push({
      stationId,
      name,
      city,
      state,
      latitude: isNaN(lat) ? 0 : lat,
      longitude: isNaN(lng) ? 0 : lng,
      operator,
      usageType,
      connectorType,
      powerKw,
      totalBays,
      needsReview,
      isImputed,
    });
  }

  return cleanedRecords;
}

async function main() {
  const prisma = new PrismaClient();
  const filePath = path.join(process.cwd(), 'data/raw/Indian_EV_Stations_Simplified.csv');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  const cleanedRecords = cleanRows(records);

  let totalProcessed = 0;
  let flaggedCount = 0;
  let imputedPowerCount = 0;

  for (const record of cleanedRecords) {
    const { isImputed, ...dbRecord } = record;
    
    await prisma.station.upsert({
      where: { stationId: record.stationId },
      update: dbRecord,
      create: dbRecord,
    });

    totalProcessed++;
    if (record.needsReview) {
      flaggedCount++;
    }
    if (isImputed) {
      imputedPowerCount++;
    }
  }

  console.log(`✅ Seeding complete`);
  console.log(`- Total rows processed: ${totalProcessed}`);
  console.log(`- Rows flagged for review: ${flaggedCount}`);
  console.log(`- Rows with imputed power: ${imputedPowerCount}`);
  await prisma.$disconnect();
}

if (process.argv[1]?.endsWith('clean-and-seed.ts')) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
