import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const station = await prisma.station.findUnique({
      where: { stationId: id }
    });

    if (!station) {
      return NextResponse.json({ error: 'Station not found' }, { status: 404 });
    }

    return NextResponse.json(station);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
