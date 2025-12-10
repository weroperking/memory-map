# Analytics & Monitoring Deployment Checklist

## 📋 Overview
This checklist ensures proper deployment and testing of the analytics infrastructure added to PhotoMap. The app now includes comprehensive event logging, error tracking, and feature usage monitoring.

## ✅ Pre-Deployment (Completed)

- [x] **Analytics Library Created** (`src/lib/analytics.ts`)
  - Core functions: `logActivity()`, `logError()`, `trackFeatureUsage()`, `updateStorageUsage()`
  - Convenience helpers: `analytics.photoUpload()`, `.mapStyleChange()`, `.upgradeComplete()`, etc.
  - Error handling wrapper: `handleError()` for centralized error logging
  
- [x] **Components Instrumented** (11/11)
  - PhotoUploader: Upload event tracking with file metrics
  - PhotoMap: Map views, style changes, cluster interactions
  - UpgradeModal: Subscription funnel (view → complete)
  - MetadataEditor: Feature usage and editing actions
  - PhotoGallery: Photo view tracking
  - PhotoDetail: Photo detail view with GPS detection
  - AIDetectionPanel: AI detection analysis and feature usage
  - GPSTipsDialog: Help feature usage tracking
  - Index: Page navigation tracking
  - Header: User login/logout tracking
  - Auth: Auth funnel with error logging

- [x] **Database Schema Created** (`supabase/migrations/002_add_email_and_monitoring.sql`)
  - ✓ Email field added to `profiles` table
  - ✓ `activity_logs` table (user actions)
  - ✓ `error_logs` table (error tracking)
  - ✓ `feature_usage` table (feature adoption)
  - ✓ `storage_usage` table (quota monitoring)
  - ✓ `app_metrics` table (general metrics)
  - ✓ RLS policies for data security
  - ✓ Indexes for query performance
  - ✓ Views for analytics queries

- [x] **TypeScript Types Updated** (`src/integrations/supabase/types.ts`)
  - Profiles table includes `email` field
  - New tables typed and exported

- [x] **Default Map Style Changed**
  - Map now defaults to `'carto-dark'` instead of `'carto-light'`

- [x] **Build Verified**
  - ✓ TypeScript compilation successful
  - ✓ No errors or warnings (chunk size warning is expected)
  - ✓ Production build completes successfully

## 🔥 Critical: Database Migration Deployment

### Before Running Migration
1. **Backup your Supabase database**
   ```bash
   # Via Supabase dashboard: Project Settings → Backups
   # Create a manual backup before running migrations
   ```

2. **Verify migration file**
   ```bash
   cat supabase/migrations/002_add_email_and_monitoring.sql
   ```

### Deploy the Migration

**Option A: Via Supabase CLI (Recommended)**
```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your_project_id

# Push the migration
supabase db push
```

**Option B: Via Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy-paste the contents of `supabase/migrations/002_add_email_and_monitoring.sql`
5. Click "Run"

**Option C: Verify What Will Be Created**
```bash
# Check the migration SQL file contents
cat supabase/migrations/002_add_email_and_monitoring.sql
```

### Post-Migration Verification
```sql
-- Verify tables were created
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Verify email column on profiles
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'email';

-- Check RLS is enabled on activity_logs
SELECT * FROM information_schema.role_table_grants 
WHERE table_name = 'activity_logs';
```

**Expected Output:** Should see 6 new tables and email column on profiles

## 🧪 Local Testing

### 1. Start Development Server
```bash
npm install  # Ensure dependencies are up-to-date
npm run dev
```

### 2. Test Analytics Events
Perform these actions and check the database for logged events:

**Upload Photo**
- Action: Upload a photo
- Expected: `activity_logs` entry with action='photo_upload', metadata includes file count and size
- Query: `SELECT * FROM activity_logs WHERE action = 'photo_upload' LIMIT 1;`

**View Map**
- Action: Navigate to map tab
- Expected: `feature_usage` entry for 'map_view'
- Query: `SELECT * FROM feature_usage WHERE feature_name = 'map_view';`

**Change Map Style**
- Action: Click map style selector dropdown, select different style
- Expected: `activity_logs` entry with action='map_style_change', feature_usage incremented for 'map_style_selector'
- Query: `SELECT * FROM activity_logs WHERE action = 'map_style_change' LIMIT 1;`

**Upgrade Modal**
- Action: Click upgrade button
- Expected: `activity_logs` entry with action='upgrade_view'
- Query: `SELECT * FROM activity_logs WHERE action = 'upgrade_view';`

**Metadata Editor**
- Action: Click "Edit All" in photo detail
- Expected: `feature_usage` entry for 'metadata_editor'
- Query: `SELECT * FROM feature_usage WHERE feature_name = 'metadata_editor';`

**Error Logging**
- Action: Try to upload a file > 5GB or trigger an error
- Expected: `error_logs` entry with component and error_message
- Query: `SELECT * FROM error_logs ORDER BY created_at DESC LIMIT 1;`

### 3. Browser Console Check
```javascript
// Check for any errors in browser console (F12)
// Should NOT see analytics errors like "table not found" or auth errors
```

### 4. Verify Default Map Style
- Action: Open the app
- Expected: Map loads with dark Carto style, not light
- Visual: Bottom-right corner should show dark theme tiles

## 📊 Dashboard Setup

Choose one of the following dashboard options:

