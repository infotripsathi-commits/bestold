import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  getAllSellerApplications, 
  approveSellerApplication, 
  rejectSellerApplication,
  type SellerApplication 
} from '@/db/api';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, Eye, Store, FileText, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, X, RotateCcw, Maximize2, ImageIcon } from 'lucide-react';

// ─── Pinch-Zoom Gallery ────────────────────────────────────────────────────
interface PinchZoomGalleryProps {
  images: string[];
  currentIndex: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}

function PinchZoomGallery({ images, currentIndex, onIndexChange, onClose }: PinchZoomGalleryProps) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Touch tracking
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const lastPinchDistRef = useRef<number | null>(null);
  const lastTapTimeRef = useRef(0);
  const animFrameRef = useRef<number>(0);

  const resetTransform = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  // Reset when image changes
  useEffect(() => { resetTransform(); }, [currentIndex, resetTransform]);

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const goNext = () => { if (images.length > 1) { resetTransform(); onIndexChange((currentIndex + 1) % images.length); } };
  const goPrev = () => { if (images.length > 1) { resetTransform(); onIndexChange((currentIndex - 1 + images.length) % images.length); } };

  const clampOffset = (newOffset: { x: number; y: number }, newScale: number) => {
    if (!imgRef.current || !containerRef.current) return newOffset;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    const iw = imgRef.current.naturalWidth || cw;
    const ih = imgRef.current.naturalHeight || ch;
    const displayW = Math.min(iw, cw) * newScale;
    const displayH = Math.min(ih, ch) * newScale;
    const maxX = Math.max(0, (displayW - cw) / 2);
    const maxY = Math.max(0, (displayH - ch) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, newOffset.x)),
      y: Math.max(-maxY, Math.min(maxY, newOffset.y)),
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      // Double-tap detection
      const now = Date.now();
      if (now - lastTapTimeRef.current < 300) {
        if (scale > 1) { resetTransform(); } else { setScale(2.5); }
      }
      lastTapTimeRef.current = now;
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDistRef.current = Math.hypot(dx, dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(() => {
      if (e.touches.length === 2 && lastPinchDistRef.current !== null) {
        // Pinch zoom
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const delta = dist / lastPinchDistRef.current;
        lastPinchDistRef.current = dist;
        setScale((prev) => {
          const next = Math.max(1, Math.min(5, prev * delta));
          setOffset((off) => clampOffset(off, next));
          return next;
        });
      } else if (e.touches.length === 1 && lastTouchRef.current && scale > 1) {
        // Pan when zoomed
        const dx = e.touches[0].clientX - lastTouchRef.current.x;
        const dy = e.touches[0].clientY - lastTouchRef.current.y;
        lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        setOffset((prev) => clampOffset({ x: prev.x + dx, y: prev.y + dy }, scale));
      } else if (e.touches.length === 1 && lastTouchRef.current && scale <= 1) {
        // Horizontal swipe to navigate
        const dx = e.touches[0].clientX - lastTouchRef.current.x;
        if (Math.abs(dx) > 60) {
          if (dx < 0) goNext(); else goPrev();
          lastTouchRef.current = null;
        }
      }
    });
  };

  const handleTouchEnd = () => {
    lastPinchDistRef.current = null;
    if (scale < 1.05) resetTransform();
  };

  // Wheel zoom (desktop)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((prev) => {
      const next = Math.max(1, Math.min(5, prev * delta));
      if (next <= 1) { setOffset({ x: 0, y: 0 }); }
      return next;
    });
  };

  return (
    <div className="relative bg-black w-full" style={{ height: '92dvh' }}>
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          {images.length > 1 && (
            <span className="text-white text-sm font-medium px-2 py-0.5 rounded-full bg-white/15">
              {currentIndex + 1} / {images.length}
            </span>
          )}
          {scale > 1 && (
            <span className="text-white/70 text-xs">{Math.round(scale * 100)}%</span>
          )}
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          {scale > 1 && (
            <button onClick={resetTransform} className="p-2 rounded-full bg-white/15 hover:bg-white/25 transition-colors" title="Reset zoom">
              <RotateCcw className="h-4 w-4 text-white" />
            </button>
          )}
          <button onClick={onClose} className="p-2 rounded-full bg-white/15 hover:bg-white/25 transition-colors">
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      {/* Image area */}
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center overflow-hidden select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        style={{ touchAction: scale > 1 ? 'none' : 'pan-y' }}
      >
        <img
          ref={imgRef}
          src={images[currentIndex]}
          alt={`Image ${currentIndex + 1}`}
          draggable={false}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
            transformOrigin: 'center center',
            transition: scale === 1 ? 'transform 0.2s ease' : 'none',
            cursor: scale > 1 ? 'grab' : 'default',
            userSelect: 'none',
          }}
        />
      </div>

      {/* Prev / Next arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/15 hover:bg-white/30 transition-colors"
          >
            <ChevronLeft className="h-7 w-7 text-white" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/15 hover:bg-white/30 transition-colors"
          >
            <ChevronRight className="h-7 w-7 text-white" />
          </button>
        </>
      )}

      {/* Bottom bar — zoom controls + thumbnails */}
      <div className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/70 to-transparent pb-3 pt-6">
        {/* Zoom controls (desktop) */}
        <div className="hidden md:flex justify-center gap-2 mb-2">
          <button onClick={() => setScale((s) => Math.max(1, +(s - 0.5).toFixed(1)))} className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 transition-colors">
            <ZoomOut className="h-4 w-4 text-white" />
          </button>
          <button onClick={resetTransform} className="px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs transition-colors">
            <Maximize2 className="h-3.5 w-3.5 inline mr-1" />Fit
          </button>
          <button onClick={() => setScale((s) => Math.min(5, +(s + 0.5).toFixed(1)))} className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 transition-colors">
            <ZoomIn className="h-4 w-4 text-white" />
          </button>
        </div>
        {/* Hint for mobile */}
        {scale <= 1 && (
          <p className="md:hidden text-center text-white/40 text-xs mb-2">Pinch to zoom · Double-tap · Swipe to navigate</p>
        )}
        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex justify-center gap-2 px-4 overflow-x-auto">
            {images.map((url, i) => (
              <button
                key={i}
                onClick={() => { resetTransform(); onIndexChange(i); }}
                className={`w-14 h-14 md:w-16 md:h-16 rounded-md overflow-hidden border-2 shrink-0 transition-all ${
                  i === currentIndex ? 'border-white scale-105' : 'border-transparent opacity-50 hover:opacity-90'
                }`}
              >
                <img src={url} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
// ───────────────────────────────────────────────────────────────────────────

export default function AdminSellerApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<SellerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<SellerApplication | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [adminNotes, setAdminNotes] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [imageGalleryOpen, setImageGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const data = await getAllSellerApplications();
      setApplications(data);
    } catch (error) {
      console.error('Failed to load applications:', error);
      toast.error('Failed to load seller applications');
    } finally {
      setLoading(false);
    }
  };

  const handleViewApplication = (application: SellerApplication) => {
    setSelectedApplication(application);
    setAdminNotes('');
    setViewDialogOpen(true);
  };

  const handleOpenActionDialog = (application: SellerApplication, action: 'approve' | 'reject') => {
    setSelectedApplication(application);
    setActionType(action);
    setAdminNotes('');
    setActionDialogOpen(true);
  };

  const handleProcessApplication = async () => {
    if (!selectedApplication || !user) return;

    setProcessing(true);
    try {
      if (actionType === 'approve') {
        await approveSellerApplication(selectedApplication.id, user.id, adminNotes || undefined);
        toast.success('Application approved successfully! User is now a seller.');
      } else {
        if (!adminNotes.trim()) {
          toast.error('Please provide a reason for rejection');
          return;
        }
        await rejectSellerApplication(selectedApplication.id, user.id, adminNotes);
        toast.success('Application rejected');
      }

      setActionDialogOpen(false);
      setSelectedApplication(null);
      setAdminNotes('');
      await loadApplications();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${actionType} application`);
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenImageGallery = (images: string[], startIndex: number = 0) => {
    setGalleryImages(images);
    setCurrentImageIndex(startIndex);
    setImageGalleryOpen(true);
  };


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredApplications = applications.filter(app => {
    if (activeTab === 'all') return true;
    return app.status === activeTab;
  });

  const pendingCount = applications.filter(app => app.status === 'pending').length;
  const approvedCount = applications.filter(app => app.status === 'approved').length;
  const rejectedCount = applications.filter(app => app.status === 'rejected').length;

  if (loading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-12 w-64 mb-8 bg-muted" />
        <Skeleton className="h-96 bg-muted" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Seller Applications</h1>
        <p className="text-muted-foreground">
          Review and manage seller account applications
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active sellers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Not approved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
          <CardDescription>
            Review seller applications and approve or reject them
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending">
                Pending {pendingCount > 0 && <Badge variant="secondary" className="ml-2">{pendingCount}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {filteredApplications.length === 0 ? (
                <div className="text-center py-12">
                  <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No applications found</p>
                </div>
              ) : (
                <div className="w-full max-w-full overflow-x-auto bg-card">
                  <Table className="[&>div]:max-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Applicant</TableHead>
                        <TableHead className="whitespace-nowrap">Business Name</TableHead>
                        <TableHead className="whitespace-nowrap">Location</TableHead>
                        <TableHead className="whitespace-nowrap">Status</TableHead>
                        <TableHead className="whitespace-nowrap">Applied Date</TableHead>
                        <TableHead className="whitespace-nowrap">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredApplications.map((application) => (
                        <TableRow key={application.id}>
                          <TableCell className="whitespace-nowrap">
                            <div>
                              <div className="font-medium">{application.user?.full_name}</div>
                              <div className="text-sm text-muted-foreground">{application.user?.email}</div>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{application.business_name}</TableCell>
                          <TableCell className="whitespace-nowrap">{application.location || 'Not specified'}</TableCell>
                          <TableCell className="whitespace-nowrap">{getStatusBadge(application.status)}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {new Date(application.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex gap-2 shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewApplication(application)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {application.status === 'pending' && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenActionDialog(application, 'approve')}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenActionDialog(application, 'reject')}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <XCircle className="h-4 w-4" />
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* View Application Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Review the seller application information
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Applicant</Label>
                <p className="text-sm mt-1">{selectedApplication.user?.full_name}</p>
                <p className="text-sm text-muted-foreground">{selectedApplication.user?.email}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Business Name</Label>
                <p className="text-sm mt-1">{selectedApplication.business_name}</p>
              </div>

              {selectedApplication.business_description && (
                <div>
                  <Label className="text-sm font-medium">Business Description</Label>
                  <p className="text-sm mt-1">{selectedApplication.business_description}</p>
                </div>
              )}

              {selectedApplication.phone_number && (
                <div>
                  <Label className="text-sm font-medium">Phone Number</Label>
                  <p className="text-sm mt-1">{selectedApplication.phone_number}</p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Location</Label>
                <p className="text-sm mt-1">{selectedApplication.location || 'Not specified'}</p>
              </div>

              {/* Store Banner — always shown */}
              <div>
                <Label className="text-sm font-medium">Store Banner</Label>
                {selectedApplication.banner_image_url ? (
                  <div
                    className="mt-2 w-full h-36 rounded-lg overflow-hidden border cursor-pointer hover:opacity-90 transition-opacity relative group"
                    onClick={() => handleOpenImageGallery([selectedApplication.banner_image_url!], 0)}
                  >
                    <img
                      src={selectedApplication.banner_image_url}
                      alt="Store banner"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <ZoomIn className="h-7 w-7 text-white" />
                      <span className="text-white text-sm font-medium">Tap to view</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 w-full h-24 rounded-lg border border-dashed flex items-center justify-center bg-muted/30">
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <ImageIcon className="h-6 w-6" />
                      <span className="text-xs">No banner uploaded</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Shop Images — always shown */}
              <div>
                <Label className="text-sm font-medium">
                  Shop Images {selectedApplication.shop_images?.length ? `(${selectedApplication.shop_images.length})` : ''}
                </Label>
                {selectedApplication.shop_images && selectedApplication.shop_images.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {selectedApplication.shop_images.map((url, index) => (
                      <div
                        key={index}
                        className="aspect-square rounded-lg overflow-hidden border cursor-pointer hover:opacity-90 transition-opacity relative group"
                        onClick={() => handleOpenImageGallery(selectedApplication.shop_images!, index)}
                      >
                        <img
                          src={url}
                          alt={`Shop ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ZoomIn className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 w-full h-20 rounded-lg border border-dashed flex items-center justify-center bg-muted/30">
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <ImageIcon className="h-5 w-5" />
                      <span className="text-xs">No shop images uploaded</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Trade License — always shown */}
              <div>
                <Label className="text-sm font-medium">Trade License</Label>
                {selectedApplication.trade_license_url ? (
                  <div className="mt-2 space-y-2">
                    {/* Treat as image if URL contains image-like path; otherwise show both options */}
                    {!/\.pdf($|\?)/i.test(selectedApplication.trade_license_url) ? (
                      <div
                        className="w-full h-48 rounded-lg overflow-hidden border cursor-pointer hover:opacity-90 transition-opacity relative group"
                        onClick={() => handleOpenImageGallery([selectedApplication.trade_license_url!], 0)}
                      >
                        <img
                          src={selectedApplication.trade_license_url}
                          alt="Trade license"
                          className="w-full h-full object-contain bg-muted"
                          onError={(e) => {
                            // If image fails, hide img and show PDF link
                            (e.target as HTMLImageElement).style.display = 'none';
                            const parent = (e.target as HTMLImageElement).parentElement;
                            if (parent) parent.setAttribute('data-img-error', 'true');
                          }}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <ZoomIn className="h-7 w-7 text-white" />
                          <span className="text-white text-sm font-medium">Tap to view</span>
                        </div>
                      </div>
                    ) : null}
                    <a
                      href={selectedApplication.trade_license_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <FileText className="h-4 w-4" />
                      Open in new tab
                    </a>
                  </div>
                ) : (
                  <div className="mt-2 w-full h-20 rounded-lg border border-dashed flex items-center justify-center bg-muted/30">
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <FileText className="h-5 w-5" />
                      <span className="text-xs">No license uploaded</span>
                    </div>
                  </div>
                )}
              </div>

              {selectedApplication.latitude && selectedApplication.longitude && (
                <div>
                  <Label className="text-sm font-medium">GPS Location</Label>
                  <div className="mt-2 p-2 bg-muted rounded-lg text-sm">
                    <p>Latitude: {selectedApplication.latitude.toFixed(6)}</p>
                    <p>Longitude: {selectedApplication.longitude.toFixed(6)}</p>
                    <a 
                      href={`https://www.google.com/maps?q=${selectedApplication.latitude},${selectedApplication.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline mt-1 inline-block"
                    >
                      View on Google Maps
                    </a>
                  </div>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Status</Label>
                <div className="mt-1">{getStatusBadge(selectedApplication.status)}</div>
              </div>

              {selectedApplication.admin_notes && (
                <div>
                  <Label className="text-sm font-medium">Admin Notes</Label>
                  <p className="text-sm mt-1 p-2 bg-muted rounded-lg">{selectedApplication.admin_notes}</p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Applied Date</Label>
                <p className="text-sm mt-1">
                  {new Date(selectedApplication.created_at).toLocaleString()}
                </p>
              </div>

              {selectedApplication.reviewed_at && (
                <div>
                  <Label className="text-sm font-medium">Reviewed Date</Label>
                  <p className="text-sm mt-1">
                    {new Date(selectedApplication.reviewed_at).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Quick action panel inside view dialog */}
              <div className="border-t pt-4 space-y-3">
                <Label className="text-sm font-medium">Admin Action</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={
                    selectedApplication.status === 'pending'
                      ? 'Add notes or rejection reason...'
                      : 'Update admin notes...'
                  }
                  rows={3}
                />
                <div className="flex gap-2">
                  {selectedApplication.status !== 'approved' && (
                    <Button
                      className="flex-1"
                      disabled={processing}
                      onClick={async () => {
                        if (!user) return;
                        setProcessing(true);
                        try {
                          await approveSellerApplication(selectedApplication.id, user.id, adminNotes || undefined);
                          toast.success('Application approved! User is now a seller.');
                          setViewDialogOpen(false);
                          setAdminNotes('');
                          await loadApplications();
                        } catch (error: any) {
                          toast.error(error.message || 'Failed to approve application');
                        } finally {
                          setProcessing(false);
                        }
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {processing ? 'Processing...' : 'Approve'}
                    </Button>
                  )}
                  {selectedApplication.status !== 'rejected' && (
                    <Button
                      variant="destructive"
                      className="flex-1"
                      disabled={processing || !adminNotes.trim()}
                      onClick={async () => {
                        if (!user) return;
                        if (!adminNotes.trim()) {
                          toast.error('Please provide a rejection reason');
                          return;
                        }
                        setProcessing(true);
                        try {
                          await rejectSellerApplication(selectedApplication.id, user.id, adminNotes);
                          toast.success('Application rejected');
                          setViewDialogOpen(false);
                          setAdminNotes('');
                          await loadApplications();
                        } catch (error: any) {
                          toast.error(error.message || 'Failed to reject application');
                        } finally {
                          setProcessing(false);
                        }
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {processing ? 'Processing...' : 'Reject'}
                    </Button>
                  )}
                  {selectedApplication.status === 'rejected' && (
                    <Button
                      className="flex-1"
                      disabled={processing}
                      onClick={async () => {
                        if (!user) return;
                        setProcessing(true);
                        try {
                          await approveSellerApplication(selectedApplication.id, user.id, adminNotes || undefined);
                          toast.success('Application approved! User is now a seller.');
                          setViewDialogOpen(false);
                          setAdminNotes('');
                          await loadApplications();
                        } catch (error: any) {
                          toast.error(error.message || 'Failed to approve application');
                        } finally {
                          setProcessing(false);
                        }
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {processing ? 'Processing...' : 'Approve Anyway'}
                    </Button>
                  )}
                </div>
                {selectedApplication.status !== 'approved' && !adminNotes.trim() && (
                  <p className="text-xs text-muted-foreground">* Rejection requires a reason in the notes above</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve Application' : 'Reject Application'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve'
                ? 'This will upgrade the user to a seller and create their store.'
                : 'Please provide a reason for rejecting this application.'}
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="font-medium">{selectedApplication.business_name}</p>
                <p className="text-sm text-muted-foreground">{selectedApplication.user?.full_name}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin_notes">
                  {actionType === 'approve' ? 'Notes (Optional)' : 'Rejection Reason *'}
                </Label>
                <Textarea
                  id="admin_notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={
                    actionType === 'approve'
                      ? 'Add any notes for the applicant...'
                      : 'Explain why this application is being rejected...'
                  }
                  rows={4}
                  required={actionType === 'reject'}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setActionDialogOpen(false)}
                  disabled={processing}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleProcessApplication}
                  disabled={processing || (actionType === 'reject' && !adminNotes.trim())}
                  className="flex-1"
                  variant={actionType === 'approve' ? 'default' : 'destructive'}
                >
                  {processing ? 'Processing...' : actionType === 'approve' ? 'Approve' : 'Reject'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Gallery Modal — with pinch-zoom, pan, double-tap, keyboard nav */}
      <Dialog open={imageGalleryOpen} onOpenChange={setImageGalleryOpen}>
        <DialogContent className="max-w-[calc(100%-0rem)] md:max-w-5xl w-full p-0 bg-black border-0 rounded-none md:rounded-lg overflow-hidden">
          <PinchZoomGallery
            images={galleryImages}
            currentIndex={currentImageIndex}
            onIndexChange={setCurrentImageIndex}
            onClose={() => setImageGalleryOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
