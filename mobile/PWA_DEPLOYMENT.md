# 3DPSMS Mobile PWA Deployment

This guide walks through exporting the Expo project as a Progressive Web App (PWA), hosting it on a Raspberry Pi alongside the existing API, and installing it on an iPhone home screen.

## 1. Configure runtime URLs

1. Choose the public address you will expose from the Raspberry Pi (e.g. `https://stall.example.com`).
2. Update the API base URL so the bundler bakes it into the web build:
   ```bash
   cd mobile
   npx expo config --type public --json | jq '.extra.apiBaseUrl'
   ```
   Edit `app.json` and change `expo.extra.apiBaseUrl` to `https://stall.example.com/api` (or whatever domain/port you will serve).
3. For local testing without HTTPS you can temporarily use `http://localhost:4000/api`. Remember to switch back to the real host before exporting for the Pi.

## 2. Build the PWA bundle

```bash
cd mobile
npm install
npm run web:build
```

The static bundle is generated in `mobile/dist`. It includes the manifest, service worker, and prebundled assets.

You can preview it locally with:
```bash
npm run web:preview
```
Then open http://localhost:3000 (or the port shown) in a browser to confirm everything renders.

## 3. Prepare the Raspberry Pi

1. Copy the contents of `mobile/dist/` to the Pi (for example via `scp -r mobile/dist pi-user@raspberrypi:~/3dpsms-pwa`).
2. Install and configure dependencies on the Pi:
   ```bash
   sudo apt update
   sudo apt install nginx certbot python3-certbot-nginx nodejs npm -y
   ```
3. **API**: Deploy the Express server on the Pi. From the repository root on the Pi:
   ```bash
   cd 3DPSMS/server
   npm install
   npm run start
   ```
   Wrap it in a `systemd` unit or `pm2` process so it restarts automatically. Make sure it listens on `http://localhost:4000`.
4. **Static PWA**: configure nginx to serve the exported bundle and proxy `/api` to the Express server. Create `/etc/nginx/sites-available/3dpsms`:
   ```nginx
   server {
     listen 80;
     server_name stall.example.com;

     root /home/pi/3dpsms-pwa;
     index index.html;

     location /api/ {
       proxy_pass http://localhost:4000/api/;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
     }

     location / {
       try_files $uri $uri/ /index.html;
     }
   }
   ```
   Then enable the site and reload nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/3dpsms /etc/nginx/sites-enabled/3dpsms
   sudo nginx -t
   sudo systemctl reload nginx
   ```
5. **HTTPS**: Issue a Let’s Encrypt certificate once your domain points to the Pi (set up router port forwarding first):
   ```bash
   sudo certbot --nginx -d stall.example.com
   ```
   Certbot will update nginx to redirect HTTP to HTTPS automatically and set up renewals.

Whenever you rebuild the PWA, sync the new `dist` directory to `/home/pi/3dpsms-pwa` and reload nginx.

## 4. Install on iPhone

1. On the iPhone, open Safari and navigate to `https://stall.example.com`.
2. Tap the Share icon → “Add to Home Screen”.
3. Confirm the shortcut name (e.g. “3DPSMS”) and tap Add. The icon now launches the PWA full-screen just like a native app.

## 5. Maintenance tips

- Re-run `npm run web:build` after changing the mobile code. Deploy the updated `dist` folder to the Pi.
- Keep the Pi’s OS and nginx packages patched (`sudo apt upgrade`).
- Monitor the SQLite database (`server/data/3dpsms.sqlite`). Consider regular backups (e.g. nightly `sqlite3` dump).
- If you change the API hostname/port, update `expo.extra.apiBaseUrl` in `app.json` before the next build.

With this setup you avoid the Apple Developer program entirely while keeping the rich Expo UI you already have.
