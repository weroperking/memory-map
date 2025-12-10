# Database Schema & Monitoring Recommendations

## Current Schema Summary
Your app uses Supabase with the following tables:
- `auth.users` (Supabase managed)
- `profiles` (user display name, avatar)
- `subscriptions` (user subscription status and plan)

---

## 1. **Email Storage (Implementation)**

### What Changed
✅ **Added** `email` field to `profiles` table
- Denormalized from `auth.users.email` for faster access (no JOIN needed)
- Synced automatically via trigger `sync_email_on_auth_user_update`
- Indexed for quick lookups

### Why
- You can now query user email directly from `profiles` table without joining to `auth.users`
- Useful for email notifications, reports, and user searches

### Usage in Code
```typescript
// In src/integrations/supabase/types.ts, add email to Profile interface:
interface Profile {
  id: string;
  user_id: string;
  email: string;  // ← NEW
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// In your app, you can now use:
const userEmail = profile.email; // No need to fetch from user object
```

---

## 2. **Activity Logs Table** (Tracking User Behavior)

### Purpose
Log every significant user action for:
- **Product analytics**: Which features are used, by whom, when
- **Debugging**: Trace user actions leading to errors
- **Compliance**: Audit trail of user activity

### Fields
| Field | Purpose |
|-------|---------|
| `action` | Type of action: `photo_upload`, `metadata_edit`, `map_view`, `upgrade_view`, `upgrade_complete` |
| `resource_type` | What was affected: `photo`, `subscription`, `profile` |
| `metadata` | Flexible JSON: file size, photo count, location data, error details |
| `ip_address` | User's IP (for abuse detection, geo-location) |
| `user_agent` | Browser/device info (for device analytics) |

### Example Queries
```sql
-- DAU (Daily Active Users)
SELECT DATE(created_at), COUNT(DISTINCT user_id)
FROM activity_logs
GROUP BY DATE(created_at)
ORDER BY DATE DESC;

-- Feature adoption: how many users used photo upload this month?
SELECT COUNT(DISTINCT user_id)
FROM activity_logs
WHERE action = 'photo_upload'
AND created_at > NOW() - INTERVAL '30 days';

-- Trace user journey leading to upgrade
SELECT * FROM activity_logs
WHERE user_id = 'xxx'
ORDER BY created_at;
```

---

## 3. **App Metrics Table** (System Health & KPIs)

### Purpose
Track overall app performance metrics:
- Daily active users
- Total photos uploaded per day
- Subscription churn rate
- API response times
- Error rates

### What to Track
| Metric | Example Value |
|--------|---------------|
| `daily_active_users` | 150 |
| `photos_uploaded_daily` | 523 |
| `subscriptions_active` | 45 |
| `avg_response_time_ms` | 230 |
| `error_rate_percent` | 0.8 |
| `storage_used_gb` | 45.2 |

### Example: Daily Metric Logging
```typescript
// In a scheduled function (Supabase cron or edge function)
const dau = await db
  .from('activity_logs')
  .select('user_id')
  .gte('created_at', today)
  .lt('created_at', tomorrow)
  .then(data => new Set(data.map(r => r.user_id)).size);

await db.from('app_metrics').insert({
  metric_type: 'daily_active_users',
  metric_value: dau,
  created_at: new Date()
});
```

---

## 4. **Error Logs Table** (Debugging & Monitoring)

### Purpose
Capture all errors (client + server) for:
- **Debugging**: Stack traces, error context
- **Alerting**: Spike detection (e.g., "5 critical errors in 10 mins")
- **User support**: "Why did my upload fail?"

### Fields
| Field | Purpose |
|-------|---------|
| `severity` | `error`, `warning`, `critical` |
| `component` | Where error happened: `PhotoUploader`, `PhotoMap`, `MetadataEditor` |
| `error_message` | "CORS error", "Storage quota exceeded" |
| `error_stack` | Full stack trace for debugging |
| `metadata` | Context: `{file_name: "photo.jpg", file_size: 5242880}` |

### Example Error Logging (Client-side)
```typescript
// In src/pages/Index.tsx or error boundary
const logError = async (error: Error, component: string, metadata?: any) => {
  await supabase.from('error_logs').insert({
    user_id: user?.id,
    error_message: error.message,
    error_stack: error.stack,
    component,
    severity: 'error',
    metadata
  });
};

try {
  await addPhotos(files);
} catch (err) {
  logError(err as Error, 'PhotoUploader', { 
    file_count: files.length,
    total_size: Array.from(files).reduce((sum, f) => sum + f.size, 0)
  });
  toast.error('Upload failed');
}
```

---

## 5. **Feature Usage Table** (Product Adoption)

### Purpose
Track which features users engage with, for:
- **Product decisions**: Should we invest in map styles? AI detection?
- **Onboarding**: Identify which features drive engagement
- **Free-to-Pro conversion**: Does metadata editing drive upgrades?

