/**
 * Analytics & Monitoring Utilities
 * Log user activity, errors, and feature usage to Supabase
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Log a user activity event (photo upload, feature use, view, etc.)
 */
export const logActivity = async (
  action: string,
  resourceType?: string,
  resourceId?: string,
  metadata?: Record<string, any>
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata,
      ip_address: undefined, // Will be captured server-side if needed
      user_agent: navigator.userAgent,
    });
  } catch (err) {
    console.error('Error logging activity:', err);
  }
};

/**
 * Log an error event for debugging and monitoring
 */
export const logError = async (
  error: Error | string,
  component: string,
  severity: 'error' | 'warning' | 'critical' = 'error',
  metadata?: Record<string, any>
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? undefined : error.stack;

    await supabase.from('error_logs').insert({
      user_id: user?.id,
      error_message: errorMessage,
      error_stack: errorStack,
      component,
      severity,
      metadata,
    });
  } catch (err) {
    console.error('Error logging error:', err);
  }
};

/**
 * Track feature usage for product analytics
 */
export const trackFeatureUsage = async (featureName: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('feature_usage')
      .upsert(
        {
          user_id: user.id,
          feature_name: featureName,
          last_used_at: new Date().toISOString(),
          usage_count: 1, // Will be incremented by trigger or separate logic
        },
        {
          onConflict: 'user_id,feature_name',
        }
      );

    if (error) {
      console.error('Error tracking feature usage:', error);
    }
  } catch (err) {
    console.error('Error in trackFeatureUsage:', err);
  }
};

/**
 * Update user's storage usage (call after photo upload/delete)
 */
export const updateStorageUsage = async (userId: string) => {
  try {
    // If you have a photos table, query total size
    // For now, this is a placeholder
    const totalBytes = 0; // Calculate from your photos/storage table
    const photoCount = 0;

    await supabase
      .from('storage_usage')
      .upsert({
        user_id: userId,
        total_bytes: totalBytes,
        photo_count: photoCount,
        last_updated: new Date().toISOString(),
      });
  } catch (err) {
    console.error('Error updating storage usage:', err);
  }
};

/**
 * Convenient logging functions for common actions
 */
export const analytics = {
  // Core logging
  logActivity,
  logError,
  trackFeatureUsage,
  
  // Photo actions
  photoUpload: (count: number, totalSize: number) =>
    logActivity('photo_upload', 'photo', undefined, { count, total_size: totalSize }),
  
  photoDelete: (count: number) =>
    logActivity('photo_delete', 'photo', undefined, { count }),
  
  // Map actions
  mapView: () => logActivity('map_view', 'map'),
  
  mapStyleChange: (style: string) => {
    logActivity('map_style_change', 'map', undefined, { style });
    trackFeatureUsage('map_style_selector');
  },
  
  // Metadata actions
  metadataEdit: (photoCount: number) =>
    logActivity('metadata_edit', 'photo', undefined, { photo_count: photoCount }),
  
  // Upgrade flow
  upgradeView: (source?: string) =>
    logActivity('upgrade_view', 'subscription', undefined, { source }),
  
  upgradeComplete: (plan: string, period: string) =>
    logActivity('upgrade_complete', 'subscription', undefined, { plan, period }),
  
  // Feature usage
  featureUse: (featureName: string) => trackFeatureUsage(featureName),
};

/**
 * Track page/view events (call on navigation)
 */
export const logPageView = (pageName: string, metadata?: Record<string, any>) => {
  logActivity('page_view', 'page', undefined, { page: pageName, ...metadata });
};

/**
 * Helper: Log error in catch blocks
 */
export const handleError = async (err: Error, component: string, metadata?: Record<string, any>) => {
  console.error(`Error in ${component}:`, err);
  await logError(err, component, 'error', metadata);
};
