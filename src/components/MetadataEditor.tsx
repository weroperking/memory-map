import { useState } from 'react';
import { Edit3, Download, Check, X, AlertCircle, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePhotos } from '@/contexts/PhotoContext';
import { PhotoMetadata } from '@/lib/exif-utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { prepareBatchDownload, batchDownloadFiles, validateMetadataValue } from '@/lib/metadata-editor';
import { UpgradeModal } from './UpgradeModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MetadataEditorProps {
  isOpen: boolean;
  onClose: () => void;
  isPro?: boolean;
}

interface EditedMetadata {
  [key: string]: any;
}

export function MetadataEditor({ isOpen, onClose, isPro = false }: MetadataEditorProps) {
  const { photos, selectedPhoto } = usePhotos();
  const [editedMetadata, setEditedMetadata] = useState<Map<string, EditedMetadata>>(new Map());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('select');

  const currentPhoto = selectedPhoto || photos[0];
  if (!currentPhoto) return null;

  // All editable fields - both free and premium (premium now available for free)
  const editableFields = [
    // Free fields
    { key: 'camera', label: 'Camera', placeholder: 'Canon EOS R5', section: 'free' },
    { key: 'lens', label: 'Lens', placeholder: 'RF 24-70mm F2.8L', section: 'free' },
    { key: 'aperture', label: 'Aperture', placeholder: 'f/2.8', section: 'free' },
    { key: 'shutterSpeed', label: 'Shutter Speed', placeholder: '1/1000s', section: 'free' },
    { key: 'iso', label: 'ISO', placeholder: '100', type: 'number', section: 'free' },
    { key: 'address', label: 'Address', placeholder: 'New York, USA', section: 'free' },
    { key: 'width', label: 'Width', placeholder: '4000', type: 'number', section: 'free' },
    { key: 'height', label: 'Height', placeholder: '3000', type: 'number', section: 'free' },
    { key: 'latitude', label: 'Latitude', placeholder: '40.7128', type: 'number', section: 'free' },
    { key: 'longitude', label: 'Longitude', placeholder: '-74.0060', type: 'number', section: 'free' },
    { key: 'altitude', label: 'Altitude', placeholder: '10', type: 'number', section: 'free' },
    // Premium fields (now free)
    { key: 'focalLength', label: 'Focal Length', placeholder: '50mm', section: 'free' },
    { key: 'colorSpace', label: 'Color Space', placeholder: 'sRGB', section: 'free' },
    { key: 'dotsPerInch', label: 'DPI', placeholder: '300', type: 'number', section: 'free' },
    { key: 'timeZone', label: 'Time Zone', placeholder: 'UTC-5', section: 'free' },
    { key: 'latitudeRef', label: 'Latitude Ref', placeholder: 'N', section: 'free' },
    { key: 'longitudeRef', label: 'Longitude Ref', placeholder: 'W', section: 'free' },
    { key: 'altitudeRef', label: 'Altitude Ref', placeholder: 'Above Sea Level', section: 'free' },
    { key: 'directionRef', label: 'Direction Ref', placeholder: 'T', section: 'free' },
    { key: 'direction', label: 'Direction', placeholder: '90.5', type: 'number', section: 'free' },
    { key: 'pointingDirection', label: 'Pointing Direction', placeholder: 'N', section: 'free' },
    { key: 'city', label: 'City', placeholder: 'New York', section: 'free' },
    { key: 'state', label: 'State', placeholder: 'NY', section: 'free' },
    { key: 'country', label: 'Country', placeholder: 'USA', section: 'free' },
  ];

  const getEditValue = (photoId: string, key: string): string => {
    const edited = editedMetadata.get(photoId);
    if (edited && key in edited) {
      const val = edited[key];
      return typeof val === 'string' || typeof val === 'number' ? String(val) : '';
    }
    const photoVal = currentPhoto[key as keyof PhotoMetadata];
    return typeof photoVal === 'string' || typeof photoVal === 'number' ? String(photoVal) : '';
  };

  const handleEditChange = (photoId: string, key: string, value: string) => {
    const edited = editedMetadata.get(photoId) || {};
    edited[key] = value;
    setEditedMetadata(new Map(editedMetadata.set(photoId, edited)));
  };

  const togglePhotoSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBatchDownload = async () => {
    if (selectedIds.size === 0) {
      toast.error('Select at least one photo to download');
      return;
    }

    setIsDownloading(true);
    const toastId = toast.loading(`Processing ${selectedIds.size} image(s)...`);
    
    try {
      const photosToProcess = photos.filter(p => selectedIds.has(p.id));
      
      if (photosToProcess.length === 0) {
        toast.error('No photos available to process', { id: toastId });
        setIsDownloading(false);
        return;
      }

      console.log(`[Download] Starting download process for ${photosToProcess.length} photos`);
      
      // Create metadata for each photo by merging original + edited values
      const photosWithMetadata = photosToProcess.map((photo, idx) => {
        console.log(`[Download] Preparing photo ${idx + 1}/${photosToProcess.length}: ${photo.name}, File exists: ${!!photo.file}`);
        
        // CRITICAL: Verify file exists before processing
        if (!photo.file) {
          console.error(`[Download] ERROR: File missing for photo: ${photo.name}`);
          throw new Error(`File data missing for photo: ${photo.name}`);
        }
        
        const edited = editedMetadata.get(photo.id) || {};
        const mergedMetadata: Record<string, any> = { ...photo };
        
        // Apply edited values and validate them
        Object.entries(edited).forEach(([key, value]) => {
          const validated = validateMetadataValue(key, value);
          if (validated !== undefined) {
            mergedMetadata[key] = validated;
          }
        });
        
        console.log(`[Download] Prepared metadata for: ${photo.name}`);
        
        return {
          file: photo.file,
          metadata: mergedMetadata
        };
      });

      // Prepare batch download
      console.log(`[Download] Starting image processing with ${photosWithMetadata.length} photos`);
      const preparedFiles = await prepareBatchDownload(
        photosWithMetadata,
        (current, total) => {
          console.log(`[Download] Progress: ${current}/${total}`);
          toast.loading(`Processing ${current}/${total} image(s)...`, { id: toastId });
        }
      );

      console.log(`[Download] Batch download complete. Got ${preparedFiles.length}/${photosWithMetadata.length} prepared files`);

      if (preparedFiles.length === 0) {
        console.error(`[Download] ERROR: No images were successfully processed`);
        toast.error('No images were processed. Check browser console for details.', { id: toastId });
        setIsDownloading(false);
        return;
      }

      console.log(`[Download] All images processed successfully. Starting downloads for ${preparedFiles.length} files`);
      toast.loading(`Downloading ${preparedFiles.length} file(s)...`, { id: toastId });

      // Trigger downloads
      await batchDownloadFiles(preparedFiles);

      toast.success(
        `Downloaded ${preparedFiles.length} image(s) with updated metadata!`,
        {
          id: toastId,
          description: `All metadata is now embedded directly in the image file.`,
          duration: 5000,
        }
      );

      // Reset and close
      setEditedMetadata(new Map());
      setSelectedIds(new Set());
      onClose();
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download images', {
        id: toastId,
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const freeFields = editableFields.filter(f => f.section === 'free');

  const [showUpgrade, setShowUpgrade] = useState(false);

  // If user is not Pro, show a locked upgrade view instead of the full editor
  if (!isPro) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-full max-w-3xl max-h-[80vh] border-2 border-chart-4 p-0 shadow-lg flex flex-col">
          <DialogHeader className="border-b-2 border-chart-4 bg-gradient-to-r from-chart-4/10 to-chart-4/5 p-4">
            <div className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-chart-4 flex-shrink-0" />
              <DialogTitle className="font-mono text-lg text-chart-4">Edit Image Metadata</DialogTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-2">This feature is available in PhotoMap Pro.</p>
          </DialogHeader>

          <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
            <p className="font-mono text-lg font-bold mb-2">Unlock editing & batch downloads</p>
            <p className="text-sm text-muted-foreground mb-4">Editing image metadata and batch downloading with embedded EXIF is a Pro feature. Upgrade to access 13 premium metadata fields and AI detection.</p>
            <div className="flex gap-3">
              <button
                  onClick={() => setShowUpgrade(true)}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-9 rounded-md px-3 bg-chart-4 text-foreground hover:bg-chart-4/90"
                >
                  Edit Metadata
                </button>
              <button onClick={onClose} className="px-4 py-2 border-2 border-border rounded">
                Close
              </button>
            </div>
          </div>

          <div className="border-t-2 border-chart-4 p-4">
            <p className="text-xs text-muted-foreground">Preview of premium fields: Focal Length, Color Space, DPI, Time Zone, Lat/Lon refs, Altitude ref, Direction, Pointing Direction, City, State, Country</p>
          </div>

          <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} onUpgradeComplete={() => { setShowUpgrade(false); toast.success('Upgrade complete — please reload or sign in to apply your Pro status.'); }} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-6xl max-h-[95vh] border-2 border-chart-4 p-0 shadow-lg flex flex-col">
        {/* Header */}
        <DialogHeader className="border-b-2 border-chart-4 bg-gradient-to-r from-chart-4/10 to-chart-4/5 p-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-chart-4 flex-shrink-0" />
            <DialogTitle className="font-mono text-lg sm:text-xl text-chart-4">Edit Image Metadata</DialogTitle>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            ✓ Local processing • Edit all metadata fields • Download with new details
          </p>
        </DialogHeader>

        {/* Tabs Navigation - visible on all sizes */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 border-b border-border">
          <TabsList className="border-b border-chart-4 bg-transparent rounded-none w-full justify-start p-0 h-auto">
            <TabsTrigger
              value="select"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-chart-4 data-[state=active]:bg-transparent px-4 py-2 text-sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Select Photos
            </TabsTrigger>
            <TabsTrigger
              value="edit"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-chart-4 data-[state=active]:bg-transparent px-4 py-2 text-sm disabled:opacity-50"
              disabled={selectedIds.size === 0}
            >
              <Edit3 className="h-4 w-4 mr-1" />
              Edit Metadata
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-chart-4 data-[state=active]:bg-transparent px-4 py-2 text-sm disabled:opacity-50"
              disabled={selectedIds.size === 0}
            >
              <Check className="h-4 w-4 mr-1" />
              Preview
            </TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {/* Select Photos Tab */}
            <TabsContent value="select" className="m-0 h-full flex flex-col">
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-2">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      onClick={() => togglePhotoSelection(photo.id)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-3 ${
                        selectedIds.has(photo.id)
                          ? 'border-chart-4 bg-chart-4/20'
                          : 'border-border hover:border-chart-4 hover:bg-muted'
                      }`}
                    >
                      <div
                        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center border-2 rounded transition-all ${
                          selectedIds.has(photo.id) ? 'border-chart-4 bg-chart-4' : 'border-border'
                        }`}
                      >
                        {selectedIds.has(photo.id) && <Check className="h-4 w-4 text-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{photo.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{photo.camera || 'Unknown Camera'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Edit Metadata Tab */}
            <TabsContent value="edit" className="m-0 h-full overflow-hidden flex flex-col">
              <ScrollArea className="flex-1 w-full">
                <div className="p-4 w-full overflow-y-auto max-h-[60vh]">
                  <h3 className="font-mono text-sm font-bold uppercase mb-4 text-chart-4">Metadata Fields</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
                    {freeFields.map(({ key, label, placeholder, type = 'text' }) => (
                      <div key={key} className="space-y-1">
                        <Label htmlFor={`field-${key}`} className="text-xs uppercase font-mono text-muted-foreground">
                          {label}
                        </Label>
                        <Input
                          id={`field-${key}`}
                          type={type}
                          placeholder={placeholder}
                          value={getEditValue(currentPhoto.id, key)}
                          onChange={(e) => handleEditChange(currentPhoto.id, key, e.target.value)}
                          className="border-chart-4 focus:border-chart-4 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="m-0 h-full">
              <ScrollArea className="h-full">
                <div className="p-4 overflow-y-auto max-h-[60vh]">
                  <h3 className="font-mono text-sm font-bold uppercase mb-4 text-chart-4">Preview Selected Photos</h3>
                  <div className="space-y-4">
                    {Array.from(selectedIds).map((id) => {
                      const photo = photos.find(p => p.id === id);
                      if (!photo) return null;
                      const edited = editedMetadata.get(photo.id) || {};
                      const merged = { ...photo, ...edited } as Record<string, any>;

                      return (
                        <div key={id} className="border-2 border-chart-4 rounded-lg p-3 bg-chart-4/5 space-y-2">
                          <div className="flex gap-3 items-start">
                            <img src={photo.url} alt={photo.name} className="h-16 w-16 object-cover rounded flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-mono font-bold text-sm truncate">{photo.name}</p>
                              <p className="text-xs text-muted-foreground">{photo.camera || 'Unknown'}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                            {Object.entries(merged)
                              .filter(([k]) => !['url', 'file', 'id'].includes(k))
                              .slice(0, 12)
                              .map(([k, v]) => (
                                v !== undefined && v !== null && v !== '' && (
                                  <div key={k} className="space-y-0.5">
                                    <p className="font-mono text-muted-foreground uppercase text-[10px]">{k}</p>
                                    <p className="font-medium text-sm truncate">{String(v)}</p>
                                  </div>
                                )
                              ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <div className="border-t-2 border-chart-4 bg-gradient-to-r from-chart-4/5 to-chart-4/10 p-4 flex-shrink-0">
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-mono font-bold">Local Processing:</p>
                <p>All edits happen in your browser. Images are re-encoded and downloaded directly.</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 justify-end">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isDownloading}
                className="border-foreground order-2 sm:order-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleBatchDownload}
                disabled={selectedIds.size === 0 || isDownloading}
                className="bg-chart-4 text-foreground hover:bg-chart-4/90 order-1 sm:order-2"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download {selectedIds.size > 0 ? `(${selectedIds.size})` : 'Selected'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
