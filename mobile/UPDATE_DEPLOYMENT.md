# Updating the 3DPSMS PWA Deployment

Follow this checklist each time you ship changes to the mobile experience.

## 1. Update configuration (only if the API host changes)

- Edit `mobile/app.json`.
- Set `expo.extra.apiBaseUrl` to the correct HTTPS endpoint (for example `https://app.theprintkid.store/api`).
- Save the file.

## 2. Rebuild the web bundle

```bash
cd mobile
npm install             # run once per machine or when dependencies change
npm run web:build       # regenerates the dist/ folder
```

The exported files live in `mobile/dist/`.

## 3. Deploy to the Raspberry Pi

Copy the refreshed bundle to the Pi and replace the web root contents:

```bash
scp -r mobile/dist pi@ezradevs.local:~/3DPSMS/dist
ssh pi@ezradevs.local
sudo cp -r ~/3DPSMS/dist/* /var/www/3dpsms/
sudo systemctl reload nginx
```

(`pi@ezradevs.local` is the example SSH target—swap it for your Pi’s user/host.)

## 4. Confirm the tunnel still works

From any machine:

```bash
curl https://app.theprintkid.store/api/health
```

It should return `{"status":"healthy"}`. If not, check `sudo journalctl -u cloudflared -f` on the Pi.

## 5. Refresh on devices

- Open `https://app.theprintkid.store` in a browser and reload.
- On iOS, if the PWA is installed, swipe it away from the app switcher and reopen so it fetches the latest assets.

That’s it—no need to touch Cloudflare Tunnel or pm2 unless you’re changing infrastructure.***
