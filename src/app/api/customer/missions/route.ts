import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { missions, customerLoyalty, businesses, missionRegistry } from '@/db/schema';
import { getCustomerFromSession } from '@/lib/session';
import { eq, and, sql } from 'drizzle-orm';

export async function GET(_req: NextRequest) {
  try {
    const sessionUser = await getCustomerFromSession();

    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allActiveMissions = await db
      .select({
        id: missions.id,
        businessId: missions.businessId,
        title: missions.title,
        description: missions.description,
        offer: missions.offer,
        applicableTiers: missions.applicableTiers,
        expiresAt: missions.expiresAt,
        filters: missions.filters,
        business_name: businesses.name,
        business_address: businesses.address,
        business_region: businesses.region,
      })
      .from(missions)
      .innerJoin(businesses, eq(missions.businessId, businesses.id))
      .where(and(
        sql`${missions.expiresAt} > now()`,
        eq(missions.isActive, true)
      ));

    // Get customer's completed missions to filter them out
    const completedMissions = await db
      .select({ missionId: missionRegistry.missionId })
      .from(missionRegistry)
      .where(and(
        eq(missionRegistry.customerId, sessionUser.id),
        eq(missionRegistry.status, 'completed')
      ));

    const completedMissionIds = new Set(completedMissions.map(m => m.missionId));

    const eligibleMissions = [];

    const customerLoyaltyRecords = await db.select().from(customerLoyalty)
      .where(eq(customerLoyalty.customerId, sessionUser.id));

    const loyaltyMap = new Map(customerLoyaltyRecords.map(rec => [rec.businessId, rec]));

    for (const mission of allActiveMissions) {
      let isEligible = false;
      if (mission.applicableTiers.includes('all')) {
        isEligible = true;
      }
      else {
        const loyaltyRecord = loyaltyMap.get(mission.businessId);
        if (loyaltyRecord?.currentTierName) {
          if (mission.applicableTiers.includes(loyaltyRecord.currentTierName)) {
            isEligible = true;
          }
        }
      }

      if (isEligible && !completedMissionIds.has(mission.id)) {
        eligibleMissions.push(mission);
      }
    }

    // Group missions by business
    const missionsByCompany = new Map<number, {
      businessId: number;
      business_name: string;
      business_address: string;
      business_region: string;
      missions: typeof eligibleMissions;
    }>();

    for (const mission of eligibleMissions) {
      const companyKey = mission.businessId;
      if (!missionsByCompany.has(companyKey)) {
        missionsByCompany.set(companyKey, {
          businessId: mission.businessId,
          business_name: mission.business_name,
          business_address: mission.business_address ?? '',
          business_region: mission.business_region ?? '',
          missions: []
        });
      }
      const company = missionsByCompany.get(companyKey);
      if (company) {
        company.missions.push(mission);
      }
    }

    const result = Array.from(missionsByCompany.values());
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error fetching missions:', error);
    return NextResponse.json({ error: 'Failed to fetch missions.' }, { status: 500 });
  }
}