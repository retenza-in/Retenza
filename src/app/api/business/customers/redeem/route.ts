import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/session';
import { db } from '@/server/db';
import { customerLoyalty, transactions, notifications, rewardRedemptions } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest) {
    try {
        const business = await getUserFromSession();
        if (!business) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json() as { customer_id: number; bill_amount: number; redeemed_rewards: Array<{ reward_id: string; reward_type: string; value: number }> };
        const { customer_id, bill_amount, redeemed_rewards } = body;

        if (!customer_id || !bill_amount || !redeemed_rewards || !Array.isArray(redeemed_rewards)) {
            return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
        }

        // Calculate total discount
        let totalDiscount = 0;
        redeemed_rewards.forEach((reward: { reward_id: string; reward_type: string; value: number }) => {
            totalDiscount += reward.value ?? 0;
        });

        // Calculate final amount
        const finalAmount = Math.max(0, bill_amount - totalDiscount);

        // Calculate points to award (1:1 ratio for now)
        const pointsToAward = Math.floor(bill_amount);

        // Start transaction
        await db.transaction(async (tx) => {
            // Get current loyalty data
            const currentLoyalty = await tx.select()
                .from(customerLoyalty)
                .where(and(
                    eq(customerLoyalty.customer_id, customer_id),
                    eq(customerLoyalty.business_id, business.id)
                ))
                .limit(1);

            if (currentLoyalty.length === 0) {
                throw new Error('Customer loyalty data not found');
            }

            const loyaltyData = currentLoyalty[0];

            // Update customer loyalty points
            await tx.update(customerLoyalty)
                .set({
                    points: loyaltyData.points + pointsToAward
                })
                .where(and(
                    eq(customerLoyalty.customer_id, customer_id),
                    eq(customerLoyalty.business_id, business.id)
                ));

            // Record the transaction
            const transactionResult = await tx.insert(transactions).values({
                customer_id,
                business_id: business.id,
                bill_amount: bill_amount.toFixed(2), // Store as decimal
                points_awarded: pointsToAward
            }).returning({ id: transactions.id });

            const transactionId = transactionResult[0].id;

            // Record each redeemed reward
            for (const reward of redeemed_rewards) {
                await tx.insert(rewardRedemptions).values({
                    customer_id,
                    business_id: business.id,
                    reward_id: reward.reward_id,
                    reward_type: reward.reward_type,
                    reward_value: reward.value.toFixed(2), // Store as decimal
                    transaction_id: transactionId
                });
            }

            // Create notification for customer
            await tx.insert(notifications).values({
                customer_id,
                business_id: business.id,
                type: 'reward_redeemed',
                title: 'Rewards Redeemed!',
                body: `You've redeemed rewards worth ₹${Number(totalDiscount).toFixed(2)} on your purchase of ₹${Number(bill_amount).toFixed(2)}. You earned ${pointsToAward} points!`,
                data: {
                    bill_amount,
                    total_discount: totalDiscount,
                    final_amount: finalAmount,
                    points_awarded: pointsToAward,
                    redeemed_rewards
                }
            });
        });

        return NextResponse.json({
            success: true,
            message: 'Transaction processed successfully',
            data: {
                customer_id,
                bill_amount,
                total_discount: totalDiscount,
                final_amount: finalAmount,
                points_awarded: pointsToAward,
                redeemed_rewards
            }
        });

    } catch (error) {
        console.error("Error processing reward redemption:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
} 