# Production Deployment Guide - Google OAuth & Callback URL

## Critical: Callback URL Configuration

### The Issue
- **Development:** `http://localhost:3000/auth/google/callback` ✅
- **Production:** Must use your actual domain with HTTPS!

### What You Need to Change

#### 1. **Google OAuth App Registration (Google Cloud Console)**

Go to: https://console.cloud.google.com/

1. Select your project
2. Go to **Credentials** → **OAuth 2.0 Client IDs**
3. Click on your OAuth app
4. Add **both** callback URLs in "Authorized redirect URIs":
   ```
   http://localhost:3000/auth/google/callback
   https://yourdomain.com/auth/google/callback
   ```
5. **Save changes**

#### 2. **Update Your `.env` File for Production**

```bash
# Copy the production template
cp .env.production.example .env

# Then edit .env and update these values:
NODE_ENV=production
APP_URL=https://yourdomain.com
GOOGLE_CALLBACK_URL=https://yourdomain.com/auth/google/callback
MONGODB_URI=your-production-mongodb-uri
SESSION_SECRET=your-new-secure-random-string
```

#### 3. **Environment-Aware Callback URL**

The application now automatically builds the callback URL from `APP_URL`:

```javascript
// config/passport.js
callbackURL: process.env.GOOGLE_CALLBACK_URL || `${process.env.APP_URL || 'http://localhost:3000'}/auth/google/callback`
```

**Priority order:**
1. Uses `GOOGLE_CALLBACK_URL` if explicitly set (preferred)
2. Falls back to `APP_URL/auth/google/callback`
3. Falls back to `http://localhost:3000/auth/google/callback` (development default)

---

## Step-by-Step Production Deployment

### Step 1: Create Production Environment File
```bash
cp .env.production.example .env.production
nano .env.production
```

### Step 2: Update Key Variables
```dotenv
NODE_ENV=production
APP_URL=https://tutorsonhenry.com (or your actual domain)
GOOGLE_CALLBACK_URL=https://tutorsonhenry.com/auth/google/callback
GOOGLE_CLIENT_ID=your-production-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-production-secret
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/db
SESSION_SECRET=generate-new-strong-random-string
```

### Step 3: Start Application with Production Env
```bash
# Using .env.production
NODE_ENV=production npm start

# Or with environment variables
export NODE_ENV=production
export APP_URL=https://yourdomain.com
npm start
```

### Step 4: Test Google Login
1. Go to `https://yourdomain.com/login`
2. Click "Continue with Google"
3. Accept consent
4. Should redirect to `/profile`

---

## Common Issues & Fixes

### ❌ "Redirect URI mismatch" error
**Cause:** Callback URL in Google Console doesn't match your app

**Fix:**
1. Go to Google Cloud Console → Credentials
2. Add the exact URL: `https://yourdomain.com/auth/google/callback`
3. Save and wait 5-10 minutes for changes to propagate
4. Try logging in again

### ❌ "Sign in with Google" button doesn't appear
**Cause:** Using HTTP instead of HTTPS in production

**Fix:**
1. Always use HTTPS in production
2. Update `APP_URL=https://...` (not `http://`)
3. Update Google callback to use HTTPS

### ❌ Login works but redirects to wrong page
**Cause:** Incorrect `APP_URL` configuration

**Fix:**
```bash
# Check your .env file has correct domain
echo $APP_URL
# Should output: https://yourdomain.com (with HTTPS!)
```

---

## Security Checklist for Production

- ✅ Change `SESSION_SECRET` to a new strong random string
- ✅ Use HTTPS only (no HTTP in production)
- ✅ Set `NODE_ENV=production`
- ✅ Register callback URL in Google Cloud Console
- ✅ Use environment-specific credentials (separate from dev)
- ✅ Use MongoDB Atlas or managed database (not localhost)
- ✅ Set secure cookies: `secure: true` (Helmet handles this)
- ✅ Update PAYPAL credentials for production
- ✅ Set up proper email service for notifications

---

## Example Production Deployment (AWS, Heroku, DigitalOcean)

### Heroku Example
```bash
heroku create your-app-name
heroku config:set NODE_ENV=production
heroku config:set APP_URL=https://your-app.herokuapp.com
heroku config:set GOOGLE_CALLBACK_URL=https://your-app.herokuapp.com/auth/google/callback
heroku config:set GOOGLE_CLIENT_ID=xxx
heroku config:set GOOGLE_CLIENT_SECRET=xxx
# ... other vars
git push heroku main
```

### DigitalOcean / VPS Example
```bash
ssh user@your-server
cd /app
git pull origin main
# Create .env with production values
cat > .env << EOF
NODE_ENV=production
APP_URL=https://yourdomain.com
GOOGLE_CALLBACK_URL=https://yourdomain.com/auth/google/callback
# ... rest of config
EOF

npm install
npm start
```

---

## Verifying Production Setup

```bash
# Check environment variables are set
env | grep GOOGLE_CALLBACK_URL
# Should output: GOOGLE_CALLBACK_URL=https://yourdomain.com/auth/google/callback

# Check Node environment
env | grep NODE_ENV
# Should output: NODE_ENV=production

# Test the application
curl -I https://yourdomain.com
# Should respond with 200 and secure headers
```

---

**Remember:** The callback URL MUST match exactly between:
1. Google Cloud Console
2. Your `.env` file (`GOOGLE_CALLBACK_URL`)
3. Your app's `APP_URL`
