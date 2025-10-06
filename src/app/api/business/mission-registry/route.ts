import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { missionRegistry, missions, customers } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getUserFromSession } from '@/lib/session';
import { notifications } from '@/db/schema';

// Get all mission registries for a business
export async function GET(req: NextRequest) {
    try {
        const business = await getUserFromSession();
        if (!business) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const customerId = searchParams.get('customerId');

        let whereClause: any = eq(missionRegistry.businessId, business.id);

        if (status) {
            whereClause = and(whereClause, eq(missionRegistry.status, status as 'in_progress' | 'completed' | 'failed'));
        }

        if (customerId) {
            whereClause = and(whereClause, eq(missionRegistry.customerId, parseInt(customerId)));
        }

        const registries = await db
            .select({
                id: missionRegistry.id,
                customerId: missionRegistry.customerId,
                missionId: missionRegistry.missionId,
                status: missionRegistry.status,
                startedAt: missionRegistry.startedAt,
                completedAt: missionRegistry.completedAt,
                discountAmount: missionRegistry.discountAmount,
                discountPercentage: missionRegistry.discountPercentage,
                notes: missionRegistry.notes,
                customerName: customers.name,
                customerPhone: customers.phoneNumber,
                missionTitle: missions.title,
                missionDescription: missions.description,
                missionOffer: missions.offer,
            })
            .from(missionRegistry)
            .innerJoin(customers, eq(missionRegistry.customerId, customers.id))
            .innerJoin(missions, eq(missionRegistry.missionId, missions.id))
            .where(whereClause)
            .orderBy(desc(missionRegistry.startedAt));

        return NextResponse.json({ success: true, registries });
    } catch (error) {
        console.error("Error fetching mission registries:", error);
        return NextResponse.json({ error: "Failed to fetch mission registries" }, { status: 500 });
    }
}

// Start a new mission for a customer
export async function POST(req: NextRequest) {
    try {
        const business = await getUserFromSession();
        if (!business) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json() as { customerId: number; missionId: number };

        if (!body.customerId || !body.missionId) {
            return NextResponse.json({ error: "Missing customerId or missionId" }, { status: 400 });
        }

        // Check if mission is already in progress for this customer
        const existingRegistry = await db
            .select()
            .from(missionRegistry)
            .where(and(
                eq(missionRegistry.customerId, body.customerId),
                eq(missionRegistry.missionId, body.missionId),
                eq(missionRegistry.status, 'in_progress')
            ));

        if (existingRegistry.length > 0) {
            return NextResponse.json({ error: "Mission already in progress for this customer" }, { status: 409 });
        }

        // Create new mission registry
        const newRegistry = await db.insert(missionRegistry).values({
            customerId: body.customerId,
            missionId: body.missionId,
            businessId: business.id,
            status: 'in_progress',
        }).returning();

        return NextResponse.json({ success: true, registry: newRegistry[0] });
    } catch (error) {
        console.error("Error starting mission:", error);
        return NextResponse.json({ error: "Failed to start mission" }, { status: 500 });
    }
}

// Complete a mission (update status and add discount)
export async function PUT(req: NextRequest) {
    try {
        const business = await getUserFromSession();
        if (!business) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json() as {
            registryId: number;
            status: 'completed' | 'failed';
            discountAmount?: number;
            discountPercentage?: number;
            notes?: string;
        };

        if (!body.registryId || !body.status) {
            return NextResponse.json({ error: "Missing registryId or status" }, { status: 400 });
        }

        const updateData: any = {
            status: body.status,
            completedAt: body.status === 'completed' ? new Date() : null,
        };

        if (body.discountAmount !== undefined) {
            updateData.discountAmount = body.discountAmount.toFixed(2);
        }

        if (body.discountPercentage !== undefined) {
            updateData.discountPercentage = body.discountPercentage.toFixed(2);
        }

        if (body.notes !== undefined) {
            updateData.notes = body.notes;
        }

        const updatedRegistry = await db
            .update(missionRegistry)
            .set(updateData)
            .where(and(
                eq(missionRegistry.id, body.registryId),
                eq(missionRegistry.businessId, business.id)
            ))
            .returning();

        if (updatedRegistry.length === 0) {
            return NextResponse.json({ error: "Mission registry not found" }, { status: 404 });
        }

        // If mission is completed, send notification
        if (body.status === 'completed') {
            const registry = updatedRegistry[0];

            // Get mission details for notification
            const missionData = await db.select()
                .from(missions)
                .where(eq(missions.id, registry.missionId))
                .limit(1);

            if (missionData.length > 0) {
                const mission = missionData[0];

                // Send notification about mission completion
                await db.insert(notifications).values({
                    customerId: registry.customerId,
                    businessId: registry.businessId,
                    type: 'mission_completed',
                    title: 'Mission Completed! 🎉',
                    body: `Congratulations! You've completed "${mission.title}" mission and earned ${body.discountAmount ? `₹${body.discountAmount}` : `${body.discountPercentage}%`} discount!`,
                    data: {
                        missionId: registry.missionId,
                        missionTitle: mission.title,
                        missionOffer: mission.offer,
                        discountAmount: body.discountAmount,
                        discountPercentage: body.discountPercentage,
                        completedAt: new Date()
                    }
                });
            }
        }

        return NextResponse.json({ success: true, registry: updatedRegistry[0] });
    } catch (error) {
        console.error("Error updating mission registry:", error);
        return NextResponse.json({ error: "Failed to update mission registry" }, { status: 500 });
    }
} 