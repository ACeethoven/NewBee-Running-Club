# AWS Deployment Guide - NewBee Running Club

This guide walks you through deploying the NewBee Running Club application to AWS.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                             │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Route 53 (DNS)                           │
│  newbeerunning.org → EC2 IP                                 │
│  api.newbeerunning.org → EC2 IP                             │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     EC2 Instance                             │
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
│     newbee-running-club-db.xxx.us-east-2.rds.amazonaws.com  │
└─────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

- AWS Account with EC2 and RDS access
- Domain name (newbeerunning.org) with DNS management access
- SSH key pair for EC2 access
- Your existing RDS database credentials

---

## Step 1: Launch EC2 Instance

### 1.1 Create EC2 Instance

1. Go to **AWS Console → EC2 → Launch Instance**
2. Configure:
   - **Name:** `newbeerunning-web`
   - **AMI:** Ubuntu Server 22.04 LTS
   - **Instance type:** `t3.small` (recommended) or `t3.micro` (minimum)
   - **Key pair:** Select or create a key pair
   - **Network settings:**
     - Allow SSH (port 22) from your IP
     - Allow HTTP (port 80) from anywhere
     - Allow HTTPS (port 443) from anywhere
   - **Storage:** 20 GB gp3

3. Click **Launch Instance**

### 1.2 Allocate Elastic IP

1. Go to **EC2 → Elastic IPs → Allocate Elastic IP address**
2. Associate with your EC2 instance
3. Note this IP address for DNS configuration

### 1.3 Configure Security Group

Ensure your security group has these inbound rules:

| Type  | Port | Source    |
|-------|------|-----------|
| SSH   | 22   | Your IP   |
| HTTP  | 80   | 0.0.0.0/0 |
| HTTPS | 443  | 0.0.0.0/0 |

---

## Step 2: Configure DNS (Route 53 or Domain Registrar)

Add these DNS records pointing to your Elastic IP:

| Type | Name                    | Value          |
|------|-------------------------|----------------|
| A    | newbeerunning.org       | YOUR_ELASTIC_IP |
| A    | www.newbeerunning.org   | YOUR_ELASTIC_IP |
| A    | api.newbeerunning.org   | YOUR_ELASTIC_IP |

Wait for DNS propagation (can take up to 48 hours, usually faster).

---

## Step 3: Configure RDS Security Group

Your existing RDS instance needs to accept connections from the EC2 instance.

1. Go to **RDS → Databases → your-database → Security Groups**
2. Edit inbound rules to allow MySQL (port 3306) from your EC2's security group

---

## Step 4: Initial Server Setup

### 4.1 SSH into your EC2 instance

```bash
ssh -i your-key.pem ubuntu@YOUR_ELASTIC_IP
```

### 4.2 Update system and install Node.js

```bash
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### 4.3 Clone the repository

```bash
sudo mkdir -p /var/www/newbeerunning
sudo chown ubuntu:ubuntu /var/www/newbeerunning
cd /var/www/newbeerunning

# Clone your repository (replace with your repo URL)
git clone -b prod git@github.com:YOUR_USERNAME/NewBee-Running-Club.git repo
```

### 4.4 Create backend environment file

```bash
nano /var/www/newbeerunning/backend/.env
```

Add the following (replace with your actual values):

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
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
```

---

## Step 5: Run Deployment Script

```bash
cd /var/www/newbeerunning/repo
sudo chmod +x deploy/deploy.sh
sudo ./deploy/deploy.sh
```

The script will:
1. Install all dependencies (Nginx, Python, Node.js, Certbot)
2. Build the React frontend
3. Set up the Python backend with virtual environment
4. Configure Nginx and SSL certificates
5. Start the backend service

---

## Step 6: Verify Deployment

### Check services are running:

```bash
# Check backend status
sudo systemctl status newbeerunning-api

# Check nginx status
sudo systemctl status nginx
```

### Test endpoints:

```bash
# Test API
curl https://api.newbeerunning.org/

# Should return:
# {"message":"NewBee Running Club API is running!","database":"AWS MySQL RDS"}
```

### Visit in browser:

- Frontend: https://newbeerunning.org
- API Docs: https://api.newbeerunning.org/docs

---

## Step 7: Update Firebase Storage CORS

Run this from your local machine (requires gcloud CLI):

```bash
cd /path/to/NewBee-Running-Club
gcloud storage buckets update gs://newbee-running-club-website.firebasestorage.app --cors-file=cors.json
```

---

## Maintenance Commands

### View logs

```bash
# Backend logs
sudo journalctl -u newbeerunning-api -f

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Restart services

```bash
sudo systemctl restart newbeerunning-api
sudo systemctl restart nginx
```

### Deploy updates

```bash
cd /var/www/newbeerunning/repo
sudo ./deploy/deploy.sh
```

### Renew SSL certificates

Certbot auto-renews, but to manually renew:

```bash
sudo certbot renew
```

---

## Troubleshooting

### Backend won't start

```bash
# Check logs
sudo journalctl -u newbeerunning-api -n 50

# Test manually
cd /var/www/newbeerunning/backend
source venv/bin/activate
python main.py
```

### Database connection issues

1. Verify RDS security group allows EC2 access
2. Test connection:
   ```bash
   mysql -h YOUR_RDS_ENDPOINT -u admin -p
   ```

### 502 Bad Gateway

Usually means backend isn't running:
```bash
sudo systemctl restart newbeerunning-api
```

### SSL certificate issues

```bash
sudo certbot --nginx -d newbeerunning.org -d www.newbeerunning.org -d api.newbeerunning.org
```

---

## Cost Estimates (Monthly)

| Service | Spec | Est. Cost |
|---------|------|-----------|
| EC2 t3.small | 2 vCPU, 2GB RAM | ~$15 |
| RDS (existing) | Already configured | Existing cost |
| Elastic IP | In use | $0 |
| Data transfer | ~10GB | ~$1 |
| **Total** | | **~$16/month** |

---

## Security Checklist

- [ ] SSH key authentication only (disable password auth)
- [ ] RDS not publicly accessible
- [ ] Security groups restrict access appropriately
- [ ] SSL certificates configured and auto-renewing
- [ ] Backend environment variables not in git
- [ ] Firebase config secured
- [ ] Regular security updates: `sudo apt update && sudo apt upgrade`
