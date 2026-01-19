# SSH Access to Production Server

## Quick Connect

```bash
ssh -i /path/to/your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

## Prerequisites

1. **SSH Key File (.pem)** - Downloaded when you created the EC2 instance in AWS
2. **EC2 Public IP** - Found in AWS Console → EC2 → Instances → Your Instance

## First-Time Setup (Local Machine)

### 1. Set correct permissions on your key file

```bash
chmod 400 /path/to/your-key.pem
```

### 2. (Optional) Add to SSH config for easier access

Edit `~/.ssh/config`:

```
Host newbee-prod
    HostName YOUR_EC2_PUBLIC_IP
    User ubuntu
    IdentityFile /path/to/your-key.pem
```

Then connect with just:

```bash
ssh newbee-prod
```

## Important Paths on Server

| Path | Description |
|------|-------------|
| `/var/www/newbeerunning/NewBee-Running-Club/` | Git repository |
| `/var/www/newbeerunning/frontend/` | Built React app |
| `/var/www/newbeerunning/backend/` | Backend + venv |
| `/var/www/newbeerunning/backend/.env` | Backend secrets |

## Common Commands After SSH

```bash
# Check backend status
sudo systemctl status newbeerunning-api

# View backend logs
sudo journalctl -u newbeerunning-api -f

# Restart backend
sudo systemctl restart newbeerunning-api

# Restart nginx
sudo systemctl restart nginx

# Pull latest code
cd /var/www/newbeerunning/NewBee-Running-Club
git pull origin prod
```

## Troubleshooting SSH

### "Permission denied (publickey)"
- Check key file permissions: `chmod 400 your-key.pem`
- Verify you're using the correct key for this EC2 instance

### "Connection timed out"
- Check EC2 security group allows SSH (port 22) from your IP
- Verify EC2 instance is running

### "Host key verification failed"
- If EC2 IP changed, remove old entry: `ssh-keygen -R YOUR_EC2_IP`
