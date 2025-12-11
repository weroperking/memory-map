/**
 * Analytics & Monitoring Utilities
 * Simple client-side analytics (no database dependencies)
 */

/**
 * Log activity to console (can be extended to send to analytics service)
 */
const logActivity = (
  action: string,
  resourceType?: string,
  _resourceId?: string,
  metadata?: Record<string, unknown>
) => {
  if (import.meta.env.DEV) {
    console.log('[Analytics]', action, resourceType, metadata);
  }
};

/**
 * Track feature usage
 */
const trackFeatureUsage = (featureName: string) => {
  if (import.meta.env.DEV) {
    console.log('[Feature]', featureName);
  }
};

/**
 * Convenient logging functions for common actions
 */
export const analytics = {
  // Core logging
  logActivity,
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
 * Track page/view events
 */
export const logPageView = (pageName: string, metadata?: Record<string, unknown>) => {
  logActivity('page_view', 'page', undefined, { page: pageName, ...metadata });
};

/**
 * Helper: Log error in catch blocks
 */
export const handleError = (err: Error, component: string, _metadata?: Record<string, unknown>) => {
  console.error(`Error in ${component}:`, err);
};
