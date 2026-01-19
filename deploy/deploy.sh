#!/bin/bash
# Deployment script for NewBee Running Club
# Run this on your EC2 instance after initial setup

set -e

# Configuration
DOMAIN="newbeerunning.org"
APP_DIR="/var/www/newbeerunning"
REPO_URL="git@github.com:YOUR_USERNAME/NewBee-Running-Club.git"
BRANCH="prod"

echo "========================================="
echo "NewBee Running Club Deployment"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (use sudo)"
    exit 1
fi

# Step 1: Update system
echo ""
echo "Step 1: Updating system packages..."
apt-get update && apt-get upgrade -y
print_status "System updated"

# Step 2: Install dependencies
echo ""
echo "Step 2: Installing dependencies..."

# Install Node.js 18.x if not present
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
fi

apt-get install -y \
    nginx \
    python3 \
    python3-pip \
    python3-venv \
    nodejs \
    git \
    certbot \
    python3-certbot-nginx \
    curl \
    rsync
# Note: npm is included with NodeSource nodejs package
print_status "Dependencies installed"

# Step 3: Create directory structure
echo ""
echo "Step 3: Creating directory structure..."
mkdir -p $APP_DIR/{frontend,backend}
chown -R ubuntu:ubuntu $APP_DIR
print_status "Directories created"

# Step 4: Clone or pull repository
echo ""
echo "Step 4: Fetching latest code..."
if [ -d "$APP_DIR/repo" ]; then
    cd $APP_DIR/repo
    sudo -u ubuntu git fetch origin
    sudo -u ubuntu git checkout $BRANCH
    sudo -u ubuntu git pull origin $BRANCH
    print_status "Repository updated"
else
    sudo -u ubuntu git clone -b $BRANCH $REPO_URL $APP_DIR/repo
    print_status "Repository cloned"
fi

# Step 5: Build Frontend
echo ""
echo "Step 5: Building frontend..."
cd $APP_DIR/repo/ProjectCode/client

# Install dependencies
sudo -u ubuntu npm ci

# Create production .env
cat > .env.production << EOF
REACT_APP_API_BASE_URL=https://api.${DOMAIN}
EOF

# Build
sudo -u ubuntu npm run build

# Copy build to nginx directory
rm -rf $APP_DIR/frontend/*
cp -r build/* $APP_DIR/frontend/
print_status "Frontend built and deployed"

# Step 6: Setup Backend
echo ""
echo "Step 6: Setting up backend..."
cd $APP_DIR/repo/ProjectCode/server

# Copy backend files
rsync -av --exclude='venv' --exclude='__pycache__' --exclude='.env' . $APP_DIR/backend/

# Create virtual environment if not exists
if [ ! -d "$APP_DIR/backend/venv" ]; then
    sudo -u ubuntu python3 -m venv $APP_DIR/backend/venv
fi

# Install Python dependencies
sudo -u ubuntu $APP_DIR/backend/venv/bin/pip install --upgrade pip
sudo -u ubuntu $APP_DIR/backend/venv/bin/pip install -r $APP_DIR/backend/requirements.txt
print_status "Backend dependencies installed"

# Step 7: Check for .env file
echo ""
echo "Step 7: Checking backend configuration..."
if [ ! -f "$APP_DIR/backend/.env" ]; then
    print_warning "Backend .env file not found!"
    echo "Please create $APP_DIR/backend/.env with the following content:"
    cat << 'ENVEOF'
DB_HOST=your-rds-endpoint.amazonaws.com
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=your-password
DB_NAME=newbee_running_club
API_HOST=127.0.0.1
API_PORT=8000
DEBUG=False
USE_SQLITE=False
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
ENVEOF
    echo ""
    read -p "Press Enter after creating the .env file..."
fi
print_status "Backend configuration checked"

# Step 8: Setup systemd service
echo ""
echo "Step 8: Setting up systemd service..."
cp $APP_DIR/repo/deploy/systemd/newbeerunning-api.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable newbeerunning-api
systemctl restart newbeerunning-api
print_status "Backend service configured"

# Step 9: Setup Nginx
echo ""
echo "Step 9: Configuring Nginx..."

# Check if using Cloudflare (origin cert exists)
if [ -f "/etc/ssl/cloudflare/cert.pem" ]; then
    print_status "Cloudflare origin certificate detected, using Cloudflare config"
    cp $APP_DIR/repo/deploy/nginx/newbeerunning-cloudflare.conf /etc/nginx/sites-available/newbeerunning.conf
else
    print_warning "No Cloudflare cert found, using Let's Encrypt config"
    cp $APP_DIR/repo/deploy/nginx/newbeerunning.conf /etc/nginx/sites-available/newbeerunning.conf
fi

ln -sf /etc/nginx/sites-available/newbeerunning.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx config
nginx -t
print_status "Nginx configured"

# Step 10: SSL Certificates (skip if using Cloudflare)
echo ""
echo "Step 10: Setting up SSL certificates..."
if [ -f "/etc/ssl/cloudflare/cert.pem" ]; then
    print_status "Using Cloudflare origin certificate"
elif [ ! -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
    print_warning "SSL certificates not found. Running Certbot..."
    certbot --nginx -d $DOMAIN -d www.$DOMAIN -d api.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
else
    print_status "SSL certificates already exist"
fi

# Restart services
echo ""
echo "Step 11: Restarting services..."
systemctl restart nginx
systemctl restart newbeerunning-api
print_status "Services restarted"

# Final status
echo ""
echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo ""
echo "Frontend: https://${DOMAIN}"
echo "API:      https://api.${DOMAIN}"
echo "API Docs: https://api.${DOMAIN}/docs"
echo ""
echo "Check service status:"
echo "  systemctl status newbeerunning-api"
echo "  systemctl status nginx"
echo ""
echo "View logs:"
echo "  journalctl -u newbeerunning-api -f"
echo "  tail -f /var/log/nginx/error.log"
