# Push Notifications Setup Guide

This guide will help you set up push notifications for your Retenza PWA application.

## Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database
- HTTPS environment (required for service workers and push notifications)

## 1. Install Dependencies

```bash
pnpm install
```

## 2. Generate VAPID Keys

VAPID (Voluntary Application Server Identification) keys are required for push notifications. Generate them using:

```bash
npx web-push generate-vapid-keys
```

This will output something like:
```
=======================================
Public Key:
BEl62iUYgUivxIkv69gVi8uiilSxr...

Private Key:
Private key, keep it secret!...
=======================================
```

## 3. Environment Configuration

Create a `.env.local` file in your project root and add:

```env
# VAPID Keys for Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-vapid-public-key-here"
VAPID_PRIVATE_KEY="your-vapid-private-key-here"

# Update the email in src/app/api/push/send/route.ts
# Replace 'mailto:your-email@example.com' with your actual email
```

## 4. Database Migration

Run the database migration to create the required tables:

```bash
pnpm db:push
```

Or if you prefer to run the specific migration:

```bash
psql -d your_database_name -f drizzle/0004_push_notifications.sql
```

## 5. Update Service Worker

The service worker (`public/sw.js`) has been updated to handle push notifications. Make sure it's properly registered in your app.

## 6. Test Push Notifications

1. Start your development server: `pnpm dev`
2. Open the app in a supported browser (Chrome, Edge, Firefox)
3. Navigate to a business page and look for the notification bell icon
4. Click to enable notifications
5. Grant permission when prompted
6. Test sending notifications from the business panel

## 7. Production Deployment

For production, ensure:

1. Your domain uses HTTPS
2. VAPID keys are properly set in environment variables
3. Service worker is accessible at `/sw.js`
4. Manifest.json is properly configured

## 8. Notification Types Available

The system supports the following notification types:

- **Points Earned**: Automatic notifications when customers earn points
- **Reward Unlocked**: Automatic notifications when rewards are unlocked
- **Goal Gradient Nudge**: Encourages progress towards next reward (80% threshold)
- **Inactivity Win-Back**: Re-engages inactive customers
- **Trending Missions**: Highlights popular challenges
- **Personalized Tier Rewards**: Announces exclusive tier benefits
- **Custom Notifications**: Business-defined messages
- **Promotional**: Special offers and deals
- **Urgent**: Important announcements

## 9. Troubleshooting

### Common Issues

1. **"Push notifications are not supported"**
   - Ensure you're using HTTPS
   - Check if the browser supports service workers and push API

2. **"Failed to subscribe to push notifications"**
   - Verify VAPID keys are correctly set
   - Check browser console for errors
   - Ensure service worker is properly registered

3. **Notifications not showing**
   - Check browser notification permissions
   - Verify service worker is active
   - Check browser console for errors

### Debug Steps

1. Open browser DevTools
2. Go to Application/Storage tab
3. Check Service Workers section
4. Verify push subscription exists
5. Check for any console errors

## 10. Security Considerations

- Keep VAPID private key secure
- Never expose private keys in client-side code
- Validate all notification data on the server
- Implement rate limiting for notification sending
- Respect user preferences and unsubscribe requests

## 11. Performance Optimization

- Batch notifications when possible
- Use notification tags to prevent duplicates
- Implement smart scheduling for non-urgent notifications
- Monitor notification delivery rates

## Support

If you encounter issues, check:
1. Browser console for errors
2. Network tab for failed API calls
3. Service worker status in DevTools
4. Database connection and table structure 