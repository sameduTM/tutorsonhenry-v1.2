# Production Callback URL Quick Reference

## TL;DR - What to Change for Production

### Before Production
```
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback  ❌
APP_URL=http://localhost:3000                                    ❌
```

### For Production  
```
GOOGLE_CALLBACK_URL=https://yourdomain.com/auth/google/callback  ✅
APP_URL=https://yourdomain.com                                    ✅
```

## The 3 Steps

### 1️⃣ Register Callback URL in Google Console
- Go to: https://console.cloud.google.com
- Add this URL: `https://yourdomain.com/auth/google/callback`
- Click **Save**

### 2️⃣ Update .env File
```bash
NODE_ENV=production
APP_URL=https://yourdomain.com
GOOGLE_CALLBACK_URL=https://yourdomain.com/auth/google/callback
```

### 3️⃣ Deploy & Test
```bash
npm start
# Test: https://yourdomain.com/login → Click "Continue with Google"
```

---

## Why This Matters

| Component | Dev | Production | Impact |
|-----------|-----|------------|--------|
| Protocol | `http://` | `https://` | **Google requires HTTPS** |
| Domain | `localhost:3000` | `yourdomain.com` | **Must match Google Console** |
| Redirect URI | `/auth/google/callback` | `/auth/google/callback` | **Must match exactly** |

---

## Common Mistakes ❌

1. **Forgetting HTTPS** → "redirect_uri_mismatch"
2. **Wrong domain** → Login loops forever
3. **Port number in production** → `yourdomain.com:3000` ❌ should be `yourdomain.com` ✅
4. **Trailing slashes** → `yourdomain.com/` ❌ should be `yourdomain.com` ✅

---

## Verify Your Setup

```bash
# Check .env is correct
grep GOOGLE_CALLBACK_URL .env
# Should show: GOOGLE_CALLBACK_URL=https://yourdomain.com/auth/google/callback

# Check domain is accessible
curl -I https://yourdomain.com
# Should return 200, not 404
```
