import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { missionRegistry, missions } from '@/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCustomerFromSession } from '@/lib/session';

// Get customer's mission registries
export async function GET(req: NextRequest) {
    try {
        const customer = await getCustomerFromSession();
        if (!customer) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');

        let whereClause: any = eq(missionRegistry.customer_id, customer.id);

        if (status) {
            whereClause = and(whereClause, eq(missionRegistry.status, status as 'in_progress' | 'completed' | 'failed'));
        }

        const registries = await db
            .select({
                id: missionRegistry.id,
                mission_id: missionRegistry.mission_id,
                status: missionRegistry.status,
                started_at: missionRegistry.started_at,
                completed_at: missionRegistry.completed_at,
                discount_amount: missionRegistry.discount_amount,
                discount_percentage: missionRegistry.discount_percentage,
                notes: missionRegistry.notes,
                mission_title: missions.title,
                mission_description: missions.description,
                mission_offer: missions.offer,
                mission_filters: missions.filters,
                mission_expiry: missions.expires_at,
            })
            .from(missionRegistry)
            .innerJoin(missions, eq(missionRegistry.mission_id, missions.id))
            .where(whereClause)
            .orderBy(desc(missionRegistry.started_at));

        return NextResponse.json({ success: true, registries });
    } catch (error) {
        console.error("Error fetching customer mission registries:", error);
        return NextResponse.json({ error: "Failed to fetch mission registries" }, { status: 500 });
    }
}

// Start a new mission
export async function POST(req: NextRequest) {
    try {
        const customer = await getCustomerFromSession();
        if (!customer) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json() as { mission_id: number; business_id: number };

        if (!body.mission_id || !body.business_id) {
            return NextResponse.json({ error: "Missing mission_id or business_id" }, { status: 400 });
        }

        // Check if mission is already in progress for this customer
        const existingRegistry = await db
            .select()
            .from(missionRegistry)
            .where(and(
                eq(missionRegistry.customer_id, customer.id),
                eq(missionRegistry.mission_id, body.mission_id),
                eq(missionRegistry.status, 'in_progress')
            ));

        if (existingRegistry.length > 0) {
            return NextResponse.json({ error: "Mission already in progress" }, { status: 409 });
        }

        // Create new mission registry
        const newRegistry = await db.insert(missionRegistry).values({
            customer_id: customer.id,
            mission_id: body.mission_id,
            business_id: body.business_id,
            status: 'in_progress',
        }).returning();

        return NextResponse.json({ success: true, registry: newRegistry[0] });
    } catch (error) {
        console.error("Error starting mission:", error);
        return NextResponse.json({ error: "Failed to start mission" }, { status: 500 });
    }
} 