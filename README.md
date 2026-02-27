# KML Upload Page - Texas Air Drone

Single-page React app for uploading KML files via magic link.

## Deployment to Vercel

### 1. Push to GitHub
```bash
cd kml-upload-page
git remote add origin https://github.com/YOUR_USERNAME/tex-air-kml.git
git push -u origin main
```

### 2. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Select your GitHub repo
4. Vercel auto-detects React - just click "Deploy"

### 3. Configure Custom Domain
In Vercel dashboard:
1. Go to Project Settings → Domains
2. Add `texasairdrone.com`
3. Vercel provides DNS instructions
4. SSL is automatic ✅

### 4. Set Base Path (if needed)
If you want it at `/kml` path on existing domain:
- Add to `package.json`: `"homepage": "/kml"`
- Or use Vercel's path rewrites (already in `vercel.json`)

## Test URL Structure
- Magic link: `https://texasairdrone.com/kml?data=NDo3`
- Query param `data` is sent as `magic_token` to webhook

## Webhook Configuration
Set environment variable in Vercel:
```
REACT_APP_WEBHOOK_URL=<your-n8n-webhook-url>
```

### Webhook Payload
- Method: `POST`
- Content-Type: `multipart/form-data`
- Fields: `file`, `filename`, `mime_type`, `magic_token`

## Local Development
```bash
npm start
```

Visit `http://localhost:3000?data=test123` to test
