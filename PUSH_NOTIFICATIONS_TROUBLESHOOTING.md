# Push Notifications Troubleshooting Guide

## Overview
This guide helps you troubleshoot push notification issues in the Retenza PWA.

## Prerequisites
1. **VAPID Keys**: You must have valid VAPID keys configured
2. **HTTPS**: Push notifications only work over HTTPS (except localhost for development)
3. **Service Worker**: The service worker must be properly registered
4. **Permissions**: User must grant notification permissions

## Quick Setup

### 1. Generate VAPID Keys
```bash
pnpm run generate:vapid
```

### 2. Add to Environment Variables
Create a `.env.local` file in your project root:
```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
```

### 3. Restart Development Server
```bash
pnpm run dev
```

## Testing Push Notifications

### 1. Use the Debug Page
Navigate to `/debug-push` to test push notifications step by step.

### 2. Check Browser Console
Look for these log messages:
- "Service Worker installing..."
- "Service Worker activating..."
- "Service Worker activated"
- "Push event received:"
- "Push data parsed as JSON:"

### 3. Check Service Worker Status
In Chrome DevTools:
1. Go to Application tab
2. Click on Service Workers
3. Verify `/sw-standalone.js` is registered and active

## Common Issues & Solutions

### Issue 1: "VAPID keys not configured"
**Symptoms**: Error in console about missing VAPID keys
**Solution**: 
1. Generate VAPID keys using `pnpm run generate:vapid`
2. Add them to `.env.local`
3. Restart the development server

### Issue 2: "Service Worker registration failed"
**Symptoms**: Service worker not registering
**Solution**:
1. Check if the service worker file exists at `/public/sw-standalone.js`
2. Verify the service worker has proper scope (`/`)
3. Check browser console for specific errors

### Issue 3: "Notification permission denied"
**Symptoms**: User denied notification permissions
**Solution**:
1. Ask user to manually enable notifications in browser settings
2. For Chrome: Settings > Privacy and security > Site Settings > Notifications
3. For Firefox: Settings > Privacy & Security > Permissions > Notifications

### Issue 4: "Push event received but no notification shown"
**Symptoms**: Service worker receives push but no notification appears
**Solution**:
1. Check if notifications are enabled in browser settings
2. Verify the notification payload format
3. Check if the device is in "Do Not Disturb" mode

### Issue 5: "Notifications only work in app, not when closed"
**Symptoms**: Notifications work when app is open but not when closed
**Solution**:
1. Ensure the PWA is properly installed
2. Check if the service worker is active
3. Verify the service worker has proper scope

## Mobile-Specific Issues

### Android
1. **Chrome**: Ensure Chrome is set as default browser
2. **Permissions**: Check Android notification permissions
3. **Battery Optimization**: Disable battery optimization for the app

### iOS
1. **Safari**: Push notifications only work in Safari, not in standalone PWA mode
2. **Permissions**: Check iOS notification permissions
3. **Focus Mode**: Ensure Focus mode allows notifications

## Debugging Steps

### Step 1: Check Environment
```bash
# Verify VAPID keys are loaded
echo $NEXT_PUBLIC_VAPID_PUBLIC_KEY
echo $VAPID_PRIVATE_KEY
```

### Step 2: Check Service Worker
1. Open DevTools > Application > Service Workers
2. Look for `/sw-standalone.js`
3. Check if it's active and has no errors

### Step 3: Test Subscription
1. Go to `/debug-push`
2. Click "Subscribe"
3. Check console for subscription details
4. Verify subscription is saved to database

### Step 4: Test Push
1. Use "Test Direct Push" button
2. Check network tab for API calls
3. Look for push events in service worker console

### Step 5: Check Database
1. Verify subscription is saved in `push_subscriptions` table
2. Check if notifications are being sent to correct endpoints

## API Endpoints

### Subscribe to Push Notifications
```
POST /api/push/subscribe
{
  "businessId": 1,
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "p256dh": "base64_encoded_key",
    "auth": "base64_encoded_auth"
  }
}
```

### Send Push Notification
```
POST /api/push/send
{
  "subscription": {...},
  "notification": {
    "title": "Test",
    "body": "Test message",
    "data": {...}
  }
}
```

### Send Business Notification
```
POST /api/business/notifications/custom
{
  "businessId": 1,
  "title": "Test",
  "body": "Test message",
  "type": "custom",
  "data": {...}
}
```

## Environment Variables

### Required
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`: Public VAPID key (exposed to client)
- `VAPID_PRIVATE_KEY`: Private VAPID key (server-side only)

### Optional
- `NODE_ENV`: Set to "development" to disable PWA in dev mode

## Browser Support

### Fully Supported
- Chrome (Android & Desktop)
- Edge (Windows)
- Firefox (Desktop)

### Partially Supported
- Safari (iOS - limited PWA support)
- Firefox (Android - limited PWA support)

### Not Supported
- Internet Explorer
- Old versions of browsers

## Performance Tips

1. **Service Worker Updates**: Use `skipWaiting()` for immediate updates
2. **Cache Strategy**: Implement proper caching for offline support
3. **Notification Limits**: Don't send too many notifications at once
4. **Payload Size**: Keep notification payloads small (< 4KB)

## Security Considerations

1. **VAPID Keys**: Never expose private key to client
2. **HTTPS Only**: Push notifications require HTTPS in production
3. **User Consent**: Always request permission before subscribing
4. **Rate Limiting**: Implement rate limiting for notification sending

## Getting Help

If you're still having issues:

1. Check the browser console for errors
2. Use the debug page at `/debug-push`
3. Verify all environment variables are set
4. Check if the issue is browser-specific
5. Test with different devices/browsers

## Useful Commands

```bash
# Generate VAPID keys
pnpm run generate:vapid

# Check service worker registration
# Open DevTools > Application > Service Workers

# Test push notification
# Navigate to /debug-push

# Check environment variables
cat .env.local
``` 