# Production Deployment Guide

## 🚀 Pre-Deployment Checklist

### 1. Environment Configuration
- [ ] Copy `.env.production.example` to `.env` (on production server)
- [ ] Set `NODE_ENV=production`
- [ ] Generate strong `SESSION_SECRET` (min 32 characters)
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] Set all Google OAuth credentials
- [ ] Set MongoDB Atlas connection string
- [ ] Configure email credentials if needed

### 2. Security Hardening
- [ ] Enable HTTPS/SSL certificate (Let's Encrypt recommended)
- [ ] Set secure cookies (`secure: true` is auto-enabled in production)
- [ ] Configure CORS for allowed origins only
- [ ] Set strong HSTS headers (enabled by default)
- [ ] Enable rate limiting on auth routes
- [ ] Validate all environment variables present

### 3. Database
- [ ] Migrate to MongoDB Atlas or hosted MongoDB
- [ ] Enable authentication on MongoDB
- [ ] Create database backups
- [ ] Set up MongoDB replication/sharding if needed
- [ ] Test connection string before deploying

### 4. Google OAuth Setup
- [ ] Create OAuth 2.0 credentials in Google Cloud Console
- [ ] Add production domain to authorized redirect URIs
- [ ] Set `GOOGLE_CALLBACK_URL` to `https://yourdomain.com/auth/google/callback`
- [ ] Verify OAuth 2.0 consent screen is configured

### 5. Email Configuration
- [ ] Set up email account for notifications
- [ ] For Gmail: Use App Password (not regular password)
- [ ] Test email sending before production
- [ ] Configure email fallback (graceful degradation)

### 6. Performance & Caching
- [ ] Enable gzip compression (already configured)
- [ ] Consider Redis for session storage
- [ ] Optimize database indexes
- [ ] Consider CDN for static assets
- [ ] Enable HTTP/2 and keep-alive

### 7. Monitoring & Logging
- [ ] Set up error logging (e.g., Sentry)
- [ ] Configure application monitoring
- [ ] Set up health check endpoint
- [ ] Enable production logging (`combined` format)
- [ ] Monitor memory usage and uptime

### 8. Code & Dependencies
- [ ] Remove `nodemon` from dependencies in production
- [ ] Update all packages: `npm audit fix`
- [ ] Run tests before deploying
- [ ] Review security vulnerabilities: `npm audit`
- [ ] Minify and optimize static assets

## 🔧 Deployment Steps

### Option 1: Deploy to Heroku
```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set SESSION_SECRET=your_secret_key
heroku config:set MONGODB_URI=mongodb+srv://...
heroku config:set GOOGLE_CLIENT_ID=...
heroku config:set GOOGLE_CLIENT_SECRET=...

# Deploy
git push heroku main
```

### Option 2: Deploy to DigitalOcean/AWS/Azure
```bash
# SSH into server
ssh root@your_server_ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone https://github.com/sameduTM/tutorsonhenry-v1.2.git
cd tutorsonhenry-v1.2

# Install dependencies
npm install --production

# Set up environment variables
nano .env

# Start application with PM2
sudo npm install -g pm2
pm2 start server.js --name "tutors-api"
pm2 startup
pm2 save
```

### Option 3: Deploy with Docker
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "server.js"]
```

```bash
docker build -t tutorsonhenry:latest .
docker run -d \
  --name tutorsonhenry-prod \
  -e NODE_ENV=production \
  -e MONGODB_URI=... \
  -e SESSION_SECRET=... \
  -e GOOGLE_CLIENT_ID=... \
  -e GOOGLE_CLIENT_SECRET=... \
  -p 3000:3000 \
  tutorsonhenry:latest
```

## 📊 Server Requirements

### Minimum Specs
- RAM: 2GB
- CPU: 2 cores
- Storage: 10GB SSD
- Bandwidth: 10GB/month

### Recommended Specs
- RAM: 4GB+
- CPU: 4 cores
- Storage: 50GB SSD
- Bandwidth: 100GB/month

## 🔐 Security Checklist

- [ ] HTTPS enabled
- [ ] HSTS headers configured
- [ ] CSRF protection enabled
- [ ] Rate limiting active
- [ ] SQL injection prevention (Mongoose handles this)
- [ ] XSS prevention (helmet enabled)
- [ ] Session security (httpOnly, secure cookies)
- [ ] Password hashing (bcrypt with salt)
- [ ] Environment variables not in git
- [ ] Sensitive data not logged

## 📈 Performance Tuning

### Node.js
```bash
# Increase file descriptors
ulimit -n 65535

# Enable clustering (optional)
# Add cluster module to server.js for multi-core usage
```

### Database
```javascript
// Add indexes to frequently queried fields
db.orders.createIndex({ userId: 1, status: 1 })
db.users.createIndex({ email: 1 })
db.messages.createIndex({ orderId: 1, createdAt: -1 })
```

### Reverse Proxy (Nginx)
```nginx
upstream tutors_api {
    server localhost:3000;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    location / {
        proxy_pass http://tutors_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🆘 Troubleshooting

### Connection Issues
```bash
# Test MongoDB connection
mongo "mongodb+srv://user:pass@cluster.mongodb.net/tutorsonDB"

# Check Node.js process
pm2 status
pm2 logs tutors-api
```

### Performance Issues
```bash
# Monitor server resources
top
htop

# Check application memory
pm2 show tutors-api
```

### SSL Certificate
```bash
# Renew Let's Encrypt certificate
sudo certbot renew --dry-run
sudo certbot renew
```

## 📞 Production Support

For critical issues:
1. Check application logs: `pm2 logs`
2. Monitor database connection
3. Verify all environment variables are set
4. Check system resources (CPU, RAM, Disk)
5. Review recent code changes

## 🔄 Maintenance Schedule

- **Daily**: Monitor error logs and uptime
- **Weekly**: Review performance metrics
- **Monthly**: Update dependencies, patch security
- **Quarterly**: Full audit and optimization review

---

**Last Updated**: December 15, 2025
**Version**: 1.0.0
