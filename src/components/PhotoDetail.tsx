import { MapPin, Calendar, Camera, Aperture, Timer, Gauge, Maximize, HardDrive, Mountain, AlertCircle } from 'lucide-react';
import { usePhotos } from '@/contexts/PhotoContext';
import { formatFileSize } from '@/lib/exif-utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AIDetectionPanel } from './AIDetectionPanel';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PhotoDetailProps {
  onUpgrade: () => void;
}

export function PhotoDetail({ onUpgrade }: PhotoDetailProps) {
  const { selectedPhoto, selectPhoto } = usePhotos();

  if (!selectedPhoto) return null;

  const metadata = [
    { icon: MapPin, label: 'Location', value: selectedPhoto.address },
    { icon: Calendar, label: 'Date', value: selectedPhoto.dateCreated?.toLocaleString() },
    { icon: Camera, label: 'Camera', value: selectedPhoto.camera },
    { icon: Aperture, label: 'Aperture', value: selectedPhoto.aperture },
    { icon: Timer, label: 'Shutter', value: selectedPhoto.shutterSpeed },
    { icon: Gauge, label: 'ISO', value: selectedPhoto.iso },
    { icon: Mountain, label: 'Altitude', value: selectedPhoto.altitude !== undefined ? `${selectedPhoto.altitude.toFixed(1)}m` : undefined },
    { icon: Maximize, label: 'Resolution', value: selectedPhoto.width && selectedPhoto.height ? `${selectedPhoto.width} × ${selectedPhoto.height}` : undefined },
    { icon: HardDrive, label: 'Size', value: formatFileSize(selectedPhoto.size) },
  ].filter((m) => m.value);

  const hasGPS = selectedPhoto.latitude && selectedPhoto.longitude;

  return (
    <Dialog open={!!selectedPhoto} onOpenChange={() => selectPhoto(null)}>
      <DialogContent className="max-w-4xl max-h-[90vh] border-2 border-foreground p-0 shadow-lg overflow-hidden">
        <div className="grid md:grid-cols-2 max-h-[90vh]">
          {/* Image */}
          <div className="relative aspect-square bg-muted">
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.name}
              className="h-full w-full object-contain"
            />
          </div>

          {/* Metadata */}
          <ScrollArea className="flex flex-col max-h-[90vh]">
            <DialogHeader className="border-b-2 border-foreground p-4">
              <DialogTitle className="font-mono text-lg">{selectedPhoto.name}</DialogTitle>
            </DialogHeader>

            <div className="flex-1 space-y-3 p-4">
              {/* GPS Warning if no location */}
              {!hasGPS && (
                <div className="flex items-start gap-3 p-3 rounded-lg border-2 border-chart-1 bg-chart-1/10">
                  <AlertCircle className="h-5 w-5 text-chart-1 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-mono text-sm font-bold text-chart-1">No GPS Data</p>
                    <p className="text-xs text-muted-foreground">
                      Browsers often strip location data for privacy. Check the "GPS Tips" button in the header for help.
                    </p>
                  </div>
                </div>
              )}

              {metadata.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3 border-b border-border pb-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center border-2 border-foreground bg-secondary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-mono text-muted-foreground uppercase">{label}</p>
                    <p className="font-medium">{value}</p>
                  </div>
                </div>
              ))}

              {hasGPS && (
                <div className="flex items-start gap-3 border-b border-border pb-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center border-2 border-foreground bg-chart-2 text-primary-foreground">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-mono text-muted-foreground uppercase">GPS Coordinates</p>
                    <p className="font-mono text-sm">
                      {selectedPhoto.latitude!.toFixed(6)}, {selectedPhoto.longitude!.toFixed(6)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* AI Detection Panel */}
            <AIDetectionPanel 
              imageUrl={selectedPhoto.url} 
              imageName={selectedPhoto.name}
              isPro={true}
              onUpgrade={onUpgrade}
            />
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