### Option 1: Supabase Studio (Quickest)
1. Go to Supabase project dashboard
2. SQL Editor → Create queries for:
   ```sql
   -- Daily Active Users
   SELECT * FROM public.daily_active_users_view LIMIT 30;
   
   -- Recent Activity
   SELECT action, COUNT(*) as count, MAX(created_at) as latest
   FROM activity_logs
   GROUP BY action
   ORDER BY latest DESC;
   
   -- Feature Usage
   SELECT feature_name, SUM(usage_count) as total_uses, MAX(last_used_at) as latest
   FROM feature_usage
   GROUP BY feature_name
   ORDER BY total_uses DESC;
   
   -- Error Summary
   SELECT component, severity, COUNT(*) as count
   FROM error_logs
   GROUP BY component, severity
   ORDER BY count DESC;
   ```
3. Save as favorites for quick access

### Option 2: Grafana (Advanced Analytics)
1. Install Grafana: https://grafana.com/grafana/download
2. Add Supabase as data source:
   - Host: `<PROJECT_ID>.supabase.co`
   - Database: `postgres`
   - User: `postgres`
   - Password: From Supabase settings
   - SSL Mode: `require`
3. Create dashboards using the queries in `MONITORING.md`

### Option 3: Metabase (Most User-Friendly)
1. Sign up at https://www.metabase.com/ (free tier available)
2. Connect your Supabase database
3. Create questions/dashboards for metrics

## 🚨 Critical Alerts to Implement

### Alert 1: High Error Rate
```sql
-- Monitor every 5 minutes
SELECT COUNT(*) as error_count 
FROM error_logs 
WHERE created_at > NOW() - INTERVAL '5 minutes'
  AND severity = 'critical';
-- Alert if > 10 errors
```

### Alert 2: Service Down
```sql
-- Monitor every 15 minutes  
SELECT COUNT(DISTINCT user_id) as active_users
FROM activity_logs
WHERE created_at > NOW() - INTERVAL '15 minutes';
-- Alert if = 0
```

### Alert 3: Storage Quota Warning
```sql
-- Monitor every hour
SELECT user_id, total_bytes 
FROM storage_usage
WHERE (total_bytes / 1099511627776.0) > 0.8;  -- 80% of 1TB
```

## 🔒 Security Checklist

- [x] RLS policies enforced on all tables (users see only their own data)
- [x] Email field properly synced from auth.users via trigger
- [x] Error logs don't expose sensitive data in stack traces
- [x] IP addresses and user agents logged for security monitoring
- [x] All database connections use HTTPS/SSL

### Verify RLS is Working
```sql
-- Test as authenticated user (should see only their data)
SELECT * FROM activity_logs;  -- Should only return their rows

-- If using pgAdmin, verify policies exist
SELECT * FROM pg_policies WHERE tablename = 'activity_logs';
```

## 📈 Post-Deployment Metrics

After 24 hours, check these metrics:

1. **Daily Active Users**: `SELECT COUNT(DISTINCT user_id) FROM activity_logs WHERE created_at > NOW() - INTERVAL '24 hours';`
2. **Most Used Features**: `SELECT feature_name, SUM(usage_count) FROM feature_usage GROUP BY feature_name ORDER BY SUM DESC;`
3. **Error Rate**: `SELECT COUNT(*) FROM error_logs WHERE created_at > NOW() - INTERVAL '24 hours';`
4. **Storage Usage**: `SELECT SUM(total_bytes) as total_storage FROM storage_usage;`

## 🐛 Troubleshooting

### Issue: "Relation activity_logs does not exist"
**Solution**: Migration hasn't been deployed. Run `supabase db push`

### Issue: "Permission denied" on analytics queries
**Solution**: RLS policies are too restrictive or user isn't authenticated. Check auth status.

### Issue: Map doesn't load with dark style
**Solution**: Clear browser cache (Ctrl+Shift+Delete), reload page

### Issue: Analytics events not appearing in database
**Solution**: 
1. Check browser console for errors (F12)
2. Verify Supabase client is initialized correctly
3. Confirm user is authenticated (check auth.users)
4. Check RLS policies aren't blocking inserts

### Issue: Email field not syncing from auth.users
**Solution**: Migration trigger may not have executed. Manually run:
```sql
UPDATE profiles p 
SET email = u.email
FROM auth.users u 
WHERE p.user_id = u.id;
```

## ✨ Final Verification Checklist

Before going to production:

- [ ] Database migration deployed successfully
- [ ] All 6 new tables exist and have data
- [ ] Email field populated on profiles table
- [ ] Analytics events appearing when actions performed
- [ ] Error logging working (test by triggering an error)
- [ ] Map loads with dark Carto style by default
- [ ] No TypeScript errors: `npm run build`
- [ ] No console errors in browser: F12 → Console
- [ ] RLS policies verified working
- [ ] Dashboard set up with key metrics
- [ ] Critical alerts configured
- [ ] Team notified of new monitoring capabilities

## 📚 Documentation

- **Detailed Setup**: See `SETUP_ANALYTICS.sh`
- **Schema Details**: See `MONITORING.md`
- **Code Examples**: See `src/lib/analytics.ts` comments
- **API Reference**: See function JSDoc comments in `src/lib/analytics.ts`

## 🎉 Success Indicators

✓ All 11 components reporting analytics
✓ Database receiving event data in real-time  
✓ Zero errors related to analytics or logging
✓ Dashboard showing meaningful metrics
✓ Alerts detecting anomalies correctly
✓ Team has visibility into app health and usage

---

**Last Updated**: {{ DATE }}
**Status**: Ready for Production Deployment
**Migration File**: `supabase/migrations/002_add_email_and_monitoring.sql`
