# iOS Push Notifications via FCM

This document explains what's required to add iOS push notification support to the ClockTracker Capacitor app using Firebase Cloud Messaging (FCM).

## Prerequisites

- **Apple Developer Program membership** ($99/year) — required for push notification entitlements
- **Firebase project** (already set up for Android)

## Steps

### 1. Apple Developer Console

1. Sign in at [developer.apple.com](https://developer.apple.com)
2. Go to **Certificates, Identifiers & Profiles**
3. Create an **App ID** with bundle identifier `app.clocktracker.mobile`
4. Enable the **Push Notifications** capability on the App ID
5. Create an **APNs Key** (Apple Push Notification service):
   - Go to **Keys** > **Create a Key**
   - Enable **Apple Push Notifications service (APNs)**
   - Download the `.p8` key file (you can only download it once)
   - Note the **Key ID** and your **Team ID**

### 2. Firebase Console

1. In your Firebase project, go to **Project Settings** > **Cloud Messaging**
2. Under **Apple app configuration**, upload the APNs key:
   - Upload the `.p8` file
   - Enter the **Key ID** and **Team ID**
3. Add an iOS app to the Firebase project:
   - Bundle ID: `app.clocktracker.mobile`
   - Download `GoogleService-Info.plist`

### 3. Xcode Project Setup

1. Run `npx cap add ios` (if not already done)
2. Place `GoogleService-Info.plist` in `ios/App/App/`
3. Open the Xcode project: `npx cap open ios`
4. In the project target:
   - Go to **Signing & Capabilities**
   - Add the **Push Notifications** capability
   - Add the **Background Modes** capability and check **Remote notifications**
5. Ensure the bundle identifier matches: `app.clocktracker.mobile`

### 4. CocoaPods Dependencies

After `npx cap sync`, the `ios/App/Podfile` should already include `CapacitorPushNotifications`. If not, add it and run `pod install` in `ios/App/`.

Firebase dependencies for iOS are handled automatically by Capacitor's push notifications plugin — no manual Firebase SDK setup is needed. The plugin uses APNs directly, and FCM maps APNs tokens to FCM tokens server-side.

### 5. Code Changes

No additional code changes are required. The existing `plugins/capacitor-push.client.ts` handles:
- Permission requests
- Token registration (FCM token sent to `/api/fcm-token`)
- Notification tap handling

The server-side `sendFcmNotifications` utility sends to all FCM tokens regardless of platform — FCM handles routing to APNs for iOS devices automatically.

### 6. Testing

1. Build for iOS: `npm run cap:ios`
2. You **cannot** test push notifications in the iOS Simulator — a physical device is required
3. Use the Firebase Console's **Cloud Messaging** > **Send test message** to verify delivery
4. Check that tapping a notification navigates to the correct URL

## Notes

- FCM tokens for iOS are different from Android tokens but stored in the same `FcmToken` table
- The `@capacitor/push-notifications` plugin handles the APNs ↔ FCM token exchange automatically
- iOS requires the app to be signed with a provisioning profile that includes push notifications
- The `presentationOptions` in `capacitor.config.ts` (`badge`, `sound`, `alert`) control foreground notification behavior on iOS
