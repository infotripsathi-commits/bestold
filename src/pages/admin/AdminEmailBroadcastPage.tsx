import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Mail,
  Users,
  Store,
  Send,
  Eye,
  CheckCircle2,
  Search,
  X,
  Loader2,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import { getAllProfiles, getAllStoresForAdmin, supabase } from '@/db/api';
import type { Profile, Store as StoreType } from '@/types';
import AdminNav from '@/components/layouts/AdminNav';

type RecipientGroup = 'all' | 'customers' | 'store_owners' | 'custom';

interface Recipient {
  email: string;
  name: string;
  type: 'customer' | 'store_owner';
}

export default function AdminEmailBroadcastPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [stores, setStores] = useState<StoreType[]>([]);
  const [loading, setLoading] = useState(true);

  // Compose fields
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  // Recipient selection
  const [recipientGroup, setRecipientGroup] = useState<RecipientGroup>('all');
  const [customSearch, setCustomSearch] = useState('');
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());

  // UI state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<{ sent: number; failed: number; errors: string[] } | null>(null);

  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileData, storeData] = await Promise.all([
        getAllProfiles(),
        getAllStoresForAdmin(),
      ]);
      setProfiles(profileData);
      setStores(storeData);
    } catch (err) {
      console.error('Failed to load data:', err);
      toast.error('Failed to load users and stores');
    } finally {
      setLoading(false);
    }
  };

  // Build the full recipient list based on group selection
  const allRecipients = (): Recipient[] => {
    const storeOwnerIds = new Set(stores.map((s) => s.seller_id));

    const customers: Recipient[] = profiles
      .filter((p) => p.role !== 'admin' && !storeOwnerIds.has(p.id) && p.email)
      .map((p) => ({ email: p.email, name: p.full_name || p.email.split('@')[0], type: 'customer' }));

    const storeOwners: Recipient[] = profiles
      .filter((p) => storeOwnerIds.has(p.id) && p.email)
      .map((p) => ({ email: p.email, name: p.full_name || p.email.split('@')[0], type: 'store_owner' }));

    switch (recipientGroup) {
      case 'customers': return customers;
      case 'store_owners': return storeOwners;
      case 'all': return [...customers, ...storeOwners];
      case 'custom': {
        const all = [...customers, ...storeOwners];
        return all.filter((r) => selectedEmails.has(r.email));
      }
    }
  };

  // Filtered list for custom search UI
  const filteredForSearch = (): Recipient[] => {
    const storeOwnerIds = new Set(stores.map((s) => s.seller_id));
    const all: Recipient[] = profiles
      .filter((p) => p.role !== 'admin' && p.email)
      .map((p) => ({
        email: p.email,
        name: p.full_name || p.email.split('@')[0],
        type: storeOwnerIds.has(p.id) ? 'store_owner' : 'customer',
      }));

    const q = customSearch.toLowerCase();
    return q
      ? all.filter((r) => r.email.toLowerCase().includes(q) || r.name.toLowerCase().includes(q))
      : all;
  };

  const toggleCustomEmail = (email: string) => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      next.has(email) ? next.delete(email) : next.add(email);
      return next;
    });
  };

  const recipients = allRecipients();

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error('Subject and message body are required');
      return;
    }
    if (recipients.length === 0) {
      toast.error('No recipients selected');
      return;
    }
    setConfirmOpen(false);
    setSending(true);
    setLastResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('send-broadcast-email', {
        body: {
          subject: subject.trim(),
          body: body.replace(/\n/g, '<br/>'),
          recipients: recipients.map((r) => ({ email: r.email, name: r.name })),
        },
      });

      if (error) {
        const msg = await error.context?.text();
        toast.error(`Send failed: ${msg || error.message}`);
        return;
      }

      setLastResult(data);
      toast.success(`Email sent to ${data.sent} recipient${data.sent !== 1 ? 's' : ''}!`);
      if (data.failed > 0) {
        toast.warning(`${data.failed} email(s) failed to deliver`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Unexpected error');
    } finally {
      setSending(false);
    }
  };

  const groupOptions: { value: RecipientGroup; label: string; icon: React.ElementType; description: string }[] = [
    { value: 'all', label: 'Everyone', icon: Users, description: 'All customers + all store owners' },
    { value: 'customers', label: 'Customers Only', icon: UserCheck, description: 'Users who have not opened a store' },
    { value: 'store_owners', label: 'Store Owners Only', icon: Store, description: 'Sellers who have an active store' },
    { value: 'custom', label: 'Select Specific People', icon: Mail, description: 'Hand-pick individual recipients' },
  ];

  const storeOwnerIds = new Set(stores.map((s) => s.seller_id));
  const customerCount = profiles.filter((p) => p.role !== 'admin' && !storeOwnerIds.has(p.id) && p.email).length;
  const ownerCount = profiles.filter((p) => storeOwnerIds.has(p.id) && p.email).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNav />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <div className="container mx-auto p-4 md:p-6 max-w-5xl">

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Mail className="h-7 w-7 text-primary" />
            Email Broadcast
          </h1>
          <p className="text-muted-foreground mt-1">
            Write and send emails to your customers, store owners, or specific individuals
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{customerCount + ownerCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{customerCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Customers</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{ownerCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Store Owners</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left Column: Recipients ───────────────────────── */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Who to Send To</CardTitle>
                <CardDescription>Choose your recipient group</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {groupOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = recipientGroup === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setRecipientGroup(opt.value)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className={`text-sm font-medium ${isSelected ? 'text-primary' : ''}`}>
                          {opt.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 pl-6">{opt.description}</p>
                    </button>
                  );
                })}

                {/* Custom picker */}
                {recipientGroup === 'custom' && (
                  <div className="space-y-2 pt-2">
                    <Separator />
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search name or email…"
                        value={customSearch}
                        onChange={(e) => setCustomSearch(e.target.value)}
                        className="pl-8 text-sm"
                      />
                    </div>
                    <ScrollArea className="h-52 rounded border">
                      <div className="p-2 space-y-1">
                        {filteredForSearch().length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-4">No users found</p>
                        ) : (
                          filteredForSearch().map((r) => (
                            <label
                              key={r.email}
                              className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
                            >
                              <Checkbox
                                checked={selectedEmails.has(r.email)}
                                onCheckedChange={() => toggleCustomEmail(r.email)}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium truncate">{r.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                              </div>
                              <Badge variant="outline" className="text-xs shrink-0">
                                {r.type === 'store_owner' ? 'Seller' : 'Buyer'}
                              </Badge>
                            </label>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                    {selectedEmails.size > 0 && (
                      <div className="flex items-center justify-between pt-1">
                        <p className="text-xs text-muted-foreground">{selectedEmails.size} selected</p>
                        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setSelectedEmails(new Set())}>
                          Clear all
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Recipient count badge */}
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Recipients</span>
                  <Badge variant={recipients.length > 0 ? 'default' : 'secondary'}>
                    {recipients.length} {recipients.length === 1 ? 'person' : 'people'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Right Column: Compose ─────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Compose Email</CardTitle>
                <CardDescription>Write your email below — it will be sent with BESTOLD branding</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject Line *</Label>
                  <Input
                    id="subject"
                    placeholder="e.g. New Features on BESTOLD — Check It Out!"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="body">Message *</Label>
                  <Textarea
                    id="body"
                    ref={bodyRef}
                    placeholder="Write your message here…&#10;&#10;You can use multiple paragraphs.&#10;&#10;The email will automatically be wrapped in BESTOLD branding with your logo and footer."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="min-h-52 resize-y"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tip: Each new line becomes a new paragraph. The recipient's name will be added automatically at the top.
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setPreviewOpen(true)}
                    disabled={!subject || !body}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Email
                  </Button>
                  <Button
                    onClick={() => setConfirmOpen(true)}
                    disabled={!subject || !body || recipients.length === 0 || sending}
                    className="ml-auto"
                  >
                    {sending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending…</>
                    ) : (
                      <><Send className="h-4 w-4 mr-2" />Send to {recipients.length} recipient{recipients.length !== 1 ? 's' : ''}</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Last send result */}
            {lastResult && (
              <Card className={lastResult.failed > 0 ? 'border-yellow-300' : 'border-green-300'}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {lastResult.failed === 0 ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">
                        Last broadcast: {lastResult.sent} sent, {lastResult.failed} failed
                      </p>
                      {lastResult.errors.length > 0 && (
                        <div className="space-y-1">
                          {lastResult.errors.slice(0, 5).map((e, i) => (
                            <p key={i} className="text-xs text-muted-foreground">{e}</p>
                          ))}
                          {lastResult.errors.length > 5 && (
                            <p className="text-xs text-muted-foreground">…and {lastResult.errors.length - 5} more</p>
                          )}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto shrink-0"
                      onClick={() => setLastResult(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>This is how the email will look in the recipient's inbox</DialogDescription>
          </DialogHeader>
          <div className="rounded-lg overflow-hidden border">
            {/* Mock email client header */}
            <div className="bg-muted px-4 py-3 border-b space-y-1">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">From:</span> BESTOLD &lt;noreply@bestold.in&gt;
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Subject:</span> {subject || '(no subject)'}
              </p>
            </div>
            {/* Rendered preview */}
            <div
              className="bg-white p-0"
              dangerouslySetInnerHTML={{
                __html: `
                <div style="background:#f4f4f4;padding:24px 16px;font-family:Arial,sans-serif;">
                  <div style="max-width:500px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.07);">
                    <div style="background:#16a34a;padding:28px;text-align:center;">
                      <h1 style="margin:0;color:#fff;font-size:24px;font-weight:800;">BESTOLD</h1>
                      <p style="margin:4px 0 0;color:#dcfce7;font-size:13px;">Buy &amp; Sell Second-Hand Goods</p>
                    </div>
                    <div style="padding:28px;">
                      <p style="margin:0 0 16px;color:#374151;font-size:15px;">Hi <strong>Recipient Name</strong>,</p>
                      <div style="color:#374151;font-size:14px;line-height:1.7;">
                        ${(body || '').replace(/\n/g, '<br/>')}
                      </div>
                    </div>
                    <div style="padding:0 28px 24px;text-align:center;">
                      <a href="https://bestold.in" style="display:inline-block;padding:11px 28px;background:#16a34a;color:#fff;text-decoration:none;border-radius:7px;font-size:14px;font-weight:700;">Visit BESTOLD →</a>
                    </div>
                    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 28px;text-align:center;">
                      <p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} BESTOLD. All rights reserved.</p>
                    </div>
                  </div>
                </div>`,
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Close Preview</Button>
            <Button onClick={() => { setPreviewOpen(false); setConfirmOpen(true); }} disabled={recipients.length === 0}>
              <Send className="h-4 w-4 mr-2" />
              Send Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Send Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirm Send</DialogTitle>
            <DialogDescription>
              You're about to send an email to <strong>{recipients.length} people</strong>. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-lg border p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subject</span>
                <span className="font-medium text-right max-w-[60%] truncate">{subject}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Recipients</span>
                <span className="font-medium">{recipients.length} people</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Group</span>
                <span className="font-medium capitalize">{recipientGroup.replace('_', ' ')}</span>
              </div>
            </div>
            {recipients.length > 50 && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-800">
                  Sending to {recipients.length} people. This may take a moment. Resend free plan sends ~2 emails/second.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending…</>
              ) : (
                <><Send className="h-4 w-4 mr-2" />Yes, Send Now</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
