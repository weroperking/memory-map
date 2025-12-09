import { MapPin, Calendar, Camera, Aperture, Timer, Gauge, Maximize, HardDrive, Mountain, AlertCircle, Compass, Droplets, PenTool, Lock, Clock } from 'lucide-react';
import { usePhotos } from '@/contexts/PhotoContext';
import { formatFileSize } from '@/lib/exif-utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AIDetectionPanel } from './AIDetectionPanel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface PhotoDetailProps {
  onUpgrade: () => void;
  isPro?: boolean;
}

export function PhotoDetail({ onUpgrade, isPro = false }: PhotoDetailProps) {
  const { selectedPhoto, selectPhoto } = usePhotos();

  if (!selectedPhoto) return null;

  // Build location value - use GPS coordinates if available, otherwise use address
  let locationValue: string | undefined;
  if (selectedPhoto.latitude && selectedPhoto.longitude) {
    locationValue = `${selectedPhoto.latitude.toFixed(6)}, ${selectedPhoto.longitude.toFixed(6)}`;
  } else if (selectedPhoto.address) {
    locationValue = selectedPhoto.address;
  }

  const metadata = [
    { icon: MapPin, label: 'Location', value: locationValue },
    { icon: Calendar, label: 'Date', value: selectedPhoto.dateCreated?.toLocaleString() },
    { icon: Camera, label: 'Camera', value: selectedPhoto.camera },
    { icon: Aperture, label: 'Aperture', value: selectedPhoto.aperture },
    { icon: Timer, label: 'Shutter', value: selectedPhoto.shutterSpeed },
    { icon: Gauge, label: 'ISO', value: selectedPhoto.iso },
    { icon: Mountain, label: 'Altitude', value: selectedPhoto.altitude !== undefined ? `${selectedPhoto.altitude.toFixed(1)}m` : undefined },
    { icon: Maximize, label: 'Resolution', value: selectedPhoto.width && selectedPhoto.height ? `${selectedPhoto.width} × ${selectedPhoto.height}` : undefined },
    { icon: HardDrive, label: 'Size', value: formatFileSize(selectedPhoto.size) },
  ].filter((m) => m.value);

  // Premium metadata fields
  const premiumMetadata = [
    { icon: PenTool, label: 'Focal Length', value: selectedPhoto.focalLength },
    { icon: Droplets, label: 'Color Space', value: selectedPhoto.colorSpace },
    { icon: Gauge, label: 'DPI', value: selectedPhoto.dotsPerInch },
    { icon: Clock, label: 'Time Zone', value: selectedPhoto.timeZone },
    { icon: MapPin, label: 'Latitude Ref', value: selectedPhoto.latitudeRef },
    { icon: MapPin, label: 'Longitude Ref', value: selectedPhoto.longitudeRef },
    { icon: Mountain, label: 'Altitude Ref', value: selectedPhoto.altitudeRef },
    { icon: Compass, label: 'Direction Ref', value: selectedPhoto.directionRef },
    { icon: Compass, label: 'Direction', value: selectedPhoto.direction },
    { icon: Compass, label: 'Pointing', value: selectedPhoto.pointingDirection },
    { icon: MapPin, label: 'City', value: selectedPhoto.city, isPremium: true },
    { icon: MapPin, label: 'State', value: selectedPhoto.state, isPremium: true },
    { icon: MapPin, label: 'Country', value: selectedPhoto.country, isPremium: true },
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

              {/* Basic Metadata */}
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



              {/* Premium Metadata Section */}
              {premiumMetadata.length > 0 && (
                <div className="mt-6 pt-6 border-t-4 border-chart-4">
                  <div className="mb-4 p-3 border-2 border-chart-4 bg-chart-4/5 rounded">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-mono font-bold uppercase text-chart-4">✨ Premium Details</h3>
                      {!isPro && <Badge className="bg-chart-4 text-foreground text-xs font-bold">Unlock Pro</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">See {premiumMetadata.length} more details with Pro</p>
                  </div>
                  
                  {premiumMetadata.map(({ icon: Icon, label, value, isPremium }) => (
                    <div key={label} className={`flex items-start gap-3 border-b border-border pb-3 transition-all ${
                      !isPro && isPremium ? 'bg-chart-4/5 p-2 rounded border-2 border-chart-4 opacity-100' : 'opacity-75 hover:opacity-100'
                    }`}>
                      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center border-2 rounded relative ${
                        !isPro && isPremium ? 'border-chart-4 bg-chart-4' : 'border-foreground bg-secondary'
                      }`}>
                        <Icon className={`h-4 w-4 ${!isPro && isPremium ? 'text-foreground' : ''}`} />
                        {!isPro && isPremium && (
                          <Lock className="h-3 w-3 absolute -top-1 -right-1 bg-background rounded-full p-0.5 text-chart-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-xs font-mono uppercase ${
                          !isPro && isPremium ? 'text-chart-4 font-bold' : 'text-muted-foreground'
                        }`}>{label}</p>
                        {isPro || !isPremium ? (
                          <p className={`font-medium ${!isPro && isPremium ? 'text-chart-4 font-bold' : ''}`}>{value}</p>
                        ) : (
                          <button 
                            onClick={onUpgrade}
                            className="text-xs font-mono font-bold text-chart-4 hover:underline"
                          >
                            Unlock with Pro →
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Detection Panel */}
            <AIDetectionPanel 
              imageUrl={selectedPhoto.url} 
              imageName={selectedPhoto.name}
              isPro={isPro}
              onUpgrade={onUpgrade}
            />
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
