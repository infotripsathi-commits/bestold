import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Link as LinkIcon, Plus, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { generateAdminInvite, getAllAdminInvites, revokeAdminInvite } from '@/db/api';
import { toast } from 'sonner';
import type { AdminInvite } from '@/types';

export default function AdminInvitesPage() {
  const { profile } = useAuth();
  const [invites, setInvites] = useState<AdminInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Form state
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'seller' | 'buyer'>('admin');
  const [expiresInHours, setExpiresInHours] = useState('168'); // 7 days

  useEffect(() => {
    if (profile?.role === 'admin') {
      loadInvites();
    }
  }, [profile]);

  const loadInvites = async () => {
    try {
      const data = await getAllAdminInvites();
      setInvites(data as AdminInvite[]);
    } catch (error) {
      console.error('Failed to load invites:', error);
      toast.error('Failed to load invites');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvite = async () => {
    setGenerating(true);
    try {
      const invite = await generateAdminInvite(
        email || undefined,
        role,
        parseInt(expiresInHours)
      );

      // Build full URL
      const fullUrl = `${window.location.origin}${invite.invite_url}`;

      // Copy to clipboard
      await navigator.clipboard.writeText(fullUrl);
      
      toast.success('Invite link generated and copied to clipboard!');
      
      // Reset form
      setEmail('');
      setRole('admin');
      setExpiresInHours('168');
      setDialogOpen(false);
      
      // Reload invites
      loadInvites();
    } catch (error: any) {
      console.error('Failed to generate invite:', error);
      toast.error(error.message || 'Failed to generate invite');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyLink = async (token: string) => {
    const fullUrl = `${window.location.origin}/register?invite=${token}`;
    await navigator.clipboard.writeText(fullUrl);
    toast.success('Invite link copied to clipboard!');
  };

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      await revokeAdminInvite(inviteId);
      toast.success('Invite revoked successfully');
      loadInvites();
    } catch (error: any) {
      console.error('Failed to revoke invite:', error);
      toast.error(error.message || 'Failed to revoke invite');
    }
  };

  const getInviteStatus = (invite: AdminInvite) => {
    if (invite.used_at) {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Used</Badge>;
    }
    if (invite.revoked_at) {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Revoked</Badge>;
    }
    if (new Date(invite.expires_at) < new Date()) {
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Expired</Badge>;
    }
    return <Badge variant="outline" className="bg-blue-500 text-white"><Clock className="h-3 w-3 mr-1" />Active</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="container py-16 text-center">
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">Only admins can access this page.</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Invites</h1>
          <p className="text-muted-foreground">
            Generate invite links to create new admin, seller, or buyer accounts
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Generate Invite
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Invite Link</DialogTitle>
              <DialogDescription>
                Create a unique invite link to allow someone to register with a specific role.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  If provided, only this email can use the invite
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={(value: any) => setRole(value)}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="seller">Seller</SelectItem>
                    <SelectItem value="buyer">Buyer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires">Expires In</Label>
                <Select value={expiresInHours} onValueChange={setExpiresInHours}>
                  <SelectTrigger id="expires">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24">24 hours</SelectItem>
                    <SelectItem value="72">3 days</SelectItem>
                    <SelectItem value="168">7 days (default)</SelectItem>
                    <SelectItem value="336">14 days</SelectItem>
                    <SelectItem value="720">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleGenerateInvite} disabled={generating}>
                {generating ? 'Generating...' : 'Generate & Copy Link'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Invites</CardTitle>
          <CardDescription>
            View and manage all generated invite links
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading invites...</div>
          ) : invites.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No invites generated yet. Click "Generate Invite" to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Expires At</TableHead>
                    <TableHead>Used By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invites.map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell>{getInviteStatus(invite)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{invite.role}</Badge>
                      </TableCell>
                      <TableCell>{invite.email || '—'}</TableCell>
                      <TableCell>{invite.creator?.full_name || '—'}</TableCell>
                      <TableCell className="text-sm">{formatDate(invite.created_at)}</TableCell>
                      <TableCell className="text-sm">{formatDate(invite.expires_at)}</TableCell>
                      <TableCell>{invite.user?.full_name || '—'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {!invite.used_at && !invite.revoked_at && new Date(invite.expires_at) > new Date() && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyLink(invite.token)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRevokeInvite(invite.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quick Access Link</CardTitle>
          <CardDescription>
            Share this link to allow direct access to the admin panel (requires login)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={`${window.location.origin}/admin/users`}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/admin/users`);
                toast.success('Admin panel link copied!');
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Note: Users must have an admin account to access this link. Use "Generate Invite" above to create new admin accounts.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
