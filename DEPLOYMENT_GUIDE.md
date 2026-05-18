# Production Deployment Guide

This guide covers deploying your Omegle Clone application to production using various platforms and configurations.

## 🎯 Deployment Options

### Option 1: Vercel + Supabase (Recommended)
- **Frontend**: Vercel
- **Backend**: Vercel Functions
- **Database**: Supabase
- **WebSockets**: Socket.IO with Redis adapter

### Option 2: Railway + Supabase
- **Full Stack**: Railway
- **Database**: Supabase
- **WebSockets**: Built-in support

### Option 3: DigitalOcean + Supabase
- **App Platform**: DigitalOcean
- **Database**: Supabase
- **WebSockets**: Built-in support

### Option 4: Self-Hosted
- **Server**: VPS/Dedicated server
- **Database**: Supabase or self-hosted PostgreSQL
- **Reverse Proxy**: Nginx
- **Process Manager**: PM2

## 🚀 Option 1: Vercel + Supabase Deployment

### Prerequisites
- Vercel account
- Supabase project (see SUPABASE_SETUP.md)
- GitHub repository

### Step 1: Prepare for Vercel

1. **Update package.json for Vercel**:
   ```json
   {
     "scripts": {
       "build": "tsc",
       "start": "node dist/index.js",
       "vercel-build": "npm run build"
     }
   }
   ```

2. **Create vercel.json**:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "frontend/package.json",
         "use": "@vercel/static-build",
         "config": {
           "distDir": "dist"
         }
       },
       {
         "src": "backend/src/index.ts",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "/backend/src/index.ts"
       },
       {
         "src": "/(.*)",
         "dest": "/frontend/$1"
       }
     ],
     "env": {
       "NODE_ENV": "production"
     }
   }
   ```

### Step 2: Deploy to Vercel

1. **Connect GitHub repository**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login and deploy
   vercel login
   vercel --prod
   ```

2. **Set environment variables** in Vercel dashboard:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   ADMIN_PASSWORD=your_secure_password
   NODE_ENV=production
   ```

### Step 3: Configure WebSockets for Vercel

Since Vercel doesn't support WebSockets, use Socket.IO with polling:

1. **Update frontend Socket.IO config**:
   ```typescript
   const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
     transports: ['polling'], // Force polling for Vercel
     upgrade: false
   });
   ```

2. **Alternative: Use Pusher for real-time**:
   ```bash
   npm install pusher pusher-js
   ```

## 🚀 Option 2: Railway Deployment

### Step 1: Prepare Railway Config

1. **Create railway.json**:
   ```json
   {
     "$schema": "https://railway.app/railway.schema.json",
     "build": {
       "builder": "NIXPACKS"
     },
     "deploy": {
       "startCommand": "npm run start:prod",
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 10
     }
   }
   ```

2. **Update package.json**:
   ```json
   {
     "scripts": {
       "start:prod": "cd backend && npm start",
       "build": "cd backend && npm run build && cd ../frontend && npm run build"
     }
   }
   ```

### Step 2: Deploy to Railway

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and deploy**:
   ```bash
   railway login
   railway init
   railway up
   ```

3. **Set environment variables**:
   ```bash
   railway variables set SUPABASE_URL=https://your-project.supabase.co
   railway variables set SUPABASE_ANON_KEY=your_anon_key
   railway variables set ADMIN_PASSWORD=your_secure_password
   railway variables set NODE_ENV=production
   ```

## 🚀 Option 3: DigitalOcean App Platform

### Step 1: Create App Spec

Create `.do/app.yaml`:
```yaml
name: Random-chat
services:
- name: backend
  source_dir: /backend
  github:
    repo: your-username/Random-chat
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: SUPABASE_URL
    value: https://your-project.supabase.co
  - key: SUPABASE_ANON_KEY
    value: your_anon_key
  - key: ADMIN_PASSWORD
    value: your_secure_password
  http_port: 3001

- name: frontend
  source_dir: /frontend
  github:
    repo: your-username/Random-chat
    branch: main
  build_command: npm run build
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  routes:
  - path: /
  envs:
  - key: VITE_API_URL
    value: ${backend.PUBLIC_URL}
