# Deployment Guide - Baby Tracker

## Overview

This guide covers deploying the Baby Tracker platform to production.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Domain name with SSL certificate
- Cloud hosting (AWS, DigitalOcean, Heroku, etc.)

## Option 1: Docker Deployment (Recommended)

### 1. Install Docker and Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Configure Environment

```bash
# Create production .env file
cp backend/.env.example backend/.env

# Edit with production values
nano backend/.env
```

### 3. Build and Run

```bash
# Build images
docker-compose build

# Run migrations
docker-compose run backend npx prisma migrate deploy

# Start services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 4. Set up Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name api.babytracker.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5. Enable SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.babytracker.com
```

## Option 2: Traditional Deployment

### Backend Deployment

#### 1. Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib
```

#### 2. Setup Database

```bash
# Create database and user
sudo -u postgres psql
CREATE DATABASE baby_tracker;
CREATE USER baby_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE baby_tracker TO baby_user;
\q
```

#### 3. Deploy Backend

```bash
# Clone repository
git clone https://github.com/yourusername/baby-tracker.git
cd baby-tracker/backend

# Install dependencies
npm ci --only=production

# Set environment variables
cp .env.example .env
nano .env

# Run migrations
npx prisma migrate deploy
npx prisma generate

# Start with PM2
npm install -g pm2
pm2 start src/server.js --name baby-tracker-api
pm2 save
pm2 startup
```

### Mobile App Deployment

#### iOS

1. **Setup Apple Developer Account**
   - Enroll in Apple Developer Program
   - Create App ID
   - Create provisioning profiles

2. **Configure App**
```bash
cd mobile
expo build:ios
```

3. **Submit to App Store**
   - Use Application Loader or Transporter
   - Follow Apple's review guidelines

#### Android

1. **Setup Google Play Console**
   - Create developer account
   - Create app listing

2. **Build APK/AAB**
```bash
cd mobile
expo build:android
```

3. **Submit to Google Play**
   - Upload AAB file
   - Complete store listing
   - Submit for review

### Alexa Skill Deployment

1. **Create Lambda Function**

```bash
# Package backend code for Lambda
cd backend
zip -r lambda.zip src/ node_modules/ package.json

# Upload to AWS Lambda
aws lambda create-function \
  --function-name babyTrackerSkill \
  --runtime nodejs18.x \
  --handler src/routes/alexa.handler \
  --zip-file fileb://lambda.zip \
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-role
```

2. **Configure Alexa Skill**
   - Follow alexa-skill/README.md
   - Set Lambda ARN as endpoint
   - Configure account linking
   - Submit for certification

## Environment Variables

### Backend (.env)

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/baby_tracker

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=production

# Email (for notifications)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
EMAIL_FROM=Baby Tracker <noreply@babytracker.com>

# Frontend
FRONTEND_URL=https://app.babytracker.com

# Alexa
ALEXA_SKILL_ID=amzn1.ask.skill.xxxxx
```

## Database Backups

### Automated Backups

```bash
# Create backup script
cat > /usr/local/bin/backup-babytracker.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U baby_user baby_tracker | gzip > /backups/baby_tracker_$DATE.sql.gz
find /backups -name "baby_tracker_*.sql.gz" -mtime +7 -delete
EOF

chmod +x /usr/local/bin/backup-babytracker.sh

# Add to crontab (daily at 2 AM)
echo "0 2 * * * /usr/local/bin/backup-babytracker.sh" | crontab -
```

## Monitoring

### Setup PM2 Monitoring

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Monitor
pm2 monit
```

### Setup Uptime Monitoring

Use services like:
- UptimeRobot
- Pingdom
- StatusCake

## Security Checklist

- [ ] Enable HTTPS/SSL
- [ ] Set secure JWT secret (min 32 characters)
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Use environment variables for secrets
- [ ] Regular security updates
- [ ] Database connection pooling
- [ ] Implement request validation
- [ ] Enable firewall
- [ ] Regular backups
- [ ] Monitor logs

## Performance Optimization

### Backend

1. **Enable Compression**
```javascript
const compression = require('compression');
app.use(compression());
```

2. **Add Caching**
```javascript
const redis = require('redis');
const client = redis.createClient();
```

3. **Database Indexing**
```sql
CREATE INDEX idx_feeding_baby_time ON "FeedingLog"("babyId", "startTime");
CREATE INDEX idx_sleep_baby_time ON "SleepLog"("babyId", "startTime");
```

### Mobile

1. **Code Splitting**
2. **Image Optimization**
3. **Lazy Loading**
4. **Bundle Size Optimization**

## Scaling

### Horizontal Scaling

```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      replicas: 3
```

### Load Balancer Setup

```nginx
upstream backend {
    least_conn;
    server backend1:3000;
    server backend2:3000;
    server backend3:3000;
}
```

### Database Scaling

- Read replicas for queries
- Connection pooling
- Query optimization

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connections
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"
```

2. **API Not Responding**
```bash
# Check logs
pm2 logs baby-tracker-api

# Restart
pm2 restart baby-tracker-api
```

3. **High Memory Usage**
```bash
# Monitor
pm2 monit

# Check Node process
top -p $(pgrep -f node)
```

## Rollback Plan

```bash
# Save current state
pm2 save

# If issues arise, revert to previous version
git checkout previous-tag
npm ci
npx prisma migrate deploy
pm2 restart baby-tracker-api
```

## Update Procedure

1. Backup database
2. Pull latest code
3. Install dependencies
4. Run migrations
5. Restart services
6. Verify functionality
7. Monitor for issues

```bash
# Full update script
./update.sh
```

## Support

For deployment issues:
- Check logs: `pm2 logs`
- Database logs: `/var/log/postgresql/`
- System logs: `/var/log/syslog`

For help, contact: devops@babytracker.com
