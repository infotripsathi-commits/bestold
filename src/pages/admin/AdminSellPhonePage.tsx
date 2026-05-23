import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Smartphone, Plus, Pencil, Trash2, Settings, Send, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  getAllPhoneBrands,
  getAllPhoneModels,
  getAllPhoneConditions,
  getAllPhoneAgeOptions,
  getAllPhoneVariants,
  getAllPhoneSubmissions,
  createPhoneBrand,
  updatePhoneBrand,
  deletePhoneBrand,
  createPhoneModel,
  updatePhoneModel,
  deletePhoneModel,
  createPhoneCondition,
  updatePhoneCondition,
  deletePhoneCondition,
  createPhoneAgeOption,
  updatePhoneAgeOption,
  deletePhoneAgeOption,
  createPhoneVariant,
  updatePhoneVariant,
  deletePhoneVariant,
  getSiteSetting,
  updateSiteSetting,
  closePhoneSubmissionChat,
  updatePhoneSubmissionStatus,
  deletePhoneSubmission,
  getLocations,
  updateLocation,
} from '@/db/api';
import type { PhoneBrand, PhoneModel, PhoneCondition, PhoneAgeOption, PhoneVariant, Location } from '@/types';

export default function AdminSellPhonePage() {
  const [loading, setLoading] = useState(true);
  const [savingBrand, setSavingBrand] = useState(false);
  const [savingModel, setSavingModel] = useState(false);
  const [savingVariant, setSavingVariant] = useState(false);
  const [savingCondition, setSavingCondition] = useState(false);
  const [savingAge, setSavingAge] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [brands, setBrands] = useState<PhoneBrand[]>([]);
  const [models, setModels] = useState<PhoneModel[]>([]);
  const [variants, setVariants] = useState<PhoneVariant[]>([]);
  const [conditions, setConditions] = useState<PhoneCondition[]>([]);
  const [ageOptions, setAgeOptions] = useState<PhoneAgeOption[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappCountryCode, setWhatsappCountryCode] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [brandsData, modelsData, variantsData, conditionsData, ageOptionsData, submissionsData, locationsData, whatsappSetting, countrySetting] = await Promise.all([
        getAllPhoneBrands(),
        getAllPhoneModels(),
        getAllPhoneVariants(),
        getAllPhoneConditions(),
        getAllPhoneAgeOptions(),
        getAllPhoneSubmissions(),
        getLocations(),
        getSiteSetting('whatsapp_number'),
        getSiteSetting('whatsapp_country_code'),
      ]);
      setBrands(brandsData);
      setModels(modelsData);
      setVariants(variantsData);
      setConditions(conditionsData);
      setAgeOptions(ageOptionsData);
      setSubmissions(submissionsData);
      setLocations(locationsData);
      setWhatsappNumber(whatsappSetting?.value || '');
      setWhatsappCountryCode(countrySetting?.value || '+91');
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const saveWhatsAppSettings = async () => {
    try {
      await Promise.all([
        updateSiteSetting('whatsapp_number', whatsappNumber),
        updateSiteSetting('whatsapp_country_code', whatsappCountryCode),
      ]);
      toast.success('WhatsApp settings saved');
    } catch (error) {
      console.error('Failed to save WhatsApp settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const togglePickupAvailability = async (locationId: string, currentValue: boolean) => {
    try {
      await updateLocation(locationId, { phone_pickup_available: !currentValue });
      
      // Update local state
      setLocations(locations.map(loc => 
        loc.id === locationId 
          ? { ...loc, phone_pickup_available: !currentValue }
          : loc
      ));
      
      toast.success(`Pickup availability ${!currentValue ? 'enabled' : 'disabled'} for location`);
    } catch (error) {
      console.error('Failed to update pickup availability:', error);
      toast.error('Failed to update pickup availability');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64 bg-muted" />
        <Skeleton className="h-96 w-full bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Smartphone className="h-8 w-8" />
            Sell Phone Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage phone brands, models, conditions, and WhatsApp settings
          </p>
        </div>
      </div>

      <Tabs defaultValue="submissions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="brands">Brands</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
          <TabsTrigger value="conditions">Conditions</TabsTrigger>
          <TabsTrigger value="age">Age Options</TabsTrigger>
          <TabsTrigger value="pickup-locations">Pickup Locations</TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Submissions Tab */}
        <TabsContent value="submissions">
          <SubmissionsTab submissions={submissions} defaultWhatsappNumber={`${whatsappCountryCode}${whatsappNumber}`} />
        </TabsContent>

        {/* Brands Tab */}
        <TabsContent value="brands">
          <BrandsTab brands={brands} onUpdate={loadData} />
        </TabsContent>

        {/* Models Tab */}
        <TabsContent value="models">
          <ModelsTab models={models} brands={brands} onUpdate={loadData} />
        </TabsContent>

        {/* Variants Tab */}
        <TabsContent value="variants">
          <VariantsTab variants={variants} onUpdate={loadData} />
        </TabsContent>

        {/* Conditions Tab */}
        <TabsContent value="conditions">
          <ConditionsTab conditions={conditions} onUpdate={loadData} />
        </TabsContent>

        {/* Age Options Tab */}
        <TabsContent value="age">
          <AgeOptionsTab ageOptions={ageOptions} onUpdate={loadData} />
        </TabsContent>

        {/* Pickup Locations Tab */}
        <TabsContent value="pickup-locations">
          <Card>
            <CardHeader>
              <CardTitle>Pickup Locations</CardTitle>
              <CardDescription>
                Select the locations where phone pickup service is available. Only enabled locations will be visible to customers on the Sell Your Phone form.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {locations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No locations available. Please add locations first in the Location Management section.</p>
                </div>
              ) : (
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Location Name</TableHead>
                        <TableHead>GPS Coordinates</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Pickup Available</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {locations.map((location) => (
                        <TableRow key={location.id}>
                          <TableCell className="font-medium">{location.label}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {location.latitude && location.longitude
                              ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                              : 'Not set'}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              location.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {location.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Label 
                                htmlFor={`pickup-${location.id}`}
                                className="text-sm text-muted-foreground cursor-pointer"
                              >
                                {location.phone_pickup_available ? 'Enabled' : 'Disabled'}
                              </Label>
                              <Switch
                                id={`pickup-${location.id}`}
                                checked={location.phone_pickup_available}
                                onCheckedChange={() => togglePickupAvailability(location.id, location.phone_pickup_available)}
                              />
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
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Settings</CardTitle>
              <CardDescription>Configure WhatsApp number for receiving phone submissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="countryCode">Country Code</Label>
                <Input
                  id="countryCode"
                  value={whatsappCountryCode}
                  onChange={(e) => setWhatsappCountryCode(e.target.value)}
                  placeholder="+91"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsappNumber">WhatsApp Number (without country code)</Label>
                <Input
                  id="whatsappNumber"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="8167865019"
                />
                <p className="text-xs text-muted-foreground">
                  Full number: {whatsappCountryCode}{whatsappNumber}
                </p>
              </div>
              <Button onClick={saveWhatsAppSettings}>Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Submissions Tab Component
function SubmissionsTab({ submissions, defaultWhatsappNumber }: { submissions: any[]; defaultWhatsappNumber?: string }) {
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [forwardSubmission, setForwardSubmission] = useState<any | null>(null);
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getImageUrls = (submission: any) => {
    const urls = [];
    for (let i = 1; i <= 6; i++) {
      const url = submission[`image_${i}_url`];
      if (url) urls.push({ label: ['Front', 'Back', 'Left', 'Right', 'Top', 'Bottom'][i - 1], url });
    }
    return urls;
  };

  const handleCloseChat = async (submissionId: string) => {
    if (!confirm('Are you sure you want to close this chat? The customer will no longer be able to send messages.')) {
      return;
    }

    try {
      await closePhoneSubmissionChat(submissionId);
      toast.success('Chat closed successfully');
      window.location.reload();
    } catch (error: any) {
      console.error('Failed to close chat:', error);
      toast.error(error.message || 'Failed to close chat');
    }
  };

  const handleUpdateStatus = async (submissionId: string, status: string) => {
    try {
      await updatePhoneSubmissionStatus(submissionId, status);
      toast.success('Status updated successfully');
      window.location.reload();
    } catch (error: any) {
      console.error('Failed to update status:', error);
      toast.error(error.message || 'Failed to update status');
    }
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    if (!confirm('Are you sure you want to delete this submission? This action cannot be undone and will also delete all associated chat messages.')) {
      return;
    }

    try {
      await deletePhoneSubmission(submissionId);
      toast.success('Submission deleted successfully');
      window.location.reload();
    } catch (error: any) {
      console.error('Failed to delete submission:', error);
      toast.error(error.message || 'Failed to delete submission');
    }
  };

  const getStatusBadge = (status?: string) => {
    const statusColors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_discussion: 'bg-blue-100 text-blue-800',
      quoted: 'bg-purple-100 text-purple-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      closed: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[status || 'pending']}`}>
        {status || 'pending'}
      </span>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Phone Submissions</CardTitle>
        <CardDescription>View all customer phone submissions with full details</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Brand & Model</TableHead>
              <TableHead>Variant</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Images</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground">
                  No submissions yet
                </TableCell>
              </TableRow>
            ) : (
              submissions.map((submission) => {
                const imageCount = getImageUrls(submission).length;
                return (
                  <TableRow key={submission.id}>
                    <TableCell className="text-sm">{formatDate(submission.created_at)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{submission.brand_name}</div>
                      <div className="text-sm text-muted-foreground">{submission.model_name}</div>
                    </TableCell>
                    <TableCell className="text-sm">{submission.variant_name || '-'}</TableCell>
                    <TableCell className="text-sm">{submission.condition_name}</TableCell>
                    <TableCell className="text-sm">{submission.customer_name || 'Not provided'}</TableCell>
                    <TableCell className="text-sm">{submission.customer_phone || '-'}</TableCell>
                    <TableCell className="text-sm">
                      {submission.latitude && submission.longitude ? (
                        <div className="flex flex-col">
                          <span className="font-medium">{submission.location_city || 'Unknown'}</span>
                          <span className="text-xs text-muted-foreground">{submission.location_country || 'Unknown'}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No location</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(submission.status)}</TableCell>
                    <TableCell className="text-sm">{imageCount} photo(s)</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/phone-submission-chat/${submission.id}`, '_blank')}
                        >
                          Chat
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setDetailsOpen(true);
                          }}
                        >
                          Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          title="Forward to WhatsApp"
                          onClick={() => {
                            setForwardSubmission(submission);
                            setForwardDialogOpen(true);
                          }}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSubmission(submission.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Submission Details</DialogTitle>
              <DialogDescription>Complete information about this phone submission</DialogDescription>
            </DialogHeader>
            {selectedSubmission && (
              <div className="space-y-6">
                {/* Phone Details */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">📱 Phone Details</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Brand:</span>
                      <span className="ml-2 font-medium">{selectedSubmission.brand_name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Model:</span>
                      <span className="ml-2 font-medium">{selectedSubmission.model_name}</span>
                    </div>
                    {selectedSubmission.variant_name && (
                      <div>
                        <span className="text-muted-foreground">Variant:</span>
                        <span className="ml-2 font-medium">{selectedSubmission.variant_name}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Condition:</span>
                      <span className="ml-2 font-medium">{selectedSubmission.condition_name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Age:</span>
                      <span className="ml-2 font-medium">{selectedSubmission.age_name}</span>
                    </div>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">👤 Customer Details</h3>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <span className="ml-2 font-medium">{selectedSubmission.customer_name || 'Not provided'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="ml-2 font-medium">{selectedSubmission.customer_phone || 'Not provided'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <span className="ml-2 font-medium">{selectedSubmission.customer_email || 'Not provided'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Submitted:</span>
                      <span className="ml-2 font-medium">{formatDate(selectedSubmission.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Location Details */}
                {(selectedSubmission.latitude && selectedSubmission.longitude) && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">📍 Location</h3>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">City:</span>
                        <span className="ml-2 font-medium">{selectedSubmission.location_city || 'Unknown'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Country:</span>
                        <span className="ml-2 font-medium">{selectedSubmission.location_country || 'Unknown'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Address:</span>
                        <span className="ml-2 font-medium">{selectedSubmission.location_address || 'Not provided'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Coordinates:</span>
                        <span className="ml-2 font-medium">
                          {selectedSubmission.latitude.toFixed(6)}, {selectedSubmission.longitude.toFixed(6)}
                        </span>
                      </div>
                      <div className="mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const url = `https://www.google.com/maps?q=${selectedSubmission.latitude},${selectedSubmission.longitude}`;
                            window.open(url, '_blank');
                          }}
                        >
                          View on Google Maps
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Images */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">📸 Images</h3>
                  <div className="space-y-2">
                    {getImageUrls(selectedSubmission).map((img, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-md">
                        <div className="flex-shrink-0 w-24 h-24">
                          <img 
                            src={img.url} 
                            alt={img.label} 
                            className="w-full h-full object-cover rounded"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm mb-1">{img.label}</div>
                          <div className="text-xs text-muted-foreground break-all">{img.url}</div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(img.url, '_blank')}
                        >
                          Open
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Copy All URLs Button */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const urls = getImageUrls(selectedSubmission).map(img => `${img.label}: ${img.url}`).join('\n');
                        navigator.clipboard.writeText(urls);
                        toast.success('Image URLs copied to clipboard');
                      }}
                    >
                      Copy All URLs
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.open(`/phone-submission-chat/${selectedSubmission.id}`, '_blank')}
                    >
                      Open Chat
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => {
                        setForwardSubmission(selectedSubmission);
                        setDetailsOpen(false);
                        setForwardDialogOpen(true);
                      }}
                    >
                      <MessageCircle className="h-4 w-4 text-green-600" />
                      Forward to WhatsApp
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    {selectedSubmission.status !== 'closed' && (
                      <Button
                        variant="destructive"
                        onClick={() => {
                          handleCloseChat(selectedSubmission.id);
                          setDetailsOpen(false);
                        }}
                      >
                        Close Chat
                      </Button>
                    )}
                    <Button onClick={() => setDetailsOpen(false)}>Close</Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>

      {/* Forward to WhatsApp Dialog */}
      <ForwardToWhatsAppDialog
        open={forwardDialogOpen}
        onOpenChange={setForwardDialogOpen}
        submission={forwardSubmission}
        defaultNumber={defaultWhatsappNumber || ''}
      />
    </Card>
  );
}

// Brands Tab Component
function BrandsTab({ brands, onUpdate }: { brands: PhoneBrand[]; onUpdate: () => void }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<PhoneBrand | null>(null);
  const [formData, setFormData] = useState({ name: '', display_order: 0, is_active: true });

  const handleCreate = async () => {
    setSaving(true);
    try {
      await createPhoneBrand(formData);
      toast.success('Brand created successfully');
      setCreateOpen(false);
      setFormData({ name: '', display_order: 0, is_active: true });
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create brand');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedBrand) return;
    setSaving(true);
    try {
      await updatePhoneBrand(selectedBrand.id, formData);
      toast.success('Brand updated successfully');
      setEditOpen(false);
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update brand');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedBrand) return;
    try {
      await deletePhoneBrand(selectedBrand.id);
      toast.success('Brand deleted successfully');
      setDeleteOpen(false);
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete brand');
    }
  };

  const handleToggleActive = async (brand: PhoneBrand) => {
    try {
      await updatePhoneBrand(brand.id, { is_active: !brand.is_active });
      toast.success(`Brand ${!brand.is_active ? 'activated' : 'deactivated'}`);
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update brand');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Phone Brands</CardTitle>
            <CardDescription>Manage available phone brands</CardDescription>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setFormData({ name: '', display_order: 0, is_active: true })}>
                <Plus className="h-4 w-4 mr-2" />
                Add Brand
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Brand</DialogTitle>
                <DialogDescription>Create a new phone brand</DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Brand Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Apple"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Display Order</Label>
                    <Input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label>Active</Label>
                  </div>
                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving ? 'Creating...' : 'Create Brand'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Display Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {brands.map((brand) => (
              <TableRow key={brand.id}>
                <TableCell className="font-medium">{brand.name}</TableCell>
                <TableCell>{brand.display_order}</TableCell>
                <TableCell>
                  <Switch
                    checked={brand.is_active}
                    onCheckedChange={() => handleToggleActive(brand)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedBrand(brand);
                        setFormData({ name: brand.name, display_order: brand.display_order, is_active: brand.is_active });
                        setEditOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedBrand(brand);
                        setDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Brand</DialogTitle>
              <DialogDescription>Update brand details</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); handleEdit(); }}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Brand Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>
                <Button type="submit" className="w-full">Save Changes</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Brand</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this brand? This will also delete all associated models.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

// Models Tab Component (similar structure to Brands)
function ModelsTab({ models, brands, onUpdate }: { models: PhoneModel[]; brands: PhoneBrand[]; onUpdate: () => void }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedModel, setSelectedModel] = useState<PhoneModel | null>(null);
  const [formData, setFormData] = useState({ brand_id: '', name: '', display_order: 0, is_active: true });

  const handleCreate = async () => {
    setSaving(true);
    try {
      await createPhoneModel(formData);
      toast.success('Model created successfully');
      setCreateOpen(false);
      setFormData({ brand_id: '', name: '', display_order: 0, is_active: true });
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create model');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedModel) return;
    setSaving(true);
    try {
      await updatePhoneModel(selectedModel.id, formData);
      toast.success('Model updated successfully');
      setEditOpen(false);
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update model');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedModel) return;
    try {
      await deletePhoneModel(selectedModel.id);
      toast.success('Model deleted successfully');
      setDeleteOpen(false);
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete model');
    }
  };

  const handleToggleActive = async (model: PhoneModel) => {
    try {
      await updatePhoneModel(model.id, { is_active: !model.is_active });
      toast.success(`Model ${!model.is_active ? 'activated' : 'deactivated'}`);
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update model');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Phone Models</CardTitle>
            <CardDescription>Manage phone models for each brand</CardDescription>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setFormData({ brand_id: '', name: '', display_order: 0, is_active: true })}>
                <Plus className="h-4 w-4 mr-2" />
                Add Model
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Model</DialogTitle>
                <DialogDescription>Create a new phone model</DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Brand</Label>
                    <Select value={formData.brand_id} onValueChange={(value) => setFormData({ ...formData, brand_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Model Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="iPhone 15 Pro"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Display Order</Label>
                    <Input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label>Active</Label>
                  </div>
                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving ? 'Creating...' : 'Create Model'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Brand</TableHead>
              <TableHead>Model Name</TableHead>
              <TableHead>Display Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {models.map((model) => (
              <TableRow key={model.id}>
                <TableCell>{model.brand?.name}</TableCell>
                <TableCell className="font-medium">{model.name}</TableCell>
                <TableCell>{model.display_order}</TableCell>
                <TableCell>
                  <Switch
                    checked={model.is_active}
                    onCheckedChange={() => handleToggleActive(model)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedModel(model);
                        setFormData({ brand_id: model.brand_id, name: model.name, display_order: model.display_order, is_active: model.is_active });
                        setEditOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedModel(model);
                        setDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Model</DialogTitle>
              <DialogDescription>Update model details</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); handleEdit(); }}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Brand</Label>
                  <Select value={formData.brand_id} onValueChange={(value) => setFormData({ ...formData, brand_id: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Model Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>
                <Button type="submit" className="w-full">Save Changes</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Model</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this model?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

// Conditions Tab Component
function ConditionsTab({ conditions, onUpdate }: { conditions: PhoneCondition[]; onUpdate: () => void }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState<PhoneCondition | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', display_order: 0, is_active: true });

  const handleCreate = async () => {
    setSaving(true);
    try {
      await createPhoneCondition(formData);
      toast.success('Condition created successfully');
      setCreateOpen(false);
      setFormData({ name: '', description: '', display_order: 0, is_active: true });
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create condition');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedCondition) return;
    setSaving(true);
    try {
      await updatePhoneCondition(selectedCondition.id, formData);
      toast.success('Condition updated successfully');
      setEditOpen(false);
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update condition');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCondition) return;
    try {
      await deletePhoneCondition(selectedCondition.id);
      toast.success('Condition deleted successfully');
      setDeleteOpen(false);
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete condition');
    }
  };

  const handleToggleActive = async (condition: PhoneCondition) => {
    try {
      await updatePhoneCondition(condition.id, { is_active: !condition.is_active });
      toast.success(`Condition ${!condition.is_active ? 'activated' : 'deactivated'}`);
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update condition');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Phone Conditions</CardTitle>
            <CardDescription>Manage phone condition options</CardDescription>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setFormData({ name: '', description: '', display_order: 0, is_active: true })}>
                <Plus className="h-4 w-4 mr-2" />
                Add Condition
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Condition</DialogTitle>
                <DialogDescription>Create a new phone condition</DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Condition Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Like New"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Excellent condition, no visible scratches"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Display Order</Label>
                    <Input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label>Active</Label>
                  </div>
                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving ? 'Creating...' : 'Create Condition'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Display Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {conditions.map((condition) => (
              <TableRow key={condition.id}>
                <TableCell className="font-medium">{condition.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{condition.description}</TableCell>
                <TableCell>{condition.display_order}</TableCell>
                <TableCell>
                  <Switch
                    checked={condition.is_active}
                    onCheckedChange={() => handleToggleActive(condition)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedCondition(condition);
                        setFormData({ name: condition.name, description: condition.description || '', display_order: condition.display_order, is_active: condition.is_active });
                        setEditOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedCondition(condition);
                        setDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Condition</DialogTitle>
              <DialogDescription>Update condition details</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); handleEdit(); }}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Condition Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>
                <Button type="submit" className="w-full">Save Changes</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Condition</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this condition?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

// Variants Tab Component
function VariantsTab({ variants, onUpdate }: { variants: PhoneVariant[]; onUpdate: () => void }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<PhoneVariant | null>(null);
  const [formData, setFormData] = useState({ name: '', display_order: 0, is_active: true });

  const handleCreate = async () => {
    setSaving(true);
    try {
      await createPhoneVariant(formData);
      toast.success('Variant created successfully');
      setCreateOpen(false);
      setFormData({ name: '', display_order: 0, is_active: true });
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create variant');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedVariant) return;
    setSaving(true);
    try {
      await updatePhoneVariant(selectedVariant.id, formData);
      toast.success('Variant updated successfully');
      setEditOpen(false);
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update variant');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedVariant) return;
    try {
      await deletePhoneVariant(selectedVariant.id);
      toast.success('Variant deleted successfully');
      setDeleteOpen(false);
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete variant');
    }
  };

  const handleToggleActive = async (variant: PhoneVariant) => {
    try {
      await updatePhoneVariant(variant.id, { is_active: !variant.is_active });
      toast.success(`Variant ${!variant.is_active ? 'activated' : 'deactivated'}`);
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update variant');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Phone Variants (RAM/Storage)</CardTitle>
            <CardDescription>Manage phone variant options like 8GB/128GB</CardDescription>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setFormData({ name: '', display_order: 0, is_active: true })}>
                <Plus className="h-4 w-4 mr-2" />
                Add Variant
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Variant</DialogTitle>
                <DialogDescription>Create a new phone variant (RAM/Storage)</DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Variant Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="8GB/128GB"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Display Order</Label>
                    <Input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label>Active</Label>
                  </div>
                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving ? 'Creating...' : 'Create Variant'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Variant</TableHead>
              <TableHead>Display Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.map((variant) => (
              <TableRow key={variant.id}>
                <TableCell className="font-medium">{variant.name}</TableCell>
                <TableCell>{variant.display_order}</TableCell>
                <TableCell>
                  <Switch
                    checked={variant.is_active}
                    onCheckedChange={() => handleToggleActive(variant)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedVariant(variant);
                        setFormData({ name: variant.name, display_order: variant.display_order, is_active: variant.is_active });
                        setEditOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedVariant(variant);
                        setDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Variant</DialogTitle>
              <DialogDescription>Update variant details</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); handleEdit(); }}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Variant Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>
                <Button type="submit" className="w-full">Save Changes</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Variant</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this variant?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

// Age Options Tab Component
function AgeOptionsTab({ ageOptions, onUpdate }: { ageOptions: PhoneAgeOption[]; onUpdate: () => void }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedOption, setSelectedOption] = useState<PhoneAgeOption | null>(null);
  const [formData, setFormData] = useState({ name: '', display_order: 0, is_active: true });

  const handleCreate = async () => {
    setSaving(true);
    try {
      await createPhoneAgeOption(formData);
      toast.success('Age option created successfully');
      setCreateOpen(false);
      setFormData({ name: '', display_order: 0, is_active: true });
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create age option');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedOption) return;
    setSaving(true);
    try {
      await updatePhoneAgeOption(selectedOption.id, formData);
      toast.success('Age option updated successfully');
      setEditOpen(false);
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update age option');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedOption) return;
    try {
      await deletePhoneAgeOption(selectedOption.id);
      toast.success('Age option deleted successfully');
      setDeleteOpen(false);
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete age option');
    }
  };

  const handleToggleActive = async (option: PhoneAgeOption) => {
    try {
      await updatePhoneAgeOption(option.id, { is_active: !option.is_active });
      toast.success(`Age option ${!option.is_active ? 'activated' : 'deactivated'}`);
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update age option');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Phone Age Options</CardTitle>
            <CardDescription>Manage phone age options</CardDescription>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setFormData({ name: '', display_order: 0, is_active: true })}>
                <Plus className="h-4 w-4 mr-2" />
                Add Age Option
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Age Option</DialogTitle>
                <DialogDescription>Create a new phone age option</DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Age Option</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Less than 6 months"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Display Order</Label>
                    <Input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label>Active</Label>
                  </div>
                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving ? 'Creating...' : 'Create Age Option'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Age Option</TableHead>
              <TableHead>Display Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ageOptions.map((option) => (
              <TableRow key={option.id}>
                <TableCell className="font-medium">{option.name}</TableCell>
                <TableCell>{option.display_order}</TableCell>
                <TableCell>
                  <Switch
                    checked={option.is_active}
                    onCheckedChange={() => handleToggleActive(option)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedOption(option);
                        setFormData({ name: option.name, display_order: option.display_order, is_active: option.is_active });
                        setEditOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedOption(option);
                        setDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Age Option</DialogTitle>
              <DialogDescription>Update age option details</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); handleEdit(); }}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Age Option</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>
                <Button type="submit" className="w-full">Save Changes</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Age Option</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this age option?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

// ─── Forward to WhatsApp Dialog ──────────────────────────────────────────────
interface ForwardToWhatsAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: any | null;
  defaultNumber: string;
}

function ForwardToWhatsAppDialog({ open, onOpenChange, submission, defaultNumber }: ForwardToWhatsAppDialogProps) {
  const [recipientNumber, setRecipientNumber] = useState('');

  // Pre-fill with saved default whenever dialog opens with a new submission
  useEffect(() => {
    if (open) {
      setRecipientNumber(defaultNumber || '');
    }
  }, [open, defaultNumber]);

  if (!submission) return null;

  const getImageUrls = (sub: any) => {
    const urls: { label: string; url: string }[] = [];
    for (let i = 1; i <= 6; i++) {
      const url = sub[`image_${i}_url`];
      if (url) urls.push({ label: ['Front', 'Back', 'Left', 'Right', 'Top', 'Bottom'][i - 1], url });
    }
    return urls;
  };

  const buildMessage = () => {
    const images = getImageUrls(submission);
    const chatUrl = `${window.location.origin}/phone-submission-chat/${submission.id}`;

    const lines = [
      '📱 *Phone Sell Submission — BESTOLD*',
      '',
      '━━━━━━━━━━━━━━━━━━━━━━',
      '📋 *PHONE DETAILS*',
      `• Brand: ${submission.brand_name || '—'}`,
      `• Model: ${submission.model_name || '—'}`,
      submission.variant_name ? `• Variant: ${submission.variant_name}` : null,
      `• Condition: ${submission.condition_name || '—'}`,
      submission.age_name ? `• Age: ${submission.age_name}` : null,
      '',
      '👤 *CUSTOMER DETAILS*',
      `• Name: ${submission.customer_name || 'Not provided'}`,
      `• Phone: ${submission.customer_phone || 'Not provided'}`,
      submission.customer_email ? `• Email: ${submission.customer_email}` : null,
      '',
    ];

    if (submission.latitude && submission.longitude) {
      lines.push(
        '📍 *LOCATION*',
        `• City: ${submission.location_city || 'Unknown'}`,
        submission.location_address ? `• Address: ${submission.location_address}` : null,
        `• Maps: https://maps.google.com/?q=${submission.latitude},${submission.longitude}`,
        '',
      );
    }

    if (images.length > 0) {
      lines.push('📸 *PHONE IMAGES*');
      images.forEach((img) => {
        lines.push(`• ${img.label}: ${img.url}`);
      });
      lines.push('');
    }

    lines.push(
      '━━━━━━━━━━━━━━━━━━━━━━',
      `🔗 *Admin Chat:* ${chatUrl}`,
      `📅 Submitted: ${new Date(submission.created_at).toLocaleString()}`,
    );

    return lines.filter((l) => l !== null).join('\n');
  };

  const message = buildMessage();

  // Sanitise number: keep digits and leading +
  const sanitiseNumber = (num: string) => num.replace(/[^\d+]/g, '').replace(/(?!^\+)\+/g, '');

  const handleSend = () => {
    const num = sanitiseNumber(recipientNumber);
    if (!num) {
      toast.error('Please enter a WhatsApp number');
      return;
    }
    const url = `https://wa.me/${num.replace('+', '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    toast.success('Opening WhatsApp…');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            Forward Submission to WhatsApp
          </DialogTitle>
          <DialogDescription>
            Send full submission details and image links to any WhatsApp number.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Submission summary chip */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-sm">
            <Smartphone className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="font-medium">{submission.brand_name} {submission.model_name}</span>
            {submission.variant_name && <span className="text-muted-foreground">· {submission.variant_name}</span>}
            <span className="ml-auto text-muted-foreground">{submission.customer_name || 'Customer'}</span>
          </div>

          {/* Recipient number */}
          <div className="space-y-1.5">
            <Label htmlFor="wa-recipient">Recipient WhatsApp Number</Label>
            <Input
              id="wa-recipient"
              value={recipientNumber}
              onChange={(e) => setRecipientNumber(e.target.value)}
              placeholder="+91 98765 43210"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Include country code, e.g. +91 for India. Pre-filled from your saved WhatsApp settings.
            </p>
          </div>

          {/* Message preview */}
          <div className="space-y-1.5">
            <Label>Message Preview</Label>
            <div className="rounded-lg border border-border bg-muted/40 p-3 max-h-52 overflow-y-auto">
              <pre className="text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                {message}
              </pre>
            </div>
            <p className="text-xs text-muted-foreground">
              {message.length} characters · All image URLs and location link are included.
            </p>
          </div>

          {/* Image count info */}
          {getImageUrls(submission).length > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 text-xs text-green-700 dark:text-green-400">
              <MessageCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                <span className="font-medium">{getImageUrls(submission).length} photo link(s)</span> included in the message. 
                The recipient can tap each link to view the full image.
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={handleSend}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Open WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
