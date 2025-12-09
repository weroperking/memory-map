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

// Read EXIF from file binary directly - improved version
async function readExifFromFile(file: File): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const view = new DataView(buffer);
        
        // Check for JPEG
        if (view.getUint16(0, false) !== 0xFFD8) {
          console.log('Not a JPEG file, trying alternative detection');
          resolve({});
          return;
        }
        
        console.log('JPEG detected, searching for EXIF marker...');
        const length = view.byteLength;
        let offset = 2;
        
        // Search through all markers
        while (offset < length - 4) {
          const marker = view.getUint16(offset, false);
          
          // APP1 marker (EXIF)
          if (marker === 0xFFE1) {
            const segmentLength = view.getUint16(offset + 2, false);
            console.log('Found APP1 marker at offset', offset, 'length:', segmentLength);
            
            // Check if this is EXIF data
            const exifHeader = String.fromCharCode(
              view.getUint8(offset + 4),
              view.getUint8(offset + 5),
              view.getUint8(offset + 6),
              view.getUint8(offset + 7)
            );
            
            if (exifHeader === 'Exif') {
              console.log('EXIF header confirmed');
              const exifData = parseExifData(view, offset + 4);
              console.log('Parsed EXIF data:', exifData);
              resolve(exifData);
              return;
            }
          }
          
          // Move to next marker
          if (marker === 0xFFD8 || marker === 0xFFD9) {
            offset += 2;
          } else if ((marker & 0xFF00) === 0xFF00) {
            const segLen = view.getUint16(offset + 2, false);
            offset += 2 + segLen;
          } else {
            offset++;
          }
        }
        
        console.log('No EXIF data found in file');
        resolve({});
      } catch (err) {
        console.error('Error reading EXIF:', err);
        resolve({});
      }
    };
    
    reader.onerror = () => {
      console.error('FileReader error');
      resolve({});
    };
    reader.readAsArrayBuffer(file);
  });
}

function parseExifData(view: DataView, start: number): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  try {
    // Check for "Exif" header
    const exifHeader = String.fromCharCode(
      view.getUint8(start),
      view.getUint8(start + 1),
      view.getUint8(start + 2),
      view.getUint8(start + 3)
    );
    
    if (exifHeader !== 'Exif') {
      return result;
    }
    
    const tiffOffset = start + 6;
    const littleEndian = view.getUint16(tiffOffset, false) === 0x4949;
    
    const ifdOffset = view.getUint32(tiffOffset + 4, littleEndian);
    const tags = parseTags(view, tiffOffset, tiffOffset + ifdOffset, littleEndian);
    
    Object.assign(result, tags);
    
    // Parse EXIF IFD
    if (tags.ExifIFDPointer) {
      const exifTags = parseTags(view, tiffOffset, tiffOffset + (tags.ExifIFDPointer as number), littleEndian);
      Object.assign(result, exifTags);
    }
    
    // Parse GPS IFD
    if (tags.GPSInfoIFDPointer) {
      const gpsTags = parseGPSTags(view, tiffOffset, tiffOffset + (tags.GPSInfoIFDPointer as number), littleEndian);
      Object.assign(result, gpsTags);
    }
  } catch (err) {
    console.error('Error parsing EXIF:', err);
  }
  
  return result;
}

const TIFF_TAGS: Record<number, string> = {
  0x010F: 'Make',
  0x0110: 'Model',
  0x0112: 'Orientation',
  0x011A: 'XResolution',
  0x011B: 'YResolution',
  0x0128: 'ResolutionUnit',
  0x0132: 'DateTime',
  0x8769: 'ExifIFDPointer',
  0x8825: 'GPSInfoIFDPointer',
};

const EXIF_TAGS: Record<number, string> = {
  0x829A: 'ExposureTime',
  0x829D: 'FNumber',
  0x8827: 'ISOSpeedRatings',
  0x9003: 'DateTimeOriginal',
  0x9004: 'DateTimeDigitized',
  0x920A: 'FocalLength',
  0xA405: 'FocalLengthIn35mmFilm',
  0xA433: 'LensMake',
  0xA434: 'LensModel',
};

const GPS_TAGS: Record<number, string> = {
  0x0000: 'GPSVersionID',
  0x0001: 'GPSLatitudeRef',
  0x0002: 'GPSLatitude',
  0x0003: 'GPSLongitudeRef',
  0x0004: 'GPSLongitude',
  0x0005: 'GPSAltitudeRef',
  0x0006: 'GPSAltitude',
};

