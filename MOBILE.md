# Sicklecare mobile apps (Android and iPhone)

The apps are this same website wrapped with Capacitor. One codebase, three places to use it.
Medicine reminders are scheduled on the phone itself, so they work when the app is closed.

## You need
- Node and npm (check capacitorjs.com/docs/getting-started/environment-setup for the versions Capacitor 8 needs)
- Android: Android Studio, and a Google Play developer account (one-time fee)
- iPhone: a Mac with Xcode, and an Apple Developer account (yearly fee)

## First time
1. Open `capacitor.config.json` and change `appId` to your own reverse-domain name, such as `org.yourname.sicklecare`. It is permanent once you publish.
2. `npm install`
3. `npx cap add android` (and, on a Mac, `npx cap add ios`)
4. Make app icons and splash screens from the pictures in `assets/`:
   `npx @capacitor/assets generate --iconBackgroundColor '#c4234f' --splashBackgroundColor '#c4234f'`
5. `npm run android` builds the site, copies it into the app, and opens Android Studio. Press Run to try it on a phone or emulator. Use `npm run ios` for iPhone.

## After every change to the website
`npm run android` (or `npm run ios`) again.

## Publishing
- Android: in Android Studio use Build, then Generate Signed App Bundle. Upload it in the Google Play Console. Keep your signing key safe and backed up.
- iPhone: in Xcode use Product, then Archive, then upload to App Store Connect.
- Both stores need your privacy policy link (your site's /privacy page), a health-data declaration, screenshots, and a description.
- Both review health apps more closely. Expect questions about the symptom checker and your medical disclaimer.