### Example
```typescript
// When user selects a map style
const trackFeatureUsage = async (featureName: string) => {
  const { data, error } = await supabase
    .from('feature_usage')
    .upsert({
      user_id: user.id,
      feature_name: featureName,
      last_used_at: new Date(),
      usage_count: (data?.usage_count || 0) + 1
    }, {
      onConflict: 'user_id,feature_name'
    });
};

// In PhotoMap.tsx
const handleMapStyleChange = (style: MapStyle) => {
  setMapStyle(style);
  trackFeatureUsage('map_style_selector');
};
```

---

## 6. **Storage Usage Table** (Resource Tracking)

### Purpose
- Track per-user storage consumption (for quota enforcement)
- Identify power users
- Plan infrastructure capacity

### Update Trigger
```typescript
// After photo upload, update storage_usage
const updateStorageUsage = async (userId: string) => {
  const { data: photos } = await supabase
    .from('photos') // or your photos table
    .select('size')
    .eq('user_id', userId);
  
  const totalBytes = photos.reduce((sum, p) => sum + p.size, 0);
  
  await supabase
    .from('storage_usage')
    .upsert({
      user_id: userId,
      total_bytes: totalBytes,
      photo_count: photos.length,
      last_updated: new Date()
    });
};
```

---

## 7. **Monitoring Views** (Pre-built Queries)

Two views are provided for quick insights:

### `daily_active_users_view`
```sql
SELECT * FROM daily_active_users_view LIMIT 30;
-- Returns: activity_date, active_user_count, total_actions
```

### `subscription_revenue_view`
```sql
SELECT * FROM subscription_revenue_view;
-- Returns: creation_date, plan, subscription_count, status
-- Use to track: "How many yearly subscriptions created today?"
```

---

## 8. **Recommended Alerts & Dashboards**

### Critical Alerts (Email/Slack)
- **Error spike**: > 10 errors in 5 minutes → Immediate investigation
- **Service down**: 0 DAU for 15 minutes → P1 incident
- **Storage quota**: User hits 80% of limit → Warn user, auto-cleanup or charge upgrade

### Dashboards to Build
1. **Health**: DAU, error rate, avg response time (last 7 days)
2. **Revenue**: Active subscriptions, new signups, churn rate (daily)
3. **Feature**: Top 5 features used this week, new feature adoption rate
4. **Support**: Top errors, affected users, resolution status

### Example Monitoring Query (Grafana/Tableau)
```sql
-- Daily metrics (for dashboard)
SELECT 
  DATE(al.created_at) as date,
  COUNT(DISTINCT al.user_id) as dau,
  COUNT(CASE WHEN action = 'photo_upload' THEN 1 END) as photo_uploads,
  COUNT(CASE WHEN action = 'upgrade_view' THEN 1 END) as upgrade_views,
  COUNT(CASE WHEN el.id IS NOT NULL THEN 1 END) as error_count
FROM activity_logs al
LEFT JOIN error_logs el ON DATE(al.created_at) = DATE(el.created_at)
GROUP BY DATE(al.created_at)
ORDER BY date DESC;
```

---

## 9. **Implementation Checklist**

- [ ] **Deploy migration** (`002_add_email_and_monitoring.sql`)
- [ ] **Update TypeScript types** (add new interfaces to `src/integrations/supabase/types.ts`)
- [ ] **Add client-side logging**:
  - [ ] `logActivity()` function in utils
  - [ ] Call on photo upload, map view, feature use
  - [ ] Call on errors
- [ ] **Add server-side logging** (Edge Function):
  - [ ] Log subscription changes
  - [ ] Log failed API calls
  - [ ] Log quota exceeded events
- [ ] **Set up dashboards** (Supabase UI, Grafana, Tableau, or Metabase)
- [ ] **Set up alerts** (PagerDuty, Slack, email)

---

## 10. **Privacy & Compliance**

- **GDPR**: Make sure to delete activity/error logs when user requests account deletion
  - Update: `ON DELETE CASCADE` already handles this
- **IP Logging**: Check local privacy laws before storing IP addresses
- **Sensitive Data**: Don't log file contents, full paths, or user passwords

---

## Summary: What to Add to Your Code

### In `src/integrations/supabase/types.ts`
```typescript
// Update Profile interface
interface Profile {
  id: string;
  user_id: string;
  email: string; // ← NEW
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// Add new interfaces for analytics
interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

interface FeatureUsage {
  user_id: string;
  feature_name: string;
  usage_count: number;
  last_used_at: string;
}
```

### In a new `src/lib/analytics.ts`
```typescript
import { supabase } from '@/integrations/supabase/client';

export const logActivity = async (
  action: string,
  resource_type?: string,
  metadata?: any
) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('activity_logs').insert({
    user_id: user.id,
    action,
    resource_type,
    metadata,
  });
};

export const logError = async (
  error: Error,
  component: string,
  metadata?: any
) => {
  const { data: { user } } = await supabase.auth.getUser();

  await supabase.from('error_logs').insert({
    user_id: user?.id,
    error_message: error.message,
    error_stack: error.stack,
    component,
    severity: 'error',
    metadata,
  });
};

export const trackFeatureUsage = async (featureName: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('feature_usage').upsert({
    user_id: user.id,
    feature_name: featureName,
    last_used_at: new Date(),
    usage_count: 1,
  });
};
```

---

Done! Deploy the migration, and you're ready to start monitoring.
