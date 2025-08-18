import { useState, useEffect, useCallback } from 'react';
import { PushNotificationService, notificationTemplates } from '@/lib/pushNotifications';

interface UsePushNotificationsProps {
    businessId: number;
    businessName: string;
}

export const usePushNotifications = ({ businessId, businessName }: UsePushNotificationsProps) => {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Check if push notifications are supported
    useEffect(() => {
        const checkSupport = () => {
            const supported = 'serviceWorker' in navigator && 'PushManager' in window;
            setIsSupported(supported);
            return supported;
        };

        checkSupport();
    }, []);

    // Check subscription status on mount
    useEffect(() => {
        if (isSupported) {
            void checkSubscriptionStatus();
        }
    }, [isSupported, businessId]);

    const checkSubscriptionStatus = useCallback(async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
        } catch (err) {
            console.error('Error checking subscription status:', err);
        }
    }, []);

    const subscribe = useCallback(async () => {
        if (!isSupported) {
            setError('Push notifications are not supported in this browser');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Request notification permission
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                throw new Error('Notification permission denied');
            }

            // Register our standalone service worker
            const registration = await navigator.serviceWorker.register('/sw-standalone.js');
            await navigator.serviceWorker.ready;

            // Subscribe to push notifications
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: PushNotificationService.getInstance().getVapidPublicKey(),
            });

            // Send subscription to server
            const response = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    businessId,
                    subscription: {
                        endpoint: subscription.endpoint,
                        p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh') ?? new ArrayBuffer(0)))),
                        auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth') ?? new ArrayBuffer(0)))),
                    },
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to subscribe to push notifications');
            }

            setIsSubscribed(true);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to subscribe to push notifications';
            setError(errorMessage);
            console.error('Error subscribing to push notifications:', err);
        } finally {
            setIsLoading(false);
        }
    }, [isSupported, businessId]);

    const unsubscribe = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Get current subscription
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                // Unsubscribe from push manager
                await subscription.unsubscribe();

                // Remove subscription from server
                const response = await fetch('/api/push/subscribe', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ businessId }),
                });

                if (!response.ok) {
                    console.warn('Failed to remove subscription from server');
                }
            }

            setIsSubscribed(false);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to unsubscribe from push notifications';
            setError(errorMessage);
            console.error('Error unsubscribing from push notifications:', err);
        } finally {
            setIsLoading(false);
        }
    }, [businessId]);

    // Helper functions for sending different types of notifications
    const sendPointsEarnedNotification = useCallback(async (points: number) => {
        try {
            const notification = notificationTemplates.pointsEarned(points, businessName);
            await fetch('/api/push/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notification }),
            });
        } catch (err) {
            console.error('Error sending points earned notification:', err);
        }
    }, [businessName]);

    const sendRewardUnlockedNotification = useCallback(async (rewardName: string) => {
        try {
            const notification = notificationTemplates.rewardUnlocked(rewardName, businessName);
            await fetch('/api/push/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notification }),
            });
        } catch (err) {
            console.error('Error sending reward unlocked notification:', err);
        }
    }, [businessName]);

    const sendGoalGradientNudgeNotification = useCallback(async (percentage: number) => {
        try {
            const notification = notificationTemplates.goalGradientNudge(percentage, businessName);
            await fetch('/api/push/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notification }),
            });
        } catch (err) {
            console.error('Error sending goal gradient nudge notification:', err);
        }
    }, [businessName]);

    const sendInactivityWinbackNotification = useCallback(async () => {
        try {
            const notification = notificationTemplates.inactivityWinback(businessName);
            await fetch('/api/push/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notification }),
            });
        } catch (err) {
            console.error('Error sending inactivity winback notification:', err);
        }
    }, [businessName]);

    const sendTrendingMissionsNotification = useCallback(async (missionTitle: string) => {
        try {
            const notification = notificationTemplates.trendingMissions(missionTitle, businessName);
            await fetch('/api/push/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notification }),
            });
        } catch (err) {
            console.error('Error sending trending missions notification:', err);
        }
    }, [businessName]);

    const sendPersonalizedTierRewardsNotification = useCallback(async (tierName: string) => {
        try {
            const notification = notificationTemplates.personalizedTierRewards(tierName, businessName);
            await fetch('/api/push/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notification }),
            });
        } catch (err) {
            console.error('Error sending personalized tier rewards notification:', err);
        }
    }, [businessName]);

    return {
        isSupported,
        isSubscribed,
        isLoading,
        error,
        subscribe,
        unsubscribe,
        sendPointsEarnedNotification,
        sendRewardUnlockedNotification,
        sendGoalGradientNudgeNotification,
        sendInactivityWinbackNotification,
        sendTrendingMissionsNotification,
        sendPersonalizedTierRewardsNotification,
    };
}; 