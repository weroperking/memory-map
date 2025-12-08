import { MapPin, Calendar, Camera, Aperture, Timer, Gauge, Maximize, HardDrive, Sparkles, Lock, Mountain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePhotos } from '@/contexts/PhotoContext';
import { formatFileSize } from '@/lib/exif-utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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

  return (
    <Dialog open={!!selectedPhoto} onOpenChange={() => selectPhoto(null)}>
      <DialogContent className="max-w-4xl border-2 border-foreground p-0 shadow-lg">
        <div className="grid md:grid-cols-2">
          {/* Image */}
          <div className="relative aspect-square bg-muted">
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.name}
              className="h-full w-full object-contain"
            />
          </div>

          {/* Metadata */}
          <div className="flex flex-col">
            <DialogHeader className="border-b-2 border-foreground p-4">
              <DialogTitle className="font-mono text-lg">{selectedPhoto.name}</DialogTitle>
            </DialogHeader>

            <div className="flex-1 space-y-3 p-4">
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

              {selectedPhoto.latitude && selectedPhoto.longitude && (
                <div className="flex items-start gap-3 border-b border-border pb-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center border-2 border-foreground bg-chart-2 text-primary-foreground">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-mono text-muted-foreground uppercase">GPS Coordinates</p>
                    <p className="font-mono text-sm">
                      {selectedPhoto.latitude.toFixed(6)}, {selectedPhoto.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Premium Feature Teaser */}
            <div className="border-t-2 border-foreground bg-chart-4/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-4 w-4" />
                <span className="font-mono text-sm font-bold">PRO FEATURE</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Check if this image was AI-generated with our advanced detection algorithm.
              </p>
              <Button
                onClick={onUpgrade}
                className="w-full gap-2 bg-chart-4 text-foreground hover:bg-chart-4/90 border-2 border-foreground"
              >
                <Sparkles className="h-4 w-4" />
                Unlock AI Detection
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
