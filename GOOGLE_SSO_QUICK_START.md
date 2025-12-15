# Google SSO Quick Start (5 Minutes)

## TL;DR - Get It Running Fast

### Step 1: Google Cloud Setup (2 mins)

1. Go to https://console.cloud.google.com
2. Create new project → name it "Tutors on Henry"
3. Go to APIs & Services → Library
4. Search and enable "Google+ API"
5. Go to Credentials → Create OAuth 2.0 (Web Application)
6. Add redirect URI: `http://localhost:3000/auth/google/callback`
7. Copy your **Client ID** and **Client Secret**

### Step 2: Update Environment (1 min)

Add to your `.env` file:
```env
GOOGLE_CLIENT_ID=paste_your_client_id_here
GOOGLE_CLIENT_SECRET=paste_your_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

### Step 3: Run Server (1 min)

```bash
npm run dev
```

### Step 4: Test (1 min)

1. Visit http://localhost:3000/login
2. Click "Continue with Google"
3. Sign in with any Google account
4. Done! 🎉

## What Just Happened

✅ User authenticated via Google
✅ New user account created in database
✅ Session created and user logged in
✅ Redirected to appropriate dashboard

## For Production

Change:
```env
GOOGLE_CALLBACK_URL=https://yourdomain.com/auth/google/callback
```

And add that URL to Google Cloud Console.

## That's It!

Users can now:
- Sign up with Google
- Sign in with Google
- Link Google to existing email accounts

Full documentation: See `GOOGLE_SSO_SETUP.md`
