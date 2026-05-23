import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Save, Eye, History, AlertCircle } from 'lucide-react';
import {
  getNotificationTemplates,
  updateNotificationTemplate,
  getTemplateVersions,
  previewTemplate,
  type NotificationTemplate,
  type NotificationTemplateVersion,
} from '@/db/notifications';
import { toast } from 'sonner';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish (Español)' },
  { value: 'fr', label: 'French (Français)' },
  { value: 'de', label: 'German (Deutsch)' },
  { value: 'zh', label: 'Chinese (中文)' },
];

const NOTIFICATION_TYPES = [
  {
    value: 'return_period_adjustment',
    label: 'Return Period Adjustments',
    sampleData: { count: '5', reduce_count: '3', increase_count: '2' },
  },
  {
    value: 'payout_request',
    label: 'Payout Requests',
    sampleData: { seller_name: 'John Doe', amount: '$500' },
  },
  {
    value: 'order_update',
    label: 'Order Updates',
    sampleData: { order_number: 'ORD-12345', status: 'Delivered' },
  },
  {
    value: 'system',
    label: 'System Notifications',
    sampleData: { title: 'Maintenance', message: 'System will be down for maintenance' },
  },
];

export default function NotificationTemplatesPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [titleTemplate, setTitleTemplate] = useState('');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [versions, setVersions] = useState<NotificationTemplateVersion[]>([]);

  useEffect(() => {
    loadTemplates();
  }, [selectedLanguage]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await getNotificationTemplates(selectedLanguage);
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load notification templates');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTemplate = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    setTitleTemplate(template.title_template);
    setMessageTemplate(template.message_template);
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;

    setSaving(true);
    try {
      const success = await updateNotificationTemplate(editingTemplate.id, {
        title_template: titleTemplate,
        message_template: messageTemplate,
      });

      if (success) {
        toast.success('Template updated successfully');
        loadTemplates();
        setEditingTemplate(null);
      } else {
        toast.error('Failed to update template');
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    setPreviewOpen(true);
  };

  const handleViewVersions = async (template: NotificationTemplate) => {
    const data = await getTemplateVersions(template.id);
    setVersions(data);
    setVersionsOpen(true);
  };

  const getPreviewData = () => {
    if (!editingTemplate) return { title: '', message: '' };

    const typeConfig = NOTIFICATION_TYPES.find(t => t.value === editingTemplate.type);
    if (!typeConfig) return { title: '', message: '' };

    return previewTemplate(titleTemplate, messageTemplate, typeConfig.sampleData);
  };

  const getVariablesForType = (type: string): string[] => {
    const typeConfig = NOTIFICATION_TYPES.find(t => t.value === type);
    return typeConfig ? Object.keys(typeConfig.sampleData) : [];
  };

  if (loading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-12 w-64 mb-8 bg-muted" />
        <div className="grid gap-6">
          <Skeleton className="h-96 bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Notification Templates</h1>
          <p className="text-muted-foreground">
            Customize notification messages for different event types and languages
          </p>
        </div>
        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Template Variables
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Use variables in your templates with the syntax: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">{'{{variable_name}}'}</code>
                <br />
                Available variables depend on the notification type. They will be automatically replaced with actual values.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {NOTIFICATION_TYPES.map((typeConfig) => {
          const template = templates.find(t => t.type === typeConfig.value);
          const isEditing = editingTemplate?.id === template?.id;

          return (
            <Card key={typeConfig.value}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {typeConfig.label}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Variables: {getVariablesForType(typeConfig.value).map(v => (
                        <code key={v} className="bg-muted px-1 rounded text-xs mr-1">
                          {'{{' + v + '}}'}
                        </code>
                      ))}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {template && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewVersions(template)}
                      >
                        <History className="mr-2 h-4 w-4" />
                        History
                      </Button>
                    )}
                    {!isEditing && template && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTemplate(template)}
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!template ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No template found for this language
                  </div>
                ) : isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title Template</Label>
                      <Input
                        id="title"
                        value={titleTemplate}
                        onChange={(e) => setTitleTemplate(e.target.value)}
                        placeholder="Enter title template"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message Template</Label>
                      <Textarea
                        id="message"
                        value={messageTemplate}
                        onChange={(e) => setMessageTemplate(e.target.value)}
                        placeholder="Enter message template"
                        rows={4}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveTemplate} disabled={saving}>
                        <Save className="mr-2 h-4 w-4" />
                        Save Template
                      </Button>
                      <Button variant="outline" onClick={handlePreview}>
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditingTemplate(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Title</Label>
                      <p className="text-sm font-medium">{template.title_template}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Message</Label>
                      <p className="text-sm">{template.message_template}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Preview with sample data
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 border rounded-lg bg-muted">
              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Title</Label>
                  <p className="font-semibold">{getPreviewData().title}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Message</Label>
                  <p className="text-sm">{getPreviewData().message}</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog open={versionsOpen} onOpenChange={setVersionsOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>
              View and rollback to previous versions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {versions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No version history available
              </div>
            ) : (
              versions.map((version) => (
                <Card key={version.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        Version {version.version_number}
                      </CardTitle>
                      <Badge variant="outline">
                        {new Date(version.created_at).toLocaleDateString()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Title</Label>
                        <p className="text-sm font-medium">{version.title_template}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Message</Label>
                        <p className="text-sm">{version.message_template}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setVersionsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
