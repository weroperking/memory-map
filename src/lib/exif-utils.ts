import exifr from 'exifr';

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
  // Premium fields
  colorSpace?: string;
  dotsPerInch?: number;
  timeZone?: string;
  latitudeRef?: string;
  longitudeRef?: string;
  altitudeRef?: string;
  directionRef?: string;
  direction?: string;
  pointingDirection?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface LocationCluster {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  photos: PhotoMetadata[];
}

export async function extractMetadata(file: File): Promise<PhotoMetadata> {
  const url = URL.createObjectURL(file);
  
  // Get image dimensions
  const dimensions = await new Promise<{ width: number; height: number }>((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = url;
  });
  
  // Use exifr to parse EXIF data - it handles all formats properly
  let exifData: Record<string, unknown> = {};
  let gpsData: { latitude?: number; longitude?: number } = {};
  
  try {
    // Read all EXIF data
    const allExif = await exifr.parse(file, {
      tiff: true,
      exif: true,
      gps: true,
      ifd1: true,
      interop: true,
      translateKeys: true,
      translateValues: true,
      reviveValues: true,
    });
    
    if (allExif) {
      exifData = allExif;
      console.log('EXIF data extracted:', exifData);
    }
    
    // Separately get GPS coordinates (exifr has a dedicated method)
    const gps = await exifr.gps(file);
    if (gps) {
      gpsData = gps;
      console.log('GPS data extracted:', gpsData);
    }
  } catch (err) {
    console.error('Error parsing EXIF with exifr:', err);
  }
  
  // Parse shutter speed
  let shutterSpeed: string | undefined;
  if (exifData.ExposureTime) {
    const expTime = exifData.ExposureTime as number;
    if (expTime < 1) {
      shutterSpeed = `1/${Math.round(1 / expTime)}s`;
    } else {
      shutterSpeed = `${expTime}s`;
    }
  }
  
  // Parse aperture
  let aperture: string | undefined;
  if (exifData.FNumber) {
    const fNum = exifData.FNumber as number;
    aperture = `f/${fNum.toFixed(1)}`;
  }
  
  // Parse date
  let dateCreated: Date | undefined;
  const dateStr = exifData.DateTimeOriginal || exifData.CreateDate || exifData.DateTime;
  if (dateStr) {
    if (dateStr instanceof Date) {
      dateCreated = dateStr;
    } else if (typeof dateStr === 'string') {
      const parsed = new Date(dateStr.replace(/:/g, '-').replace(' ', 'T'));
      if (!isNaN(parsed.getTime())) {
        dateCreated = parsed;
      }
    }
  }
  
  // Build camera string
  let camera: string | undefined;
  if (exifData.Make || exifData.Model) {
    const make = (exifData.Make as string || '').trim();
    const model = (exifData.Model as string || '').trim();
    // Avoid duplicate brand in model name
    if (model.toLowerCase().startsWith(make.toLowerCase())) {
      camera = model;
    } else {
      camera = `${make} ${model}`.trim();
    }
  }
  
  // Extract DPI/DPM information
  let dotsPerInch: number | undefined;
  if (exifData.XResolution) {
    const xres = exifData.XResolution as number;
    const resUnit = exifData.ResolutionUnit as number | undefined;
    // ResolutionUnit: 2 = inches, 3 = centimeters
    dotsPerInch = resUnit === 3 ? Math.round(xres / 2.54) : Math.round(xres);
  }

  // Extract color space information
  let colorSpace: string | undefined;
  if (exifData.ColorSpace) {
    const cs = exifData.ColorSpace;
    if (cs === 1) {
      colorSpace = 'sRGB';
    } else if (cs === 65535) {
      colorSpace = 'Uncalibrated';
    } else {
      colorSpace = cs?.toString();
    }
  }

  const metadata: PhotoMetadata = {
    id: crypto.randomUUID(),
    file,
    url,
    name: file.name,
    size: file.size,
    dateCreated,
    latitude: gpsData.latitude,
    longitude: gpsData.longitude,
    altitude: exifData.GPSAltitude as number | undefined,
    altitudeRef: exifData.GPSAltitudeRef?.toString(),
    camera,
    lens: exifData.LensModel as string | undefined,
    aperture,
    shutterSpeed,
    iso: exifData.ISO?.toString() || exifData.ISOSpeedRatings?.toString(),
    focalLength: exifData.FocalLength ? `${Math.round(exifData.FocalLength as number)}mm` : undefined,
    width: dimensions.width || undefined,
    height: dimensions.height || undefined,
    // Premium fields
    colorSpace,
    dotsPerInch,
    timeZone: exifData.TimeZoneOffset?.toString(),
    latitudeRef: exifData.GPSLatitudeRef?.toString(),
    longitudeRef: exifData.GPSLongitudeRef?.toString(),
    directionRef: exifData.GPSImgDirectionRef?.toString(),
    direction: exifData.GPSImgDirection?.toString(),
    pointingDirection: exifData.GPSDestBearingRef?.toString(),
  };
  
  console.log('Final metadata:', metadata);
  return metadata;
}

export async function reverseGeocode(lat: number, lon: number): Promise<{ address: string; city?: string; state?: string; country?: string }> {
  try {
    // Using OpenStreetMap Nominatim for reverse geocoding (free, no API key required)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
      {
        headers: {
          'User-Agent': 'memory-map-app (https://github.com/weroperking/memory-map)'
        }
      }
    );
    
    const data = await response.json();
    if (data && data.address) {
      const addr = data.address;
      const address = data.display_name || 'Unknown Location';
      const city = addr.city || addr.town || addr.village || undefined;
      const state = addr.state || undefined;
      const country = addr.country || undefined;
      
      return { address, city, state, country };
    }
    return { address: 'Unknown Location' };
  } catch (err) {
    console.error('Nominatim reverse geocoding error:', err);
    return { address: 'Unknown Location' };
  }
}

export function clusterPhotosByLocation(photos: PhotoMetadata[]): LocationCluster[] {
  const clusters: Map<string, LocationCluster> = new Map();
  
  photos.forEach((photo) => {
    if (photo.latitude && photo.longitude) {
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
