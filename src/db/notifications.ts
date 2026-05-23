import { supabase } from './supabase';

export interface Notification {
  id: string;
  user_id: string;
  type: 'return_period_adjustment' | 'payout_request' | 'order_update' | 'system';
  title: string;
  message: string;
  data: Record<string, any>;
  read: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  return_period_adjustment_enabled: boolean;
  payout_request_enabled: boolean;
  order_update_enabled: boolean;
  system_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Get notifications for current user
export async function getNotifications(limit = 50): Promise<Notification[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get notifications:', error);
    return [];
  }
}

// Get unread notification count
export async function getUnreadCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('read', false);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Failed to get unread count:', error);
    return 0;
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return false;
  }
}

// Mark all notifications as read
export async function markAllAsRead(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to mark all as read:', error);
    return false;
  }
}

// Get notification preferences
export async function getNotificationPreferences(): Promise<NotificationPreferences | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    
    // If no preferences exist, create default ones
    if (!data) {
      const { data: newPrefs, error: insertError } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: user.id,
          return_period_adjustment_enabled: true,
          payout_request_enabled: true,
          order_update_enabled: true,
          system_enabled: true,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return newPrefs;
    }
    
    return data;
  } catch (error) {
    console.error('Failed to get notification preferences:', error);
    return null;
  }
}

// Update notification preferences
export async function updateNotificationPreferences(
  preferences: Partial<NotificationPreferences>
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('notification_preferences')
      .update({
        ...preferences,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to update notification preferences:', error);
    return false;
  }
}

// Subscribe to real-time notifications
export function subscribeToNotifications(
  userId: string,
  onNotification: (notification: Notification) => void
) {
  const channel = supabase
    .channel('notifications-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onNotification(payload.new as Notification);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Notification Templates

export interface NotificationTemplate {
  id: string;
  type: 'return_period_adjustment' | 'payout_request' | 'order_update' | 'system';
  language: string;
  title_template: string;
  message_template: string;
  variables: string[];
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationTemplateVersion {
  id: string;
  template_id: string;
  version_number: number;
  title_template: string;
  message_template: string;
  variables: string[];
  created_by?: string;
  created_at: string;
}

// Get all notification templates
export async function getNotificationTemplates(language?: string): Promise<NotificationTemplate[]> {
  try {
    let query = supabase
      .from('notification_templates')
      .select('*')
      .order('type');

    if (language) {
      query = query.eq('language', language);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get notification templates:', error);
    return [];
  }
}

// Get template by type and language
export async function getTemplateByTypeAndLanguage(
  type: string,
  language: string = 'en'
): Promise<NotificationTemplate | null> {
  try {
    const { data, error } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('type', type)
      .eq('language', language)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to get template:', error);
    return null;
  }
}

// Update notification template
export async function updateNotificationTemplate(
  id: string,
  updates: Partial<NotificationTemplate>
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('notification_templates')
      .update({
        ...updates,
        created_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to update template:', error);
    return false;
  }
}

// Get template versions
export async function getTemplateVersions(templateId: string): Promise<NotificationTemplateVersion[]> {
  try {
    const { data, error } = await supabase
      .from('notification_template_versions')
      .select('*')
      .eq('template_id', templateId)
      .order('version_number', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get template versions:', error);
    return [];
  }
}

// Rollback to version
export async function rollbackToVersion(
  templateId: string,
  versionId: string
): Promise<boolean> {
  try {
    // Get version details
    const { data: version, error: versionError } = await supabase
      .from('notification_template_versions')
      .select('*')
      .eq('id', versionId)
      .single();

    if (versionError) throw versionError;
    if (!version) throw new Error('Version not found');

    // Update template with version data
    const success = await updateNotificationTemplate(templateId, {
      title_template: version.title_template,
      message_template: version.message_template,
      variables: version.variables,
    });

    return success;
  } catch (error) {
    console.error('Failed to rollback to version:', error);
    return false;
  }
}

// Preview template with sample data
export function previewTemplate(
  titleTemplate: string,
  messageTemplate: string,
  sampleData: Record<string, string | undefined>
): { title: string; message: string } {
  let title = titleTemplate;
  let message = messageTemplate;

  // Replace variables with sample data
  Object.entries(sampleData).forEach(([key, value]) => {
    if (value !== undefined) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      title = title.replace(regex, value);
      message = message.replace(regex, value);
    }
  });

  return { title, message };
}

// Notification Analytics

export interface TemplateAnalytics {
  template_id: string;
  template_type: string;
  language: string;
  title_template: string;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  open_rate: number;
  click_rate: number;
  click_through_rate: number;
}

export interface LanguagePerformance {
  language: string;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  open_rate: number;
  click_rate: number;
}

export interface EngagementTrend {
  period: string;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  open_rate: number;
}

// Track notification open
export async function trackNotificationOpen(notificationId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('track_notification_open', {
      p_notification_id: notificationId,
    });

    if (error) throw error;
    return data || false;
  } catch (error) {
    console.error('Failed to track notification open:', error);
    return false;
  }
}

// Track notification click
export async function trackNotificationClick(notificationId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('track_notification_click', {
      p_notification_id: notificationId,
    });

    if (error) throw error;
    return data || false;
  } catch (error) {
    console.error('Failed to track notification click:', error);
    return false;
  }
}

// Get template analytics
export async function getTemplateAnalytics(
  startDate?: Date,
  endDate?: Date
): Promise<TemplateAnalytics[]> {
  try {
    const params: any = {};
    if (startDate) params.p_start_date = startDate.toISOString();
    if (endDate) params.p_end_date = endDate.toISOString();

    const { data, error } = await supabase.rpc('get_template_analytics', params);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get template analytics:', error);
    return [];
  }
}

// Get language performance
export async function getLanguagePerformance(
  startDate?: Date,
  endDate?: Date
): Promise<LanguagePerformance[]> {
  try {
    const params: any = {};
    if (startDate) params.p_start_date = startDate.toISOString();
    if (endDate) params.p_end_date = endDate.toISOString();

    const { data, error } = await supabase.rpc('get_language_performance', params);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get language performance:', error);
    return [];
  }
}

// Get engagement trends
export async function getEngagementTrends(
  startDate?: Date,
  endDate?: Date,
  interval: 'day' | 'week' | 'month' = 'day'
): Promise<EngagementTrend[]> {
  try {
    const params: any = { p_interval: interval };
    if (startDate) params.p_start_date = startDate.toISOString();
    if (endDate) params.p_end_date = endDate.toISOString();

    const { data, error } = await supabase.rpc('get_engagement_trends', params);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get engagement trends:', error);
    return [];
  }
}

// Get most effective templates
export async function getMostEffectiveTemplates(
  startDate?: Date,
  endDate?: Date,
  limit: number = 5
): Promise<TemplateAnalytics[]> {
  try {
    const analytics = await getTemplateAnalytics(startDate, endDate);
    
    // Sort by engagement score (weighted combination of open rate and click rate)
    return analytics
      .map(a => ({
        ...a,
        engagement_score: (a.open_rate * 0.6) + (a.click_rate * 0.4),
      }))
      .sort((a, b) => b.engagement_score - a.engagement_score)
      .slice(0, limit);
  } catch (error) {
    console.error('Failed to get most effective templates:', error);
    return [];
  }
}
