import React, { createContext, useContext, useState, useCallback } from 'react';
import { PhotoMetadata, extractMetadata, reverseGeocode, LocationCluster, clusterPhotosByLocation } from '@/lib/exif-utils';
import { toast } from 'sonner';

interface PhotoContextType {
  photos: PhotoMetadata[];
  clusters: LocationCluster[];
  selectedPhoto: PhotoMetadata | null;
  isLoading: boolean;
  addPhotos: (files: FileList) => Promise<void>;
  selectPhoto: (photo: PhotoMetadata | null) => void;
  clearPhotos: () => void;
}

const PhotoContext = createContext<PhotoContextType | undefined>(undefined);

export function PhotoProvider({ children }: { children: React.ReactNode }) {
  const [photos, setPhotos] = useState<PhotoMetadata[]>([]);
  const [clusters, setClusters] = useState<LocationCluster[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const addPhotos = useCallback(async (files: FileList) => {
    setIsLoading(true);
    console.log('Starting to process', files.length, 'files');
    
    try {
      const newPhotos: PhotoMetadata[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log('Processing file:', file.name, file.type);
        
        if (file.type.startsWith('image/') || file.name.match(/\.(jpg|jpeg|png|heic|heif|webp)$/i)) {
          try {
            // CRITICAL: Extract metadata from ORIGINAL file FIRST before any processing
            // Browser compression can strip EXIF data even with preserveExif flag
            console.log('Extracting metadata from ORIGINAL file:', file.name);
            const metadata = await extractMetadata(file);
            console.log('Extracted metadata from original:', metadata);
            
            // Get address if coordinates exist
            if (metadata.latitude && metadata.longitude) {
              try {
                metadata.address = await reverseGeocode(metadata.latitude, metadata.longitude);
                console.log('Reverse geocoded:', metadata.address);
              } catch (err) {
                console.error('Geocoding error:', err);
              }
            }
            
            newPhotos.push(metadata);
          } catch (err) {
            console.error('Error processing file:', file.name, err);
          }
        }
      }
      
      console.log('Processed', newPhotos.length, 'photos');
      
      if (newPhotos.length > 0) {
        const withLocation = newPhotos.filter(p => p.latitude && p.longitude).length;
        toast.success(`Added ${newPhotos.length} photo${newPhotos.length > 1 ? 's' : ''}`, {
          description: withLocation > 0 ? `${withLocation} with GPS location data` : 'No GPS data found - check GPS Tips for help',
        });
      }
      
      setPhotos((prev) => {
        const updated = [...prev, ...newPhotos];
        setClusters(clusterPhotosByLocation(updated));
        return updated;
      });
    } catch (err) {
      console.error('Error in addPhotos:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectPhoto = useCallback((photo: PhotoMetadata | null) => {
    setSelectedPhoto(photo);
  }, []);

  const clearPhotos = useCallback(() => {
    photos.forEach((photo) => URL.revokeObjectURL(photo.url));
    setPhotos([]);
    setClusters([]);
    setSelectedPhoto(null);
  }, [photos]);

  return (
    <PhotoContext.Provider
      value={{
        photos,
        clusters,
        selectedPhoto,
        isLoading,
        addPhotos,
        selectPhoto,
        clearPhotos,
      }}
    >
      {children}
    </PhotoContext.Provider>
  );
}

export function usePhotos() {
  const context = useContext(PhotoContext);
  if (context === undefined) {
    throw new Error('usePhotos must be used within a PhotoProvider');
  }
  return context;
}