function parseTags(view: DataView, tiffOffset: number, ifdOffset: number, littleEndian: boolean): Record<string, unknown> {
  const tags: Record<string, unknown> = {};
  const entries = view.getUint16(ifdOffset, littleEndian);
  
  for (let i = 0; i < entries; i++) {
    const entryOffset = ifdOffset + 2 + i * 12;
    const tag = view.getUint16(entryOffset, littleEndian);
    const tagName = TIFF_TAGS[tag] || EXIF_TAGS[tag];
    
    if (tagName) {
      const value = readTagValue(view, entryOffset, tiffOffset, littleEndian);
      if (value !== undefined) {
        tags[tagName] = value;
      }
    }
  }
  
  return tags;
}

function parseGPSTags(view: DataView, tiffOffset: number, ifdOffset: number, littleEndian: boolean): Record<string, unknown> {
  const tags: Record<string, unknown> = {};
  const entries = view.getUint16(ifdOffset, littleEndian);
  
  for (let i = 0; i < entries; i++) {
    const entryOffset = ifdOffset + 2 + i * 12;
    const tag = view.getUint16(entryOffset, littleEndian);
    const tagName = GPS_TAGS[tag];
    
    if (tagName) {
      const value = readTagValue(view, entryOffset, tiffOffset, littleEndian);
      if (value !== undefined) {
        tags[tagName] = value;
        console.log('GPS Tag:', tagName, value);
      }
    }
  }
  
  return tags;
}

function readTagValue(view: DataView, entryOffset: number, tiffOffset: number, littleEndian: boolean): unknown {
  const type = view.getUint16(entryOffset + 2, littleEndian);
  const count = view.getUint32(entryOffset + 4, littleEndian);
  const valueOffset = entryOffset + 8;
  
  switch (type) {
    case 1: // BYTE
      return view.getUint8(valueOffset);
    case 2: { // ASCII
      const strOffset = count > 4 ? tiffOffset + view.getUint32(valueOffset, littleEndian) : valueOffset;
      let str = '';
      for (let i = 0; i < count - 1; i++) {
        str += String.fromCharCode(view.getUint8(strOffset + i));
      }
      return str;
    }
    case 3: // SHORT
      return view.getUint16(valueOffset, littleEndian);
    case 4: // LONG
      return view.getUint32(valueOffset, littleEndian);
    case 5: { // RATIONAL
      const offset = tiffOffset + view.getUint32(valueOffset, littleEndian);
      if (count === 1) {
        const numerator = view.getUint32(offset, littleEndian);
        const denominator = view.getUint32(offset + 4, littleEndian);
        return denominator ? numerator / denominator : 0;
      } else {
        const values: number[] = [];
        for (let i = 0; i < count; i++) {
          const numerator = view.getUint32(offset + i * 8, littleEndian);
          const denominator = view.getUint32(offset + i * 8 + 4, littleEndian);
          values.push(denominator ? numerator / denominator : 0);
        }
        return values;
      }
    }
    default:
      return undefined;
  }
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
  
  // Read EXIF from binary
  const exifData = await readExifFromFile(file);
  console.log('EXIF data for', file.name, ':', exifData);
  
  let latitude: number | undefined;
  let longitude: number | undefined;
  let altitude: number | undefined;
  
  // Extract GPS coordinates
  if (exifData.GPSLatitude && exifData.GPSLongitude) {
    const latRef = (exifData.GPSLatitudeRef as string) || 'N';
    const lonRef = (exifData.GPSLongitudeRef as string) || 'E';
    
    latitude = convertDMSToDD(exifData.GPSLatitude as number[], latRef);
    longitude = convertDMSToDD(exifData.GPSLongitude as number[], lonRef);
    
    console.log('GPS coordinates:', latitude, longitude);
  }
  
  // Extract altitude
  if (exifData.GPSAltitude !== undefined) {
    const altValue = exifData.GPSAltitude as number;
    const altRef = (exifData.GPSAltitudeRef as number) || 0;
    altitude = altRef === 1 ? -altValue : altValue;
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
  
  const metadata: PhotoMetadata = {
    id: crypto.randomUUID(),
    file,
    url,
    name: file.name,
    size: file.size,
    dateCreated: parseExifDate((exifData.DateTimeOriginal as string) || (exifData.DateTime as string) || ''),
    latitude,
    longitude,
    altitude,
    camera: exifData.Make ? `${exifData.Make} ${exifData.Model || ''}`.trim() : undefined,
    lens: exifData.LensModel as string,
    aperture,
    shutterSpeed,
    iso: exifData.ISOSpeedRatings?.toString(),
    focalLength: exifData.FocalLength ? `${Math.round(exifData.FocalLength as number)}mm` : undefined,
    width: dimensions.width || undefined,
    height: dimensions.height || undefined,
  };
  
  return metadata;
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
