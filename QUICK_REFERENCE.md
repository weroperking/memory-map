# 🚀 PhotoMap Analytics - Quick Reference Card

## Immediate Next Steps (Deployment)

```bash
# 1. Deploy database migration
cd /workspaces/memory-map
supabase login
supabase link --project-ref YOUR_PROJECT_ID
supabase db push

# 2. Test locally
npm run dev

# 3. Verify analytics are working
# - Upload a photo → Check activity_logs table
# - Change map style → Check feature_usage table
# - Trigger error → Check error_logs table
```

## 📊 Dashboard Quick Links

### Supabase Studio (Fastest Setup)
- Go to: https://app.supabase.com → Your Project → SQL Editor
- Paste any query from MONITORING.md → Run

### Key Metrics Queries (Copy-Paste Ready)

**Daily Active Users**
```sql
SELECT DATE(created_at) as date, COUNT(DISTINCT user_id) as users
FROM activity_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

**Top Features**
```sql
SELECT feature_name, SUM(usage_count) as uses, COUNT(DISTINCT user_id) as users
FROM feature_usage
GROUP BY feature_name
ORDER BY uses DESC;
```

**Recent Errors**
```sql
SELECT component, severity, error_message, created_at
FROM error_logs
ORDER BY created_at DESC
LIMIT 20;
```

**Storage Analysis**
```sql
SELECT user_id, total_bytes / 1024.0 / 1024.0 / 1024.0 as gb_used, photo_count
FROM storage_usage
WHERE total_bytes > 0
ORDER BY total_bytes DESC;
```

## 📁 File Reference

| File | Purpose | Status |
|------|---------|--------|
| `src/lib/analytics.ts` | Core analytics library | ✅ Ready |
| `supabase/migrations/002_add_email_and_monitoring.sql` | DB schema | ⏳ Deploy |
| `src/integrations/supabase/types.ts` | TypeScript types | ✅ Updated |
| `MONITORING.md` | Detailed documentation | ✅ Ready |
| `DEPLOYMENT_CHECKLIST.md` | Verification procedures | ✅ Ready |
| `ANALYTICS_IMPLEMENTATION_SUMMARY.md` | Implementation overview | ✅ Ready |

## 🎯 What's Tracked (11 Components)

| Component | What's Logged | How to Test |
|-----------|---------------|------------|
| PhotoUploader | File uploads | Upload a photo |
| PhotoMap | Map views, style changes | View map, change style |
| UpgradeModal | Upgrade impressions, conversions | Click upgrade button |
| MetadataEditor | Feature usage, edits | Open metadata editor |
| PhotoGallery | Photo views | Click a photo |
| PhotoDetail | Detail views, GPS status | Open photo detail |
| AIDetectionPanel | AI analysis usage | Click "Run AI Detection" |
| GPSTipsDialog | Help feature usage | Click "GPS Tips" |
| Index | Page navigation | Switch gallery/map |
| Header | Login/logout events | Sign in/out |
| Auth | Signup/signin, errors | Create account, login |

## 🔑 Key Functions

```typescript
// Import once per file
import { analytics, handleError } from '@/lib/analytics';

// Log any action
analytics.logActivity('action_name', 'resource_type', 'resource_id', { optional: 'metadata' });

// Track feature usage
analytics.trackFeatureUsage('feature_name');

// Log errors centrally
handleError(error, 'ComponentName', { context: 'value' });

// Convenience helpers
analytics.photoUpload(3, 15728640);        // 3 files, ~15MB
analytics.mapStyleChange('carto-dark');   // Map style preference
analytics.upgradeComplete('pro', 'monthly'); // Subscription
```

## 🗄️ Database Tables (Created by Migration)

```
activity_logs       → User actions (uploads, views, clicks)
error_logs          → Errors (with component, stack trace, severity)
feature_usage       → Feature adoption (usage counts, last used)
storage_usage       → Quota tracking (bytes used, photo count)
app_metrics         → System metrics (performance, health)
profiles (updated)  → User data (email field added)
```

## ✅ Verification Checklist

After deploying migration:
```sql
-- Run these queries to verify

-- 1. Check tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%log%';

-- 2. Check email field exists
SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email';

-- 3. Check RLS is enabled
SELECT * FROM pg_policies WHERE tablename = 'activity_logs';

-- 4. Check indexes
SELECT indexname FROM pg_indexes WHERE tablename IN ('activity_logs', 'error_logs', 'feature_usage');
```

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| "Relation activity_logs does not exist" | Run migration: `supabase db push` |
| Analytics not appearing in DB | Check browser console (F12) for errors |
| Map doesn't show dark style | Clear cache: Ctrl+Shift+Delete, reload |
| Permission denied on queries | Verify user is authenticated |
| Email field not syncing | Check migration ran, check trigger in psql |

## 🎓 Usage Pattern (Standard)

```typescript
// 1. Import at top of component
import { analytics, handleError } from '@/lib/analytics';

// 2. In useEffect for feature tracking
useEffect(() => {
  analytics.trackFeatureUsage('feature_name');
}, []);

// 3. In event handler for actions
const handleClick = async () => {
  try {
    await doSomething();
    analytics.logActivity('action', 'resource', id);
  } catch (error) {
    handleError(error as Error, 'ComponentName', { action: 'click' });
  }
};
```

## 📈 Expected Data After 24 Hours

- Daily Active Users: 1+ (you testing)
- Events Logged: 20-100+ (depends on testing intensity)
- Features Tracked: 8-12 (all instrumented components)
- No Errors: ✅ (unless intentionally triggered)

## 🎉 Success Criteria

- [ ] Migration deployed successfully
- [ ] Tables created and populated with test data
- [ ] Dashboard shows metrics
- [ ] No TypeScript errors (`npm run build`)
- [ ] Analytics library functions work
- [ ] Browser console clean (no errors)
- [ ] RLS policies verified
- [ ] Email syncing working

## 📞 Help References

| Question | Where to Find Answer |
|----------|---------------------|
| How do I deploy? | DEPLOYMENT_CHECKLIST.md → Database Migration Deployment |
| How do I test? | DEPLOYMENT_CHECKLIST.md → Local Testing |
| What's the schema? | MONITORING.md → Schema Overview |
| How do I set up dashboards? | MONITORING.md → Dashboard Setup + SETUP_ANALYTICS.sh |
| Can I see example queries? | MONITORING.md → Pre-built Queries |
| What about security? | DEPLOYMENT_CHECKLIST.md → Security Checklist |
| How do I add new events? | ANALYTICS_IMPLEMENTATION_SUMMARY.md → Usage Examples |

---

**Status**: 🟢 Ready for Deployment
**Build**: ✅ Passing
**Type Safety**: ✅ Complete
**Documentation**: ✅ Comprehensive

**Next Action**: Run `supabase db push` to deploy migration ⬇️
