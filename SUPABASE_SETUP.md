# Supabase Setup Guide

This guide explains how to set up Supabase as the database for the Omegle Clone application.

## Why Supabase?

Supabase provides several advantages over self-hosted PostgreSQL:

- **Managed Database**: No need to manage PostgreSQL infrastructure
- **Built-in Authentication**: Ready-to-use auth system (if needed later)
- **Real-time Subscriptions**: Built-in real-time features
- **Dashboard**: Web interface for database management
- **Automatic Backups**: Built-in backup and recovery
- **Global CDN**: Fast access worldwide
- **Free Tier**: Generous free tier for development

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Choose your organization
5. Fill in project details:
   - **Name**: `Random-chat`
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your users
6. Click "Create new project"
7. Wait for the project to be created (2-3 minutes)

### 2. Get Project Credentials

Once your project is ready:

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project.supabase.co`)
   - **Project API Keys**:
     - `anon` `public` key (for client-side)
     - `service_role` `secret` key (for server-side)

### 3. Update Environment Variables

Update your `backend/.env` file:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 4. Set Up Database Schema

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click "New Query"
4. Copy and paste the contents of `backend/supabase-schema.sql`
5. Click "Run" to execute the schema

Alternatively, you can run it from the command line:
```bash
# Copy the schema file content and paste it in Supabase SQL Editor
cat backend/supabase-schema.sql
```

### 5. Configure Row Level Security (Optional)

The schema includes RLS policies that:
- Allow full access for the service role (your backend)
- Allow public read access for statistics (optional)
- Secure user data appropriately

You can modify these policies in the Supabase dashboard under **Authentication** → **Policies**.

### 6. Test the Connection

```bash
cd backend
npm run dev
```

The application will automatically detect Supabase configuration and use it instead of PostgreSQL.

## Environment Configuration

### Development
```env
NODE_ENV=development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Production
```env
NODE_ENV=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Database Management

### Using Supabase Dashboard

1. **View Data**: Go to **Table Editor** to see your data
2. **Run Queries**: Use **SQL Editor** for custom queries
3. **Monitor Performance**: Check **Reports** for insights
4. **Manage Backups**: Configure in **Settings** → **Database**

### Using the Application

The application includes several management endpoints:

```bash
# Get database statistics
curl http://localhost:3001/api/health

# Get detailed stats
curl http://localhost:3001/api/stats/summary

# Admin dashboard (requires authentication)
curl -H "Authorization: Bearer your_admin_password" \
     http://localhost:3001/api/admin/dashboard
```

## Migration from PostgreSQL

If you're migrating from the local PostgreSQL setup:

### 1. Export Existing Data (if any)
```bash
# Export from local PostgreSQL
pg_dump -h localhost -U postgres omegle_clone > backup.sql
```

### 2. Import to Supabase
1. Clean the backup file to remove PostgreSQL-specific commands
2. Run the cleaned SQL in Supabase SQL Editor
3. Or use Supabase CLI for migration

### 3. Update Configuration
1. Update environment variables to use Supabase
2. Restart your application
3. Test all functionality

## Supabase Features Used

### Core Database Features
- **PostgreSQL**: Full PostgreSQL compatibility
- **UUID Extensions**: For generating unique IDs
- **JSONB Support**: For flexible metadata storage
- **Triggers**: Automatic timestamp updates
- **Indexes**: Optimized query performance

### Supabase-Specific Features
- **Row Level Security**: Secure data access
- **Real-time Subscriptions**: For live updates (can be added later)
- **Built-in Auth**: Ready for user authentication (if needed)
- **Dashboard**: Web interface for management

## Performance Considerations

### Connection Pooling
Supabase handles connection pooling automatically, but you can configure:

```typescript
const supabase = createClient(url, key, {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});
```

### Query Optimization
- Use indexes (already included in schema)
- Use `select()` to limit returned columns
- Use `limit()` for pagination
- Use `single()` when expecting one result

### Monitoring
- Monitor usage in Supabase dashboard
- Set up alerts for high usage
- Use the built-in performance insights

## Troubleshooting

### Connection Issues

1. **Check credentials** in `.env` file
2. **Verify project URL** format: `https://your-project.supabase.co`
3. **Check API keys** are correct (anon vs service_role)
4. **Verify network access** (firewall, VPN issues)

### Schema Issues

1. **Run schema again** in SQL Editor
2. **Check table permissions** in Table Editor
3. **Verify RLS policies** in Authentication → Policies
4. **Check for naming conflicts** with reserved words

### Performance Issues

1. **Check query performance** in Reports
2. **Add missing indexes** if needed
3. **Monitor connection usage** in dashboard
4. **Consider upgrading plan** if hitting limits

## Supabase CLI (Optional)

For advanced management, install Supabase CLI:

```bash
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Generate TypeScript types
supabase gen types typescript --project-id your-project-ref > types/supabase.ts
```

## Cost Considerations

### Free Tier Limits
- **Database**: 500MB storage
- **Bandwidth**: 5GB per month
- **Requests**: 50,000 monthly active users
- **Realtime**: 200 concurrent connections

### Paid Plans
- **Pro**: $25/month per project
- **Team**: $599/month per organization
- **Enterprise**: Custom pricing

For a chat application, monitor:
- Database storage (sessions and reports)
- API requests (chat messages, matchmaking)
- Realtime connections (if using Supabase realtime)

## Security Best Practices

1. **Use Service Role Key** for server-side operations
2. **Never expose Service Role Key** in frontend
3. **Configure RLS policies** appropriately
4. **Use HTTPS** in production
5. **Rotate API keys** regularly
6. **Monitor access logs** in dashboard

## Next Steps

After setting up Supabase:

1. **Test the connection** by starting the application
2. **Verify data operations** by creating test sessions
3. **Check admin dashboard** functionality
4. **Monitor performance** in Supabase dashboard
5. **Set up alerts** for usage limits
6. **Configure backups** if needed

The application will automatically detect Supabase configuration and use it seamlessly!