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
  altitude?: number;
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

function convertDMSToDD(dms: number[], direction: string): number {
  if (!dms || dms.length < 3) return 0;
  const degrees = dms[0] || 0;
  const minutes = dms[1] || 0;
  const seconds = dms[2] || 0;
  let dd = degrees + minutes / 60 + seconds / 3600;
  if (direction === 'S' || direction === 'W') {
    dd = dd * -1;
  }
  return dd;
}

function parseExifDate(dateStr: string): Date | undefined {
  if (!dateStr) return undefined;
  // EXIF format: "2024:01:15 14:30:00"
  const parts = dateStr.split(' ');
  if (parts.length >= 1) {
    const datePart = parts[0].replace(/:/g, '-');
    const timePart = parts[1] || '00:00:00';
    const isoDate = `${datePart}T${timePart}`;
    const parsed = new Date(isoDate);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }
  return undefined;
}

export function extractMetadata(file: File): Promise<PhotoMetadata> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    
    const createBasicMetadata = (): PhotoMetadata => ({
      id: crypto.randomUUID(),
      file,
      url,
      name: file.name,
      size: file.size,
      width: img.naturalWidth || undefined,
      height: img.naturalHeight || undefined,
    });

    const timeoutId = setTimeout(() => {
      console.log('EXIF extraction timeout for:', file.name);
      resolve(createBasicMetadata());
    }, 5000);

    img.onload = () => {
      try {
        EXIF.getData(img as unknown as HTMLImageElement, function (this: HTMLImageElement & { exifdata?: Record<string, unknown> }) {
          clearTimeout(timeoutId);
          
          try {
            const allTags = EXIF.getAllTags(this);
            console.log('EXIF tags for', file.name, ':', allTags);
            
            let latitude: number | undefined;
            let longitude: number | undefined;
            let altitude: number | undefined;
            
            // Extract GPS coordinates
            if (allTags.GPSLatitude && allTags.GPSLongitude) {
              const latRef = allTags.GPSLatitudeRef || 'N';
              const lonRef = allTags.GPSLongitudeRef || 'E';
              
              latitude = convertDMSToDD(allTags.GPSLatitude as number[], latRef as string);
              longitude = convertDMSToDD(allTags.GPSLongitude as number[], lonRef as string);
              
              console.log('GPS found:', latitude, longitude);
            }
            
            // Extract altitude
            if (allTags.GPSAltitude !== undefined) {
              const altValue = allTags.GPSAltitude as number;
              const altRef = (allTags.GPSAltitudeRef as number) || 0;
              altitude = altRef === 1 ? -altValue : altValue;
              console.log('Altitude found:', altitude);
            }
            
            // Parse shutter speed
            let shutterSpeed: string | undefined;
            if (allTags.ExposureTime) {
              const expTime = allTags.ExposureTime as number;
              if (expTime < 1) {
                shutterSpeed = `1/${Math.round(1 / expTime)}s`;
              } else {
                shutterSpeed = `${expTime}s`;
              }
            }
            
            // Parse aperture
            let aperture: string | undefined;
            if (allTags.FNumber) {
              const fNum = allTags.FNumber as number;
              aperture = `f/${fNum.toFixed(1)}`;
            }
            
            const metadata: PhotoMetadata = {
              id: crypto.randomUUID(),
              file,
              url,
              name: file.name,
              size: file.size,
              dateCreated: parseExifDate(allTags.DateTimeOriginal as string || allTags.DateTime as string || ''),
              latitude,
              longitude,
              altitude,
              camera: allTags.Make ? `${allTags.Make} ${allTags.Model || ''}`.trim() : undefined,
              lens: allTags.LensModel as string,
              aperture,
              shutterSpeed,
              iso: allTags.ISOSpeedRatings?.toString(),
              focalLength: allTags.FocalLength ? `${allTags.FocalLength}mm` : undefined,
              width: img.naturalWidth,
              height: img.naturalHeight,
            };
            
            resolve(metadata);
          } catch (err) {
            console.error('Error parsing EXIF:', err);
            resolve(createBasicMetadata());
          }
        });
      } catch (err) {
        clearTimeout(timeoutId);
        console.error('Error getting EXIF data:', err);
        resolve(createBasicMetadata());
      }
    };
    
    img.onerror = () => {
      clearTimeout(timeoutId);
      console.error('Error loading image:', file.name);
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
