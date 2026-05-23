import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Mail, Plus, Trash2, CheckCircle2, XCircle, Send, Eye, EyeOff } from 'lucide-react';
import { 
  getAllEmailConfigurations, 
  createEmailConfiguration, 
  updateEmailConfiguration,
  deleteEmailConfiguration,
  activateEmailConfiguration,
  supabase
} from '@/db/api';
import type { EmailConfiguration, EmailProvider } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminEmailConfigPage() {
  const { user } = useAuth();
  const [configurations, setConfigurations] = useState<EmailConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [testingEmail, setTestingEmail] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<{ [key: string]: boolean }>({});
  
  // Form state
  const [formData, setFormData] = useState({
    provider: 'resend' as EmailProvider,
    api_key: '',
    sender_email: '',
    sender_name: 'BestOld',
  });

  // Check if email domain is a public domain
  const isPublicEmailDomain = (email: string) => {
    const publicDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
      'live.com', 'aol.com', 'icloud.com', 'mail.com',
      'protonmail.com', 'zoho.com', 'yandex.com'
    ];
    const domain = email.split('@')[1]?.toLowerCase();
    return publicDomains.includes(domain);
  };

  const showEmailWarning = formData.sender_email && 
    (formData.provider === 'resend' || formData.provider === 'sendgrid') &&
    isPublicEmailDomain(formData.sender_email);

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      const data = await getAllEmailConfigurations();
      setConfigurations(data);
    } catch (error) {
      console.error('Error loading email configurations:', error);
      toast.error('Failed to load email configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.api_key || !formData.sender_email) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate sender email for Resend and SendGrid
    if ((formData.provider === 'resend' || formData.provider === 'sendgrid') && 
        isPublicEmailDomain(formData.sender_email)) {
      const domain = formData.sender_email.split('@')[1];
      toast.error(
        `Cannot use ${domain}. Please verify your own domain or use onboarding@resend.dev for testing.`,
        { duration: 5000 }
      );
      return;
    }

    try {
      await createEmailConfiguration(formData);
      toast.success('Email configuration created successfully');
      setShowForm(false);
      setFormData({
        provider: 'resend',
        api_key: '',
        sender_email: '',
        sender_name: 'BestOld',
      });
      loadConfigurations();
    } catch (error) {
      console.error('Error creating email configuration:', error);
      toast.error('Failed to create email configuration');
    }
  };

  const handleActivate = async (configId: string) => {
    try {
      await activateEmailConfiguration(configId);
      toast.success('Email configuration activated');
      loadConfigurations();
    } catch (error) {
      console.error('Error activating configuration:', error);
      toast.error('Failed to activate configuration');
    }
  };

  const handleDelete = async (configId: string) => {
    if (!confirm('Are you sure you want to delete this email configuration?')) {
      return;
    }

    try {
      await deleteEmailConfiguration(configId);
      toast.success('Email configuration deleted');
      loadConfigurations();
    } catch (error) {
      console.error('Error deleting configuration:', error);
      toast.error('Failed to delete configuration');
    }
  };

  const handleTestEmail = async (config: EmailConfiguration) => {
    if (!testingEmail) {
      toast.error('Please enter a test email address');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('test-email-configuration', {
        body: {
          configId: config.id,
          testEmail: testingEmail,
        },
      });

      if (error) {
        const errorMsg = await error?.context?.text();
        console.error('Error testing email:', errorMsg || error?.message);
        toast.error(errorMsg || 'Failed to send test email');
        return;
      }

      if (data?.success) {
        toast.success('Test email sent successfully! Check your inbox.');
        
        // Update the configuration to mark test as sent
        await updateEmailConfiguration(config.id, {
          test_email_sent: true,
          last_tested_at: new Date().toISOString(),
        });
        
        loadConfigurations();
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error('Failed to send test email');
    }
  };

  const toggleApiKeyVisibility = (configId: string) => {
    setShowApiKey(prev => ({
      ...prev,
      [configId]: !prev[configId],
    }));
  };

  const getProviderName = (provider: EmailProvider) => {
    const names: Record<EmailProvider, string> = {
      resend: 'Resend',
      sendgrid: 'SendGrid',
      aws_ses: 'AWS SES',
      custom: 'Custom',
    };
    return names[provider];
  };

  const maskApiKey = (apiKey: string) => {
    if (apiKey.length <= 8) return '••••••••';
    return apiKey.substring(0, 4) + '••••••••' + apiKey.substring(apiKey.length - 4);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Email Configuration</h1>
          <p className="text-muted-foreground mt-1">
            Configure email service for sending OTP codes and notifications
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Configuration
        </Button>
      </div>

      {/* Info Card */}
      <Card className="mb-6 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Supported Email Providers</h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Currently supported: <strong>Resend</strong> (recommended) and <strong>SendGrid</strong>. 
                AWS SES and Custom SMTP support coming soon.
              </p>
              <div className="bg-blue-100 dark:bg-blue-800/50 rounded-md p-3 mt-3">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">⚠️ Important: Domain Verification</p>
                <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                  <li><strong>Cannot use:</strong> Gmail, Yahoo, Outlook, or other public email domains</li>
                  <li><strong>For testing:</strong> Use <code className="bg-blue-200 dark:bg-blue-700 px-1 rounded">onboarding@resend.dev</code> (Resend only)</li>
                  <li><strong>For production:</strong> Verify YOUR OWN domain (e.g., yourdomain.com)</li>
                </ul>
              </div>
              <div className="flex gap-4 mt-3">
                <a 
                  href="https://resend.com/api-keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Get Resend API Key →
                </a>
                <a 
                  href="https://resend.com/domains" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Verify Domain →
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Configuration Form */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>New Email Configuration</CardTitle>
            <CardDescription>
              Add a new email service provider configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="provider">Email Provider</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(value) => setFormData({ ...formData, provider: value as EmailProvider })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="resend">Resend (Recommended)</SelectItem>
                    <SelectItem value="sendgrid">SendGrid</SelectItem>
                    <SelectItem value="aws_ses">AWS SES (Coming Soon)</SelectItem>
                    <SelectItem value="custom">Custom SMTP (Coming Soon)</SelectItem>
                  </SelectContent>
                </Select>
                {(formData.provider === 'aws_ses' || formData.provider === 'custom') && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 mt-2">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      ⚠️ <strong>{formData.provider === 'aws_ses' ? 'AWS SES' : 'Custom SMTP'}</strong> is not yet fully supported. 
                      Please use <strong>Resend</strong> (recommended) or <strong>SendGrid</strong> for now.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_key">API Key *</Label>
                <Input
                  id="api_key"
                  type="password"
                  placeholder="Enter your API key"
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  required
                />
                {formData.provider === 'resend' && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 mt-2">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">📘 Resend Setup Guide</p>
                    <ol className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                      <li>Go to <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline font-medium">resend.com/api-keys</a></li>
                      <li>Click "Create API Key" and copy it</li>
                      <li>For testing: Use sender email <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">onboarding@resend.dev</code></li>
                      <li>For production: Verify your domain at <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="underline font-medium">resend.com/domains</a></li>
                    </ol>
                  </div>
                )}
                {formData.provider === 'sendgrid' && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 mt-2">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">📘 SendGrid Setup Guide</p>
                    <ol className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                      <li>Go to SendGrid Settings → API Keys</li>
                      <li>Create API Key with "Mail Send" permissions</li>
                      <li>Verify your sender email in SendGrid</li>
                      <li>Use the verified email as sender</li>
                    </ol>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sender_email">Sender Email *</Label>
                  <Input
                    id="sender_email"
                    type="email"
                    placeholder={formData.provider === 'resend' ? 'onboarding@resend.dev' : 'noreply@yourdomain.com'}
                    value={formData.sender_email}
                    onChange={(e) => setFormData({ ...formData, sender_email: e.target.value })}
                    required
                  />
                  {formData.provider === 'resend' && !formData.sender_email && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-2">
                      <p className="text-xs text-green-800 dark:text-green-200">
                        💡 <strong>For testing:</strong> Use <code className="bg-green-100 dark:bg-green-800 px-1 rounded">onboarding@resend.dev</code>
                      </p>
                    </div>
                  )}
                  {showEmailWarning && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-2">
                      <p className="text-xs text-red-800 dark:text-red-200">
                        ❌ <strong>Cannot use {formData.sender_email.split('@')[1]}</strong>
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                        {formData.provider === 'resend' ? (
                          <>You must verify YOUR OWN domain at <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="underline">resend.com/domains</a> or use <code className="bg-red-100 dark:bg-red-800 px-1 rounded">onboarding@resend.dev</code> for testing.</>
                        ) : (
                          <>You must verify YOUR OWN domain with SendGrid. Public email domains like Gmail, Yahoo, Outlook cannot be used.</>
                        )}
                      </p>
                    </div>
                  )}
                  {!showEmailWarning && formData.sender_email && formData.provider === 'resend' && (
                    <p className="text-xs text-muted-foreground">
                      ✅ Make sure this domain is verified at <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="underline">resend.com/domains</a>
                    </p>
                  )}
                  {!showEmailWarning && formData.sender_email && formData.provider === 'sendgrid' && (
                    <p className="text-xs text-muted-foreground">
                      ✅ Make sure this email is verified in SendGrid
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sender_name">Sender Name</Label>
                  <Input
                    id="sender_name"
                    type="text"
                    placeholder="BestOld"
                    value={formData.sender_name}
                    onChange={(e) => setFormData({ ...formData, sender_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">Create Configuration</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Configurations List */}
      <div className="space-y-4">
        {configurations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Mail className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Email Configuration</h3>
              <p className="text-muted-foreground text-center mb-4">
                Add an email service provider to start sending emails
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Configuration
              </Button>
            </CardContent>
          </Card>
        ) : (
          configurations.map((config) => (
            <Card key={config.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">
                        {getProviderName(config.provider)}
                      </CardTitle>
                      <CardDescription>
                        {config.sender_name} &lt;{config.sender_email}&gt;
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {config.is_active ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        Inactive
                      </Badge>
                    )}
                    {config.test_email_sent && (
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Tested
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* API Key */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">API Key</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono">
                      {showApiKey[config.id] ? config.api_key : maskApiKey(config.api_key)}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleApiKeyVisibility(config.id)}
                    >
                      {showApiKey[config.id] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Test Email */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Test Email</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="email"
                      placeholder="test@example.com"
                      value={testingEmail}
                      onChange={(e) => setTestingEmail(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={() => handleTestEmail(config)}
                      disabled={!testingEmail}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Test
                    </Button>
                  </div>
                  {config.last_tested_at && (
                    <p className="text-xs text-muted-foreground">
                      Last tested: {new Date(config.last_tested_at).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  {!config.is_active && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleActivate(config.id)}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Activate
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(config.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Help Section */}
      <Card className="mt-6 bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">Setup Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h4 className="font-semibold mb-1">1. Choose a Provider</h4>
            <p className="text-muted-foreground">
              Resend is recommended for its ease of use and generous free tier (100 emails/day)
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">2. Get API Key</h4>
            <p className="text-muted-foreground">
              Sign up with your chosen provider and generate an API key from their dashboard
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">3. Verify Sender Email</h4>
            <p className="text-muted-foreground">
              Verify your domain or email address with the provider before sending emails
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">4. Test Configuration</h4>
            <p className="text-muted-foreground">
              Send a test email to verify everything is working correctly
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">5. Activate</h4>
            <p className="text-muted-foreground">
              Activate the configuration to start using it for password resets and notifications
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
