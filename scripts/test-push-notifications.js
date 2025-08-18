#!/usr/bin/env node

/**
 * Test script for push notifications
 * Run this after setting up VAPID keys to test the notification system
 */

const webpush = require('web-push');

// Configuration
const vapidKeys = {
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'your-vapid-public-key',
    privateKey: process.env.VAPID_PRIVATE_KEY || 'your-vapid-private-key',
};

webpush.setVapidDetails(
    'mailto:your-email@example.com', // Replace with your email
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

// Test subscription (you'll need to get this from the browser)
const testSubscription = {
    endpoint: 'your-subscription-endpoint',
    keys: {
        p256dh: 'your-p256dh-key',
        auth: 'your-auth-key'
    }
};

// Test notification
const testNotification = {
    title: 'Test Notification',
    body: 'This is a test push notification from Retenza!',
    data: {
        type: 'test',
        timestamp: new Date().toISOString()
    }
};

async function testPushNotification() {
    try {
        console.log('🧪 Testing push notification...');
        console.log('📱 VAPID Public Key:', vapidKeys.publicKey ? '✅ Set' : '❌ Missing');
        console.log('🔐 VAPID Private Key:', vapidKeys.privateKey ? '✅ Set' : '❌ Missing');

        if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
            console.log('\n❌ Please set your VAPID keys in environment variables:');
            console.log('   NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key');
            console.log('   VAPID_PRIVATE_KEY=your-private-key');
            return;
        }

        if (testSubscription.endpoint === 'your-subscription-endpoint') {
            console.log('\n⚠️  Please update the test subscription with real values from your browser');
            console.log('   You can get this by enabling notifications in the app and checking the console');
            return;
        }

        console.log('\n📤 Sending test notification...');
        const result = await webpush.sendNotification(
            testSubscription,
            JSON.stringify(testNotification)
        );

        if (result.statusCode === 200 || result.statusCode === 201) {
            console.log('✅ Test notification sent successfully!');
            console.log('📊 Status Code:', result.statusCode);
        } else {
            console.log('❌ Failed to send notification');
            console.log('📊 Status Code:', result.statusCode);
            console.log('📝 Response:', result.body);
        }
    } catch (error) {
        console.error('❌ Error testing push notification:', error.message);

        if (error.statusCode) {
            console.log('📊 Status Code:', error.statusCode);
            console.log('📝 Response:', error.body);
        }
    }
}

// Run the test
testPushNotification(); 