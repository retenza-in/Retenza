import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db, customers, customerLoyalty, transactions, loyaltyPrograms } from "@/db";
import type { Tier } from "@/db/schema";
import { getUserFromSession } from "@/lib/session";
import { eq, sql, and, desc } from "drizzle-orm";

export async function GET(_req: NextRequest) {
  const business = await getUserFromSession();
  if (!business) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = business.id;

  const rows = await db
    .select({
      c: customers,
      cl: customerLoyalty,
      lastTxnAt: sql`MAX(${transactions.createdAt})`,
    })
    .from(customers)
    .innerJoin(
      customerLoyalty,
      and(eq(customerLoyalty.customerId, customers.id), eq(customerLoyalty.businessId, businessId))
    )
    .leftJoin(transactions, eq(transactions.customerId, customers.id))
    .groupBy(
      customers.id,
      customerLoyalty.customerId,
      customerLoyalty.points,
      customerLoyalty.currentTierName,
      customerLoyalty.createdAt,
      customerLoyalty.businessId
    )
    .orderBy(desc(customerLoyalty.updatedAt));

  const formatted = rows.map((row) => ({
    id: row.c.id,
    phoneNumber: row.c.phoneNumber,
    name: row.c.name,
    gender: row.c.gender,
    dob: row.c.dob,
    anniversary: row.c.anniversary,
    isSetupComplete: row.c.isSetupComplete,
    createdAt: row.c.createdAt,
    updatedAt: row.c.updatedAt,
    points: row.cl.points,
    currentTierName: row.cl.currentTierName,
    lastTxnAt: row.lastTxnAt,
  }));

  return NextResponse.json({ customers: formatted });
}

export async function POST(req: NextRequest) {
  const business = await getUserFromSession();
  if (!business) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = business.id;
  const body = await req.json() as { phoneNumber?: string };

  const phoneNumber: string | undefined = body?.phoneNumber;
  if (!phoneNumber || typeof phoneNumber !== "string") {
    return NextResponse.json({ error: "phoneNumber required" }, { status: 400 });
  }

  const existing = await db
    .select({
      c: customers,
      cl: customerLoyalty,
    })
    .from(customers)
    .innerJoin(
      customerLoyalty,
      and(eq(customerLoyalty.customerId, customers.id), eq(customerLoyalty.businessId, businessId))
    )
    .where(eq(customers.phoneNumber, phoneNumber))
    .limit(1);

  if (existing.length) {
    const c = existing[0].c;
    return NextResponse.json({
      added: false,
      customerId: c.id,
      customer: {
        id: c.id,
        phoneNumber: c.phoneNumber,
        name: c.name,
      },
    });
  }

  const globalCustomer = await db
    .select()
    .from(customers)
    .where(eq(customers.phoneNumber, phoneNumber))
    .limit(1);

  const customer = globalCustomer[0];
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const programArr = await db
    .select()
    .from(loyaltyPrograms)
    .where(eq(loyaltyPrograms.businessId, businessId))
    .limit(1);

  let program = programArr[0];
  if (!program) {
    const bronzeTier: Tier = { id: 1, name: "Bronze", pointsToUnlock: 0, rewards: [] };
    const ins = await db
      .insert(loyaltyPrograms)
      .values({
        businessId: businessId,
        pointsRate: 1,
        tiers: [bronzeTier],
      })
      .returning();
    program = ins[0];
  } else {
    const bronzeExists = program.tiers.some((t: unknown) => (t as { name: string })?.name?.toLowerCase() === "bronze");
    if (!bronzeExists) {
      const nextId = program.tiers.length ? Math.max(...program.tiers.map((t: unknown) => (t as { id: number })?.id ?? 0)) + 1 : 1;
      const bronzeTier: Tier = { id: nextId, name: "Bronze", pointsToUnlock: 0, rewards: [] };
      const upd = await db
        .update(loyaltyPrograms)
        .set({ tiers: [...program.tiers, bronzeTier] })
        .where(eq(loyaltyPrograms.businessId, businessId))
        .returning();
      program = upd[0];
    }
  }

  const inserted = await db
    .insert(customerLoyalty)
    .values({
      customerId: customer.id,
      businessId: businessId,
      points: 0,
      currentTierName: "Bronze",
    })
    .returning();

  return NextResponse.json({
    added: true,
    customerId: customer.id,
    customer: {
      id: customer.id,
      phoneNumber: customer.phoneNumber,
      name: customer.name,
    },
    loyalty: inserted[0],
  });
}