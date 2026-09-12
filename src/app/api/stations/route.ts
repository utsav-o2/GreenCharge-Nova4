import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

const querySchema = z.object({
  search: z.string().optional(),
  state: z.string().optional(),
  connectorType: z.string().optional(),
  usageType: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  page: z.coerce.number().default(1),
  pageSize: z.coerce.number().default(20),
});

// Haversine distance
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  const d = R * c; // Distance in km
  return d;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters', details: parsed.error.format() }, { status: 400 });
    }

    const { search, state, connectorType, usageType, lat, lng, page, pageSize } = parsed.data;

    let where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { city: { contains: search } },
      ];
    }
    if (state) where.state = state;
    if (connectorType) where.connectorType = connectorType;
    if (usageType) where.usageType = usageType;

    const skip = (page - 1) * pageSize;

    let stations = await prisma.station.findMany({
      where,
    });

    // Haversine
    if (lat !== undefined && lng !== undefined) {
      const withDistance = stations.map(s => ({
        ...s,
        distanceKm: getDistanceFromLatLonInKm(lat, lng, s.latitude, s.longitude)
      }));
      withDistance.sort((a, b) => a.distanceKm - b.distanceKm);
      stations = withDistance as any;
    } else {
      stations = stations.map(s => ({ ...s, distanceKm: null })) as any;
    }

    // Pagination
    const totalCount = stations.length;
    const paginated = stations.slice(skip, skip + pageSize);

    return NextResponse.json({
      data: paginated,
      meta: {
        total: totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize)
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
