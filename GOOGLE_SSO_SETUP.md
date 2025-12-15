# Google SSO Setup Guide

This document explains how to set up Google Single Sign-On (SSO) for the Tutors on Henry application.

## Overview

Google SSO allows users to sign in using their Google account instead of creating a new email/password account. The implementation uses:

- **Passport.js** - Authentication middleware
- **passport-google-oauth20** - Google OAuth 2.0 strategy
- **MongoDB** - Stores user data with Google profile information

## Prerequisites

- Google Cloud Project
- Admin access to Google Cloud Console
- Node.js and npm installed

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top
3. Click "NEW PROJECT"
4. Enter a project name (e.g., "Tutors on Henry")
5. Click "CREATE"
6. Wait for the project to be created

## Step 2: Enable Google+ API

1. In the Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click on it and select "ENABLE"

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "CREATE CREDENTIALS" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" as the user type
   - Fill in the required fields:
     - **App name**: Tutors on Henry
     - **User support email**: your-email@gmail.com
     - **Developer contact**: your-email@gmail.com
   - Click "SAVE AND CONTINUE"
4. On the Credentials page, click "CREATE CREDENTIALS" > "OAuth client ID" again
5. Select "Web application"
6. Add the following Authorized redirect URIs:
   ```
   http://localhost:3000/auth/google/callback
   https://yourdomain.com/auth/google/callback  (for production)
   ```
7. Click "CREATE"
8. Copy your **Client ID** and **Client Secret**

## Step 4: Update Environment Variables

Add the following to your `.env` file:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

For production, update `GOOGLE_CALLBACK_URL` to your actual domain:
```env
GOOGLE_CALLBACK_URL=https://yourdomain.com/auth/google/callback
```

## Step 5: Verify Installation

The following changes have been made to your application:

### Files Modified:
- `models/user.js` - Added Google fields to User schema
- `routes/authRoute.js` - Added Google OAuth routes
- `config/passport.js` - Created Passport configuration (NEW)
- `server.js` - Integrated Passport middleware
- `.env.example` - Added Google OAuth variables
- `views/login.html` - Already has "Continue with Google" button

### New Features:

#### User Schema
```javascript
googleId: String          // Google's unique ID
googleEmail: String       // Email from Google profile
authProvider: 'email' | 'google'  // Authentication method
password: String (optional)       // Not required for Google users
```

#### Authentication Routes
- `GET /auth/google` - Initiates Google OAuth flow
- `GET /auth/google/callback` - Handles OAuth callback

#### User Management
- New users created via Google SSO are automatically saved
- Existing users can link their Google account to their email account
- Email uniqueness is enforced (can't have multiple accounts with same email)

## How It Works

### First-Time Google Login
1. User clicks "Continue with Google"
2. Redirected to Google login page
3. User authorizes the app to access their profile
4. User redirected back to app with Google credentials
5. New user account created automatically
6. User logged in and redirected to dashboard

### Existing Email User Linking Google
1. User logs in with email/password first
2. Or user clicks Google login with their Google email
3. If Google email matches existing account, Google ID is linked
4. User now has dual authentication methods

### Return Google User
1. User clicks "Continue with Google"
2. User authenticates with Google
3. Existing account found and logged in
4. User redirected to dashboard

## API Endpoints

### Authentication
- `GET /auth/google` - Start Google OAuth
- `GET /auth/google/callback` - OAuth callback handler
- `POST /login` - Traditional email/password login
- `POST /signup` - Email/password registration

## Session Management

When a user logs in (via email or Google):

```javascript
req.session.user = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,          // 'student', 'writer', 'admin'
    walletBalance: user.walletBalance,
    authProvider: user.authProvider  // 'email' or 'google'
}
```

## Security Considerations

1. **CSRF Protection**: Google OAuth routes are excluded from CSRF validation (handled by Google)
2. **Session Security**: Sessions are stored in MongoDB
3. **Password**: Not required for Google users (optional field in schema)
4. **Email Uniqueness**: Enforced at database level to prevent duplicate accounts
5. **OAuth Callback**: Only accepts requests from authorized redirect URIs

## Troubleshooting

### "Invalid Client ID" Error
- Verify `GOOGLE_CLIENT_ID` is correct in `.env`
- Ensure credentials are created as "Web application"
- Check that redirect URI is exactly the same (case-sensitive)

### "Redirect URI Mismatch" Error
- The callback URL in Google Cloud Console must match `GOOGLE_CALLBACK_URL`
- For localhost: `http://localhost:3000/auth/google/callback`
- For production: `https://yourdomain.com/auth/google/callback`

### User Not Created After Google Login
- Check MongoDB connection
- Verify Passport configuration is loaded
- Check server logs for errors

### User Remains on Login Page After Callback
- Verify session is being saved properly
- Check that Passport middleware is initialized before routes
- Ensure cookies are enabled in browser

## Testing

1. Start your server: `npm run dev`
2. Navigate to http://localhost:3000/login
3. Click "Continue with Google"
4. Sign in with a Google account
5. You should be redirected to your dashboard
6. Check MongoDB to see the new user record with `googleId` field

## Production Deployment

Before deploying to production:

1. Create a new Google OAuth app for your production domain
2. Update environment variables:
   ```env
   GOOGLE_CLIENT_ID=production_client_id
   GOOGLE_CLIENT_SECRET=production_client_secret
   GOOGLE_CALLBACK_URL=https://yourdomain.com/auth/google/callback
   ```
3. Add your production domain to Google Console Authorized redirect URIs
4. Update cookies to be secure (already handled with `NODE_ENV=production`)
5. Test thoroughly in a staging environment

## Support

For issues with Google OAuth:
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Passport.js Documentation](http://www.passportjs.org/)
- Google Cloud Console Support

## References

- **Passport**: http://www.passportjs.org/
- **Google OAuth 2.0**: https://developers.google.com/identity/protocols/oauth2
- **Express.js**: https://expressjs.com/
- **MongoDB**: https://docs.mongodb.com/
