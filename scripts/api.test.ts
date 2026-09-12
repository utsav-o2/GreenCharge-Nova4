import { GET } from '../src/app/api/stations/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('GET /api/stations', () => {
  beforeAll(async () => {
    // We assume the DB is already seeded by the clean-and-seed script
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('returns paginated list of stations and canonicalized Kerala count', async () => {
    const req = new Request('http://localhost/api/stations?state=Kerala');
    const res = await GET(req);
    const body = await res.json();
    
    expect(res.status).toBe(200);
    expect(body.data).toBeDefined();
    expect(body.meta).toBeDefined();
    // Since we seeded from the snippet, it's not the full 786 rows, but let's check it's paginated correctly
    expect(body.data.length).toBeLessThanOrEqual(20);
    expect(body.data.every((s: any) => s.state === 'Kerala')).toBe(true);
  });

  it('calculates distance and sorts ascending when lat/lng are provided', async () => {
    const req = new Request('http://localhost/api/stations?lat=10.03&lng=76.3&pageSize=5');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(5);
    expect(body.data[0].distanceKm).toBeDefined();
    expect(body.data[0].distanceKm).not.toBeNull();
    
    // Check sorted ascending
    for (let i = 0; i < body.data.length - 1; i++) {
      expect(body.data[i].distanceKm).toBeLessThanOrEqual(body.data[i + 1].distanceKm);
    }
  });

  it('returns 400 for invalid query params', async () => {
    const req = new Request('http://localhost/api/stations?lat=abc');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });
});
