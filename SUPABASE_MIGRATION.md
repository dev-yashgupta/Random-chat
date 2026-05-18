# Migrating from PostgreSQL to Supabase

This guide will help you migrate your Omegle Clone application from local PostgreSQL to Supabase.

## 🎯 Why Supabase?

- **Managed Database**: No need to manage PostgreSQL infrastructure
- **Built-in APIs**: Automatic REST and GraphQL APIs
- **Real-time Features**: Built-in real-time subscriptions
- **Authentication**: Ready-to-use auth system (if needed later)
- **Dashboard**: Beautiful admin interface
- **Scaling**: Automatic scaling and backups
- **Global CDN**: Fast worldwide access

## 🚀 Migration Steps

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project:
   - **Name**: `Random-chat`
   - **Password**: Choose a strong database password
   - **Region**: Select closest to your users
3. Wait for project initialization (2-3 minutes)

### Step 2: Set Up Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy and paste the schema from `SUPABASE_SETUP.md`
3. Click **Run** to create tables and indexes

### Step 3: Update Environment Variables

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy your project credentials
3. Update `backend/.env`:

```env
# Add these Supabase variables
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Keep PostgreSQL variables for fallback (optional)
# DATABASE_URL=postgresql://postgres:password@localhost:5432/omegle_clone
```

### Step 4: Test the Migration

1. Start your application:
   ```bash
   cd backend
   npm run dev
   ```

2. Check the console output:
   ```
   Using database: supabase
   Supabase connection test successful
   Supabase connection established
   Server running on port 3001
   ```

3. Test the health endpoint:
   ```bash
   curl http://localhost:3001/api/health
   ```

### Step 5: Verify Functionality

Test all major features:

1. **Sessions**: Start a chat and verify session creation
2. **Reports**: Submit a report and check it's logged
3. **Statistics**: Check `/api/stats` endpoint
4. **Admin Dashboard**: Verify admin endpoints work

## 🔄 Automatic Service Selection

The application automatically detects which database to use based on environment variables:

- **Supabase**: If `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set
- **PostgreSQL**: If Supabase variables are missing, falls back to PostgreSQL

This allows for seamless switching between databases without code changes.

## 📊 Data Migration (If Needed)

If you have existing data in PostgreSQL that you want to migrate:

### Option 1: Manual Export/Import

1. **Export from PostgreSQL**:
   ```bash
   pg_dump -h localhost -U postgres -d omegle_clone --data-only --inserts > data_export.sql
   ```

2. **Import to Supabase**:
   - Go to Supabase SQL Editor
   - Paste the exported SQL
   - Run the import

### Option 2: Using Migration Script

Create a migration script to transfer data:

```javascript
// migration-script.js
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

async function migrateData() {
  // PostgreSQL connection
  const pgPool = new Pool({
    connectionString: 'postgresql://postgres:password@localhost:5432/omegle_clone'
  });

  // Supabase connection
  const supabase = createClient(
    'your-supabase-url',
    'your-service-role-key'
  );

  try {
    // Migrate sessions
    const { rows: sessions } = await pgPool.query('SELECT * FROM sessions');
    for (const session of sessions) {
      await supabase.from('sessions').insert(session);
    }

    // Migrate reports
    const { rows: reports } = await pgPool.query('SELECT * FROM reports');
    for (const report of reports) {
      await supabase.from('reports').insert(report);
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pgPool.end();
  }
}

migrateData();
```

## 🔧 Configuration Differences

### PostgreSQL vs Supabase

| Feature | PostgreSQL | Supabase |
|---------|------------|----------|
| Connection | Direct TCP connection | HTTP REST API |
| Authentication | Database user/password | API keys |
| Real-time | Manual implementation | Built-in subscriptions |
| Scaling | Manual | Automatic |
| Backups | Manual setup | Automatic |
| Monitoring | External tools | Built-in dashboard |

### Performance Considerations

- **Supabase**: Slightly higher latency due to HTTP API
- **PostgreSQL**: Lower latency with direct connection
- **Recommendation**: Supabase for most use cases, PostgreSQL for high-performance needs

## 🚨 Troubleshooting

### Common Issues

1. **"Failed to connect to Supabase"**
   - Check your `SUPABASE_URL` and `SUPABASE_ANON_KEY`
   - Ensure project is not paused
   - Verify network connectivity

2. **"Permission denied" errors**
   - Check Row Level Security policies
   - Use service role key for admin operations
   - Verify API key permissions

3. **"Table doesn't exist" errors**
   - Run the schema creation SQL
   - Check table names match exactly
   - Verify you're using the correct database

4. **Performance issues**
   - Add appropriate indexes
   - Optimize queries
   - Consider connection pooling

### Rollback Plan

If you need to rollback to PostgreSQL:

1. Remove Supabase environment variables:
   ```env
   # Comment out or remove these
   # SUPABASE_URL=...
   # SUPABASE_ANON_KEY=...
   ```

2. Ensure PostgreSQL variables are set:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/omegle_clone
   ```

3. Restart the application - it will automatically use PostgreSQL

## 📈 Monitoring and Maintenance

### Supabase Dashboard

Monitor your application through:

1. **Database** tab:
   - View table data
   - Run SQL queries
   - Monitor table sizes

2. **API** tab:
   - Track API usage
   - Monitor response times
   - View error rates

3. **Logs** tab:
   - Real-time application logs
   - Error tracking
   - Performance metrics

### Application Health Checks

The application includes health checks for both databases:

```bash
# Check overall health
curl http://localhost:3001/api/health

# Check statistics
curl http://localhost:3001/api/stats

# Admin dashboard (requires auth)
curl -H "Authorization: Bearer admin123" http://localhost:3001/api/admin/dashboard
```

## 🎯 Next Steps

After successful migration:

1. **Update Documentation**: Update your README with Supabase setup instructions
2. **Configure Monitoring**: Set up alerts in Supabase dashboard
3. **Optimize Performance**: Add indexes based on query patterns
4. **Set Up Backups**: Configure backup retention policies
5. **Plan Scaling**: Monitor usage and plan for scaling needs

## 🌟 Benefits Achieved

With Supabase, you now have:

- ✅ **Managed Infrastructure**: No database maintenance
- ✅ **Automatic Scaling**: Handles traffic spikes
- ✅ **Built-in Monitoring**: Real-time insights
- ✅ **Global Distribution**: Fast worldwide access
- ✅ **Automatic Backups**: Data protection
- ✅ **Security**: Built-in security features
- ✅ **API Generation**: Automatic REST APIs
- ✅ **Real-time Features**: WebSocket support

Your Omegle Clone is now production-ready with Supabase! 🚀