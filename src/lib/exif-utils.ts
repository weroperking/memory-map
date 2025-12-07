import EXIF from 'exif-js';

export interface PhotoMetadata {
  id: string;
  file: File;
  url: string;
  name: string;
  size: number;
  dateCreated?: Date;
  latitude?: number;
  longitude?: number;
  address?: string;
  camera?: string;
  lens?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: string;
  focalLength?: string;
  width?: number;
  height?: number;
}

export interface LocationCluster {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  photos: PhotoMetadata[];
}

function convertDMSToDD(degrees: number, minutes: number, seconds: number, direction: string): number {
  let dd = degrees + minutes / 60 + seconds / 3600;
  if (direction === 'S' || direction === 'W') {
    dd = dd * -1;
  }
  return dd;
}

export function extractMetadata(file: File): Promise<PhotoMetadata> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    
    img.onload = () => {
      EXIF.getData(img as any, function(this: any) {
        const allTags = EXIF.getAllTags(this);
        
        let latitude: number | undefined;
        let longitude: number | undefined;
        
        if (allTags.GPSLatitude && allTags.GPSLongitude) {
          const latRef = allTags.GPSLatitudeRef || 'N';
          const lonRef = allTags.GPSLongitudeRef || 'E';
          
          latitude = convertDMSToDD(
            allTags.GPSLatitude[0],
            allTags.GPSLatitude[1],
            allTags.GPSLatitude[2],
            latRef
          );
          longitude = convertDMSToDD(
            allTags.GPSLongitude[0],
            allTags.GPSLongitude[1],
            allTags.GPSLongitude[2],
            lonRef
          );
        }
        
        const metadata: PhotoMetadata = {
          id: crypto.randomUUID(),
          file,
          url,
          name: file.name,
          size: file.size,
          dateCreated: allTags.DateTimeOriginal ? new Date(allTags.DateTimeOriginal.replace(/:/g, '-').replace(/-/, ':').replace(/-/, ':')) : undefined,
          latitude,
          longitude,
          camera: allTags.Make ? `${allTags.Make} ${allTags.Model || ''}`.trim() : undefined,
          lens: allTags.LensModel,
          aperture: allTags.FNumber ? `f/${allTags.FNumber}` : undefined,
          shutterSpeed: allTags.ExposureTime ? `1/${Math.round(1 / allTags.ExposureTime)}s` : undefined,
          iso: allTags.ISOSpeedRatings?.toString(),
          focalLength: allTags.FocalLength ? `${allTags.FocalLength}mm` : undefined,
          width: img.naturalWidth,
          height: img.naturalHeight,
        };
        
        resolve(metadata);
      });
    };
    
    img.onerror = () => {
      resolve({
        id: crypto.randomUUID(),
        file,
        url,
        name: file.name,
        size: file.size,
      });
    };
    
    img.src = url;
  });
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=pk.eyJ1IjoibG92YWJsZS1kZW1vIiwiYSI6ImNtNXN6Z3A2bDBsMW8yanM2aG15cDVlbHIifQ.sk0KbXhxCHPvqOWVYR-qcg`
    );
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      return data.features[0].place_name;
    }
    return 'Unknown Location';
  } catch {
    return 'Unknown Location';
  }
}

export function clusterPhotosByLocation(photos: PhotoMetadata[]): LocationCluster[] {
  const clusters: Map<string, LocationCluster> = new Map();
  
  photos.forEach((photo) => {
    if (photo.latitude && photo.longitude) {
      // Round to 2 decimal places for clustering
      const clusterKey = `${photo.latitude.toFixed(2)},${photo.longitude.toFixed(2)}`;
      
      if (clusters.has(clusterKey)) {
        clusters.get(clusterKey)!.photos.push(photo);
      } else {
        clusters.set(clusterKey, {
          city: photo.address?.split(',')[0] || 'Unknown',
          country: photo.address?.split(',').pop()?.trim() || 'Unknown',
          latitude: photo.latitude,
          longitude: photo.longitude,
          photos: [photo],
        });
      }
    }
  });
  
  return Array.from(clusters.values());
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
