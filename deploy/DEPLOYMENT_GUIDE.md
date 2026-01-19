# AWS Deployment Guide - NewBee Running Club

This guide documents the complete deployment process for newbeerunning.org.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                             │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare (DNS + SSL)                    │
│  newbeerunning.org → EC2 IP (Proxied)                       │
│  api.newbeerunning.org → EC2 IP (Proxied)                   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                EC2 Instance (Ubuntu 22.04)                   │
│                  ip-172-31-36-26                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    Nginx (port 80/443)                  │ │
│  │  ┌─────────────────┐    ┌─────────────────────────────┐│ │
│  │  │ Static Frontend │    │ Proxy to Backend (port 8000)││ │
│  │  │ /var/www/.../   │    │ api.newbeerunning.org       ││ │
│  │  └─────────────────┘    └─────────────────────────────┘│ │
│  └────────────────────────────────────────────────────────┘ │
│                              │                               │
│                              ▼                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              FastAPI Backend (Uvicorn)                  │ │
│  │              systemd: newbeerunning-api                 │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    AWS RDS (MySQL)                           │
│     newbee-running-club-db.czi2swgqcu45.us-east-2.rds.amazonaws.com  │
└─────────────────────────────────────────────────────────────┘
```

---

## SSH into EC2

```bash
ssh -i /path/to/your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

Example:
```bash
ssh -i ~/.ssh/newbee-key.pem ubuntu@3.15.xxx.xxx
```

---

## Directory Structure on EC2

```
/var/www/newbeerunning/
├── NewBee-Running-Club/     # Git repository (prod branch)
│   ├── ProjectCode/
│   │   ├── client/          # React frontend source
│   │   └── server/          # FastAPI backend source
│   └── deploy/              # Deployment configs
├── frontend/                # Built React app (served by nginx)
└── backend/                 # Backend app + venv
    ├── venv/                # Python virtual environment
    ├── .env                 # Environment variables
    └── *.py                 # Backend source files
```

---

## Initial Server Setup (One-Time)

### 1. Update System & Install Dependencies

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx python3 python3-pip python3.12-venv git curl rsync
```

### 2. Install Node.js 18.x

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### 3. Create Directory Structure

```bash
sudo mkdir -p /var/www/newbeerunning/{frontend,backend}
sudo chown -R ubuntu:ubuntu /var/www/newbeerunning
```

### 4. Clone Repository

```bash
cd /var/www/newbeerunning
git clone -b prod https://github.com/GXQ1223/NewBee-Running-Club.git NewBee-Running-Club
```

---

## Backend Setup

### 1. Create Python Virtual Environment

```bash
python3 -m venv /var/www/newbeerunning/backend/venv
```

### 2. Copy Backend Files

```bash
cd /var/www/newbeerunning/NewBee-Running-Club/ProjectCode/server
rsync -av --exclude='venv' --exclude='__pycache__' --exclude='.env' . /var/www/newbeerunning/backend/
```

### 3. Install Python Dependencies

```bash
/var/www/newbeerunning/backend/venv/bin/pip install --upgrade pip
/var/www/newbeerunning/backend/venv/bin/pip install -r /var/www/newbeerunning/backend/requirements.txt
```

### 4. Create Backend Environment File

```bash
sudo nano /var/www/newbeerunning/backend/.env
```

Contents:
```env
DB_HOST=newbee-running-club-db.czi2swgqcu45.us-east-2.rds.amazonaws.com
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=YOUR_RDS_PASSWORD
DB_NAME=newbee_running_club

API_HOST=127.0.0.1
API_PORT=8000
DEBUG=False
USE_SQLITE=False

GMAIL_USER=newbeerunningclub@gmail.com
GMAIL_APP_PASSWORD=YOUR_GMAIL_APP_PASSWORD
```

### 5. Setup Systemd Service

```bash
sudo cp /var/www/newbeerunning/NewBee-Running-Club/deploy/systemd/newbeerunning-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable newbeerunning-api
sudo systemctl restart newbeerunning-api
```

### 6. Verify Backend is Running

```bash
sudo systemctl status newbeerunning-api
curl http://127.0.0.1:8000/
# Should return: {"message":"NewBee Running Club API is running!","database":"AWS MySQL RDS"}
```

---

## Frontend Setup

### 1. Create Production Environment File

```bash
cd /var/www/newbeerunning/NewBee-Running-Club/ProjectCode/client
nano .env.production
```

Contents:
```env
# API Configuration
REACT_APP_API_BASE_URL=https://api.newbeerunning.org

# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=AIzaSyCV9AnOPulBSvWEBfBGprBVk7kFLmwDWnk
REACT_APP_FIREBASE_AUTH_DOMAIN=newbee-running-club-website.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=newbee-running-club-website
REACT_APP_FIREBASE_STORAGE_BUCKET=newbee-running-club-website.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=577206570730
REACT_APP_FIREBASE_APP_ID=1:577206570730:web:169fb9e168168983695193
REACT_APP_FIREBASE_MEASUREMENT_ID=G-YC22KHNK43
```

### 2. Install Dependencies & Build

```bash
npm ci
npm run build
```

### 3. Deploy to Nginx Directory

```bash
sudo rm -rf /var/www/newbeerunning/frontend/*
sudo cp -r build/* /var/www/newbeerunning/frontend/
```

### 4. Fix Case-Sensitive Image Filenames (if needed)

```bash
cd /var/www/newbeerunning/frontend
sudo ln -s "Master-Image-1.jpg" "master-image-1.jpg"
sudo ln -s "PageLogo.png" "pagelogo.png"
```

---

## Cloudflare SSL Setup

### 1. Create Origin Certificate in Cloudflare

1. Go to Cloudflare Dashboard → SSL/TLS → **Origin Server**
2. Click **Create Certificate**
3. Keep defaults (15 years, covers `*.newbeerunning.org` and `newbeerunning.org`)
4. Click **Create**
5. **Copy both the certificate and private key** (you can only see the key once!)

### 2. Install Certificate on EC2

```bash
sudo mkdir -p /etc/ssl/cloudflare
sudo nano /etc/ssl/cloudflare/cert.pem
# Paste the certificate, save

sudo nano /etc/ssl/cloudflare/key.pem
# Paste the private key, save

sudo chmod 600 /etc/ssl/cloudflare/key.pem
```

---

## Nginx Setup

### 1. Copy Nginx Configuration

```bash
sudo cp /var/www/newbeerunning/NewBee-Running-Club/deploy/nginx/newbeerunning-cloudflare.conf /etc/nginx/sites-available/newbeerunning.conf
sudo ln -sf /etc/nginx/sites-available/newbeerunning.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

### 2. Test & Restart Nginx

```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## Cloudflare DNS Setup

In Cloudflare Dashboard → DNS, add these A records pointing to your EC2 public IP:

| Type | Name | Content | Proxy Status |
|------|------|---------|--------------|
| A | @ | YOUR_EC2_IP | Proxied (orange) |
| A | www | YOUR_EC2_IP | Proxied (orange) |
| A | api | YOUR_EC2_IP | Proxied (orange) |

SSL/TLS encryption mode: **Full**

---

## Verify Deployment

```bash
# Test backend locally
curl http://127.0.0.1:8000/

# Test nginx serves frontend
curl -I http://localhost
curl -I http://localhost/pagelogo.png

# Test full stack through Cloudflare
curl -I https://newbeerunning.org
curl -I https://api.newbeerunning.org
```

URLs:
- Frontend: https://newbeerunning.org
- API: https://api.newbeerunning.org
- API Docs: https://api.newbeerunning.org/docs

---

## CI/CD Automatic Deployment

A GitHub Actions workflow (`.github/workflows/deploy-prod.yml`) automatically deploys when code is pushed to `prod` branch.

### Setup GitHub Secrets

Go to GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret Name | Value |
|-------------|-------|
| `EC2_HOST` | Your EC2 public IP |
| `EC2_SSH_KEY` | Contents of your `.pem` SSH key file |

### How It Works

When you merge a PR from `dev` to `prod`:
1. GitHub Actions SSHs into EC2
2. Pulls latest code from `prod`
3. Builds React frontend
4. Updates backend dependencies
5. Restarts services
6. Verifies deployment health

---

## Maintenance Commands

### View Logs

```bash
# Backend logs
sudo journalctl -u newbeerunning-api -f

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Restart Services

```bash
sudo systemctl restart newbeerunning-api
sudo systemctl restart nginx
```

### Check Service Status

```bash
sudo systemctl status newbeerunning-api
sudo systemctl status nginx
```

### Manual Deployment (without CI/CD)

```bash
cd /var/www/newbeerunning/NewBee-Running-Club
git pull origin prod

# Rebuild frontend
cd ProjectCode/client
npm ci
npm run build
sudo rm -rf /var/www/newbeerunning/frontend/*
sudo cp -r build/* /var/www/newbeerunning/frontend/

# Update backend
cd ../server
rsync -av --exclude='venv' --exclude='__pycache__' --exclude='.env' . /var/www/newbeerunning/backend/
/var/www/newbeerunning/backend/venv/bin/pip install -r requirements.txt

# Restart backend
sudo systemctl restart newbeerunning-api
```

---

## Troubleshooting

### Backend Won't Start

```bash
# Check logs
sudo journalctl -u newbeerunning-api -n 50

# Test manually
cd /var/www/newbeerunning/backend
source venv/bin/activate
python main.py
```

### Database Connection Issues

1. Verify RDS security group allows EC2 access (port 3306)
2. Test connection:
   ```bash
   mysql -h newbee-running-club-db.czi2swgqcu45.us-east-2.rds.amazonaws.com -u admin -p
   ```

### 502 Bad Gateway

Usually means backend isn't running:
```bash
sudo systemctl restart newbeerunning-api
sudo systemctl status newbeerunning-api
```

### Images Return 404

Linux is case-sensitive. Check filename case matches code:
```bash
ls -la /var/www/newbeerunning/frontend/*.png
ls -la /var/www/newbeerunning/frontend/*.jpg
```

Create symlinks if needed:
```bash
cd /var/www/newbeerunning/frontend
sudo ln -s "ActualFilename.jpg" "requested-filename.jpg"
```

### Cloudflare Caching Old Content

1. Cloudflare Dashboard → Caching → Configuration → **Purge Everything**
2. Hard refresh browser: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

---

## Security Checklist

- [x] SSH key authentication only
- [x] RDS not publicly accessible (security group restricted)
- [x] Backend .env not in git
- [x] SSL via Cloudflare
- [x] Nginx security headers configured
- [ ] Regular security updates: `sudo apt update && sudo apt upgrade`
- [ ] Set up AWS CloudWatch for monitoring (optional)
