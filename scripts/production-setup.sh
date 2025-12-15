#!/bin/bash

# Tutors on Henry - Production Setup Script
# This script automates the production deployment setup

set -e

echo "======================================"
echo "Tutors on Henry - Production Setup"
echo "======================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root${NC}"
   exit 1
fi

# 1. Update system
echo -e "${YELLOW}1. Updating system packages...${NC}"
apt-get update
apt-get upgrade -y

# 2. Install Node.js
echo -e "${YELLOW}2. Installing Node.js 20.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 3. Install npm globally tools
echo -e "${YELLOW}3. Installing PM2 and other tools...${NC}"
npm install -g pm2
npm install -g npm@latest

# 4. Install Nginx
echo -e "${YELLOW}4. Installing Nginx...${NC}"
apt-get install -y nginx

# 5. Install Certbot for SSL
echo -e "${YELLOW}5. Installing Certbot (Let's Encrypt)...${NC}"
apt-get install -y certbot python3-certbot-nginx

# 6. Install MongoDB Tools (optional)
echo -e "${YELLOW}6. Installing MongoDB Client...${NC}"
apt-get install -y mongodb-database-tools

# 7. Create nodejs user
echo -e "${YELLOW}7. Creating nodejs system user...${NC}"
if ! id -u nodejs > /dev/null 2>&1; then
    useradd -m -s /bin/bash -d /var/www nodejs
    echo -e "${GREEN}✓ nodejs user created${NC}"
else
    echo -e "${GREEN}✓ nodejs user already exists${NC}"
fi

# 8. Clone or setup application
echo -e "${YELLOW}8. Setting up application directory...${NC}"
if [ ! -d "/var/www/tutorsonhenry" ]; then
    cd /var/www
    git clone https://github.com/sameduTM/tutorsonhenry-v1.2.git tutorsonhenry
    echo -e "${GREEN}✓ Repository cloned${NC}"
else
    echo -e "${GREEN}✓ Application directory already exists${NC}"
fi

cd /var/www/tutorsonhenry

# 9. Set permissions
echo -e "${YELLOW}9. Setting permissions...${NC}"
chown -R nodejs:nodejs /var/www/tutorsonhenry
chmod -R 755 /var/www/tutorsonhenry

# 10. Install dependencies
echo -e "${YELLOW}10. Installing npm dependencies...${NC}"
sudo -u nodejs npm install --production

# 11. Setup environment file
echo -e "${YELLOW}11. Setting up environment configuration...${NC}"
if [ ! -f "/var/www/tutorsonhenry/.env" ]; then
    echo -e "${YELLOW}Please configure the .env file:${NC}"
    echo "Edit: /var/www/tutorsonhenry/.env"
    echo ""
    echo "Required variables:"
    echo "  - NODE_ENV=production"
    echo "  - MONGODB_URI=mongodb+srv://..."
    echo "  - SESSION_SECRET=(generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\")"
    echo "  - GOOGLE_CLIENT_ID=..."
    echo "  - GOOGLE_CLIENT_SECRET=..."
    echo "  - GOOGLE_CALLBACK_URL=https://yourdomain.com/auth/google/callback"
    echo ""
    read -p "Press Enter once you've configured .env..."
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

# 12. Setup Nginx
echo -e "${YELLOW}12. Configuring Nginx...${NC}"
cp /var/www/tutorsonhenry/nginx.conf /etc/nginx/sites-available/tutorsonhenry
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    rm /etc/nginx/sites-enabled/default
fi
ln -sf /etc/nginx/sites-available/tutorsonhenry /etc/nginx/sites-enabled/tutorsonhenry

# Edit domain in nginx config
read -p "Enter your domain (e.g., yourdomain.com): " DOMAIN
sed -i "s/yourdomain.com/$DOMAIN/g" /etc/nginx/sites-available/tutorsonhenry

# Test Nginx configuration
nginx -t

# 13. Setup SSL Certificate
echo -e "${YELLOW}13. Setting up SSL Certificate...${NC}"
certbot certonly --nginx -d "$DOMAIN" -d "www.$DOMAIN"

# 14. Setup systemd service
echo -e "${YELLOW}14. Setting up systemd service...${NC}"
cp /var/www/tutorsonhenry/tutorsonhenry.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable tutorsonhenry
systemctl enable nginx

# 15. Start services
echo -e "${YELLOW}15. Starting services...${NC}"
systemctl start tutorsonhenry
systemctl restart nginx

# 16. Setup PM2 startup
echo -e "${YELLOW}16. Configuring PM2 startup...${NC}"
sudo -u nodejs pm2 start /var/www/tutorsonhenry/server.js --name tutorsonhenry
sudo -u nodejs pm2 startup
sudo -u nodejs pm2 save

# 17. Setup firewall (UFW)
echo -e "${YELLOW}17. Configuring firewall...${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# 18. Setup log rotation
echo -e "${YELLOW}18. Setting up log rotation...${NC}"
cat > /etc/logrotate.d/tutorsonhenry << EOF
/var/log/tutorsonhenry/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 nodejs nodejs
    sharedscripts
}
EOF

echo ""
echo -e "${GREEN}======================================"
echo "✓ Production Setup Complete!"
echo "======================================${NC}"
echo ""
echo "Next steps:"
echo "1. Verify services are running:"
echo "   systemctl status tutorsonhenry"
echo "   systemctl status nginx"
echo ""
echo "2. Monitor application:"
echo "   journalctl -u tutorsonhenry -f"
echo "   pm2 logs"
echo ""
echo "3. Test your application:"
echo "   curl https://$DOMAIN/health"
echo ""
echo "4. Setup auto-renewal for SSL:"
echo "   certbot renew --dry-run"
echo ""
echo "Your application is now running at: https://$DOMAIN"
echo ""
