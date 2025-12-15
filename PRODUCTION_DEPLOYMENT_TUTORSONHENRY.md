# Production Deployment Checklist - tutorsonhenry.org

## Current Status ✅
- Domain: **https://tutorsonhenry.org**
- Server: Running & responding
- SSL: Working (HTTPS)

---

## Google OAuth Setup for Production

### Step 1: Add Callback URL to Google Cloud Console
1. Go to https://console.cloud.google.com
2. Select your project
3. **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Under "Authorized redirect URIs", add:
   ```
   https://tutorsonhenry.org/auth/google/callback
   ```
6. Click **Save**
7. **Wait 5-10 minutes** for changes to propagate

### Step 2: Update Production Environment
Copy `.env.production.example` to `.env` and verify:

```env
NODE_ENV=production
APP_URL=https://tutorsonhenry.org
GOOGLE_CALLBACK_URL=https://tutorsonhenry.org/auth/google/callback
GOOGLE_CLIENT_ID=833363325642-rqbdfl5ac8m6lbuvgtkt1m8a2jlr00q6.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

### Step 3: Deploy
```bash
npm install
NODE_ENV=production npm start
```

### Step 4: Test
1. Go to https://tutorsonhenry.org/login
2. Click "Continue with Google"
3. Accept consent
4. Should redirect to `/profile`

---

## Security Checklist

- [ ] Generate new `SESSION_SECRET` (don't use dev value)
- [ ] Use HTTPS only (no HTTP redirects)
- [ ] MongoDB: Use Atlas (managed cloud database)
- [ ] Email: Use app-specific passwords
- [ ] PayPal: Use production credentials
- [ ] Google OAuth: Registered with production domain
- [ ] Enable HSTS headers (handled by Helmet in production mode)
- [ ] Set secure cookies in production

---

## Quick Debug

If OAuth still fails, check:
```bash
# See what callback URL your app is expecting
curl https://tutorsonhenry.org/auth/debug
```

Should show:
```json
{
  "googleCallbackUrl": "https://tutorsonhenry.org/auth/google/callback"
}
```

---

## Monitoring

After deployment, monitor:
- Google Auth success rate (check server logs)
- User creation from OAuth flow
- Session errors

Sample log to expect:
```
🔐 Google OAuth Profile Received: { id: '...', email: 'user@gmail.com' }
👤 Creating new user from Google profile: user@gmail.com
✅ New Google user created: user@gmail.com
📝 Session saved for user: user@gmail.com
➡️ Redirecting student to /profile
```

---

## Support

If you see "redirect_uri_mismatch" error:
1. Check Google Console has exact URL registered
2. Wait 10 minutes (Google caches settings)
3. Clear browser cache (Cmd+Shift+R)
4. Try again

If users are not created from Google:
1. Check MongoDB connection
2. Check server logs for database errors
3. Ensure `authProvider` field is being saved
