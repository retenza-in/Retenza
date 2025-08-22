import { NextResponse } from "next/server";
import * as schema from "@/server/db/schema";

export async function GET() {
    try {
        return NextResponse.json({
            success: true,
            message: "Schema imported successfully",
            tables: Object.keys(schema)
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 