import React, { createContext, useContext, useState, useCallback } from 'react';
import { PhotoMetadata, extractMetadata, reverseGeocode, LocationCluster, clusterPhotosByLocation } from '@/lib/exif-utils';

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
    
    const newPhotos: PhotoMetadata[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const metadata = await extractMetadata(file);
        
        // Get address if coordinates exist
        if (metadata.latitude && metadata.longitude) {
          metadata.address = await reverseGeocode(metadata.latitude, metadata.longitude);
        }
        
        newPhotos.push(metadata);
      }
    }
    
    setPhotos((prev) => {
      const updated = [...prev, ...newPhotos];
      setClusters(clusterPhotosByLocation(updated));
      return updated;
    });
    
    setIsLoading(false);
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
