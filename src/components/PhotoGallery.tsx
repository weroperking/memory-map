import { MapPin, Calendar, Camera } from 'lucide-react';
import { usePhotos } from '@/contexts/PhotoContext';
import { PhotoMetadata } from '@/lib/exif-utils';

interface PhotoCardProps {
  photo: PhotoMetadata;
  onClick: () => void;
}

function PhotoCard({ photo, onClick }: PhotoCardProps) {
  return (
    <button
      onClick={onClick}
      className="group relative aspect-square overflow-hidden border-2 border-foreground bg-muted shadow-sm transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      <img
        src={photo.url}
        alt={photo.name}
        className="h-full w-full object-cover transition-transform group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="absolute bottom-0 left-0 right-0 translate-y-full p-3 transition-transform group-hover:translate-y-0">
        {photo.address && (
          <div className="flex items-center gap-1 text-left text-xs text-primary-foreground">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{photo.address.split(',')[0]}</span>
          </div>
        )}
        {photo.dateCreated && (
          <div className="mt-1 flex items-center gap-1 text-left text-xs text-primary-foreground/80">
            <Calendar className="h-3 w-3 flex-shrink-0" />
            <span>{photo.dateCreated.toLocaleDateString()}</span>
          </div>
        )}
      </div>
      {photo.latitude && photo.longitude && (
        <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center bg-chart-2 text-primary-foreground">
          <MapPin className="h-3 w-3" />
        </div>
      )}
    </button>
  );
}

export function PhotoGallery() {
  const { photos, selectPhoto } = usePhotos();

  const photosWithLocation = photos.filter((p) => p.latitude && p.longitude);
  const photosWithoutLocation = photos.filter((p) => !p.latitude || !p.longitude);

  if (photos.length === 0) return null;

  return (
    <div className="space-y-8">
      {photosWithLocation.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2 border-b-2 border-foreground pb-2">
            <MapPin className="h-5 w-5" />
            <h2 className="font-mono text-lg font-bold">
              {photosWithLocation.length} photos with location
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {photosWithLocation.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onClick={() => selectPhoto(photo)}
              />
            ))}
          </div>
        </section>
      )}

      {photosWithoutLocation.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2 border-b-2 border-foreground pb-2">
            <Camera className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-mono text-lg font-bold text-muted-foreground">
              {photosWithoutLocation.length} photos without location
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {photosWithoutLocation.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onClick={() => selectPhoto(photo)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
