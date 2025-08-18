import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { BusinessNotificationService } from '@/lib/businessNotificationService';

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as { businessId?: number; missionTitle?: string; businessName?: string };
        const { businessId, missionTitle, businessName } = body;

        if (!businessId || !missionTitle || !businessName) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const notificationService = BusinessNotificationService.getInstance();
        await notificationService.sendTrendingMissionsNotification(
            businessId,
            missionTitle,
            businessName
        );

        return NextResponse.json({ success: true, message: 'Trending missions notification sent successfully' });
    } catch (error) {
        console.error('Error sending trending missions notification:', error);
        return NextResponse.json(
            { error: 'Failed to send notification' },
            { status: 500 }
        );
    }
} 