import { NextResponse } from "next/server";
import { db } from "@/db";
import { businesses } from "@/db/schema";

export async function GET() {
    try {
        // Fetch all businesses with their details
        const allBusinesses = await db
            .select({
                id: businesses.id,
                name: businesses.name,
                phone_number: businesses.phoneNumber,
                business_type: businesses.businessType,
                address: businesses.address,
                description: businesses.description,
                approved: businesses.approved,
                created_at: businesses.createdAt,
                is_setup_complete: businesses.isSetupComplete,
            })
            .from(businesses)
            .orderBy(businesses.createdAt);

        return NextResponse.json({
            success: true,
            businesses: allBusinesses,
        });
    } catch (error) {
        console.error("Error fetching businesses:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch businesses" },
            { status: 500 }
        );
    }
} 