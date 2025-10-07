# 3DPSMS Mobile (Expo)

Mobile companion app for the 3D Print Stall Management System. Built with Expo + React Native so you can log sales, monitor inventory, and review dashboards directly on your iPhone while trading.

## Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`) or use `npx expo`
- Access to the existing 3DPSMS API (defaults to `http://localhost:4000/api`)
- For physical devices, Expo Go **SDK 54** (latest App Store build)

## Getting Started

```bash
# from the repository root
cd mobile
rm -rf node_modules package-lock.json
npm install

# start the Expo dev server (polling avoids macOS watch limits)
npm run start
```

After `npm run start`, the Expo CLI shows a QR code. Open the Expo Go app on iOS/Android, tap **Scan QR Code**, and point it at the terminal. The project now targets the dependency versions expected by Expo SDK 54, so it runs in the latest Expo Go release. To test locally without a phone, press `i`/`a` in the Expo CLI to launch the iOS/Android simulators (Xcode/Android Studio required).

### Pointing at a remote API

The mobile client reads its API base URL from `app.json`:

```json
{
  "expo": {
    "extra": {
      "apiBaseUrl": "http://192.168.1.4:4000/api"
    }
  }
}
```

Change `apiBaseUrl` to a host/IP that your phone can reach (for example, your laptop's LAN IP or a deployed server) before testing on-device.

## Features

- **Dashboard tab** – mirrors the web dashboard: today's session, 7-day revenue trend, low-stock alerts, and recent sales.
- **Sales tab** – switch between sessions, record cash/card sales, auto-updates inventory and revenue totals, start new sessions on the go.
- **Inventory tab** – quick reference for stock levels, pricing, and lifetime performance per SKU.

All networking reuses the existing REST API and is cached with React Query.

## Troubleshooting

- `EMFILE: too many open files, watch` – resolved by the default polling-based start scripts. If you install [Watchman](https://facebook.github.io/watchman/), you can drop `EXPO_USE_POLLING=1` for faster reloads.
- "Project is incompatible with this version of Expo Go" – ensure `npm install` pulls Expo SDK 54 dependencies (this repo already pins Expo 54-compatible versions). Reinstalling dependencies after pulling updates is usually enough.
- `PlatformConstants could not be found` – means dependency versions drifted. Remove `node_modules` + `package-lock.json`, reinstall, and restart to ensure you are using the pinned versions shipped with this repo.

## Next Steps

- Add authentication before exposing the API beyond your network.
- Introduce offline queues if you sell in areas with poor reception.
- Build native binaries with `expo prebuild` + `eas build` when you're ready for TestFlight/App Store distribution.