```

### Step 2: Deploy

1. **Using DigitalOcean CLI**:
   ```bash
   doctl apps create --spec .do/app.yaml
   ```

2. **Or use the web interface**:
   - Go to DigitalOcean Apps
   - Connect your GitHub repository
   - Configure build and run commands

## 🚀 Option 4: Self-Hosted Deployment

### Step 1: Server Setup

1. **Install dependencies**:
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install nodejs npm nginx postgresql-client
   
   # Install PM2
   sudo npm install -g pm2
   ```

2. **Clone and build**:
   ```bash
   git clone https://github.com/your-username/Random-chat.git
   cd Random-chat
   
   # Backend
   cd backend
   npm install
   npm run build
   
   # Frontend
   cd ../frontend
   npm install
   npm run build
   ```

### Step 2: Configure PM2

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'omegle-backend',
    script: './backend/dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      SUPABASE_URL: 'https://your-project.supabase.co',
      SUPABASE_ANON_KEY: 'your_anon_key',
      ADMIN_PASSWORD: 'your_secure_password'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### Step 3: Configure Nginx

Create `/etc/nginx/sites-available/Random-chat`:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Frontend
    location / {
        root /path/to/Random-chat/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Step 4: SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Step 5: Start Services

```bash
# Enable Nginx site
sudo ln -s /etc/nginx/sites-available/Random-chat /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Start PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🔧 Production Configuration

### Environment Variables

**Required for all deployments**:
```env
NODE_ENV=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
ADMIN_PASSWORD=your_secure_password
```

**Optional**:
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_key
PORT=3001
FRONTEND_URL=https://your-domain.com
STUN_SERVER=stun:stun.l.google.com:19302
```

### Security Considerations

1. **Use HTTPS**: Always use SSL certificates in production
2. **Secure Admin Password**: Use a strong, unique password
3. **Rate Limiting**: Configure appropriate rate limits
4. **CORS**: Set specific origins, not wildcards
5. **Environment Variables**: Never commit secrets to git

### Performance Optimization

1. **Enable Gzip**: Compress responses
2. **CDN**: Use a CDN for static assets
3. **Caching**: Implement appropriate caching strategies
4. **Database Indexes**: Ensure proper indexing in Supabase
5. **Connection Pooling**: Use connection pooling for databases

## 📊 Monitoring and Logging

### Application Monitoring

1. **Health Checks**: Set up monitoring for `/api/health`
2. **Error Tracking**: Use services like Sentry
3. **Performance**: Monitor response times and throughput
4. **Uptime**: Use services like UptimeRobot

### Supabase Monitoring

1. **Dashboard**: Monitor through Supabase dashboard
2. **Alerts**: Set up alerts for high usage
3. **Logs**: Review database logs regularly
4. **Backups**: Verify backup schedules

### Log Management

```javascript
// Add structured logging
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

## 🚨 Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check firewall settings
   - Verify proxy configuration
   - Ensure WebSocket support is enabled

2. **Database Connection Issues**
   - Verify Supabase credentials
   - Check network connectivity
   - Review RLS policies

3. **High Memory Usage**
   - Monitor for memory leaks
   - Implement proper cleanup
   - Consider horizontal scaling

4. **Slow Response Times**
   - Optimize database queries
   - Add appropriate indexes
   - Implement caching

### Rollback Strategy

1. **Keep previous version**: Always maintain a rollback option
2. **Database migrations**: Use reversible migrations
3. **Feature flags**: Implement feature toggles
4. **Blue-green deployment**: Use zero-downtime deployments

## 🎯 Post-Deployment Checklist

- [ ] SSL certificate installed and working
- [ ] All environment variables set correctly
- [ ] Health check endpoint responding
- [ ] WebSocket connections working
- [ ] Database connections stable
- [ ] Admin dashboard accessible
- [ ] Monitoring and alerts configured
- [ ] Backup strategy implemented
- [ ] Performance baseline established
- [ ] Security scan completed

## 📈 Scaling Considerations

### Horizontal Scaling

1. **Load Balancer**: Use a load balancer for multiple instances
2. **Session Affinity**: Configure sticky sessions for WebSockets
3. **Database**: Supabase handles scaling automatically
4. **CDN**: Use CDN for static assets

### Vertical Scaling

1. **CPU**: Monitor CPU usage and scale up as needed
2. **Memory**: Watch memory consumption patterns
3. **Database**: Upgrade Supabase plan as needed
4. **Storage**: Monitor storage usage

Your Omegle Clone is now ready for production! 🚀