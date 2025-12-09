import { PhotoMetadata } from './exif-utils';
import piexif from 'piexifjs';

/**
 * Converts an updated PhotoMetadata object back into a downloadable image
 * with embedded EXIF data using piexifjs
 */
export async function createImageWithMetadata(
  originalFile: File,
  updatedMetadata: Record<string, any>
): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    try {
      console.log(`[createImageWithMetadata] Starting for file: ${originalFile.name}, size: ${originalFile.size}`);
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const originalDataUrl = e.target?.result as string;
          console.log(`[createImageWithMetadata] File read complete, DataURL length: ${originalDataUrl?.length || 0}`);
          
          // Get original EXIF if present
          let exifObj = {};
          try {
            const exif = piexif.load(originalDataUrl);
            exifObj = exif;
            console.log(`[createImageWithMetadata] Existing EXIF found`);
          } catch (err) {
            exifObj = { '0th': {}, Exif: {}, GPS: {}, '1st': {}, thumbnail: null };
            console.log(`[createImageWithMetadata] No existing EXIF, creating new structure`);
          }

          // Map updatedMetadata to EXIF fields
          // (This is a simplified mapping; expand as needed)
          if (updatedMetadata.camera) exifObj['0th'][piexif.ImageIFD.Make] = updatedMetadata.camera;
          if (updatedMetadata.lens) exifObj['Exif'][piexif.ExifIFD.LensModel] = updatedMetadata.lens;
          if (updatedMetadata.aperture) {
            const fnum = parseFloat(String(updatedMetadata.aperture).replace('f/', '')) || 0;
            exifObj['Exif'][piexif.ExifIFD.FNumber] = [Math.round(fnum * 100), 100];
          }

          // Shutter speed: try to parse formats like "1/1000s" or "1/1000" or decimal seconds
          if (updatedMetadata.shutterSpeed) {
            try {
              const s = String(updatedMetadata.shutterSpeed).trim().replace(/s$/i, '');
              if (s.includes('/')) {
                const parts = s.split('/').map(x => x.replace(/[^0-9]/g, ''));
                const num = parseInt(parts[0] || '0', 10);
                const den = parseInt(parts[1] || '1', 10) || 1;
                if (num > 0 && den > 0) exifObj['Exif'][piexif.ExifIFD.ExposureTime] = [num, den];
              } else {
                const val = parseFloat(s);
                if (!isNaN(val) && val > 0) {
                  const den = 1000000;
                  const num = Math.round(val * den);
                  exifObj['Exif'][piexif.ExifIFD.ExposureTime] = [num, den];
                }
              }
            } catch (e) {
              // ignore parse error - don't set ExposureTime
            }
          }

          if (updatedMetadata.iso) {
            const parsedIso = parseInt(String(updatedMetadata.iso).replace(/[^0-9]/g, ''), 10);
            if (!isNaN(parsedIso)) exifObj['Exif'][piexif.ExifIFD.ISOSpeedRatings] = parsedIso;
          }

          if (updatedMetadata.focalLength) {
            const fl = parseFloat(String(updatedMetadata.focalLength).replace(/mm/i, '')) || 0;
            if (!isNaN(fl) && fl > 0) exifObj['Exif'][piexif.ExifIFD.FocalLength] = [Math.round(fl * 100), 100];
          }

          // ColorSpace in EXIF should be a short: 1 = sRGB, 65535 = Uncalibrated
          if (updatedMetadata.colorSpace) {
            const cs = String(updatedMetadata.colorSpace).toLowerCase();
            if (cs.includes('srgb')) {
              exifObj['Exif'][piexif.ExifIFD.ColorSpace] = 1;
            } else if (cs.includes('uncal') || cs.includes('un')) {
              exifObj['Exif'][piexif.ExifIFD.ColorSpace] = 65535;
            } else {
              const maybeNum = parseInt(String(updatedMetadata.colorSpace).replace(/[^0-9]/g, ''), 10);
              if (!isNaN(maybeNum)) {
                exifObj['Exif'][piexif.ExifIFD.ColorSpace] = maybeNum;
              }
            }
          }

          if (updatedMetadata.dotsPerInch) {
            const dpi = Number(updatedMetadata.dotsPerInch) || 72;
            const dpiNum = Math.round(dpi);
            exifObj['0th'][piexif.ImageIFD.XResolution] = [dpiNum, 1];
            exifObj['0th'][piexif.ImageIFD.YResolution] = [dpiNum, 1];
          }
          if (updatedMetadata.city) exifObj['0th'][piexif.ImageIFD.ImageDescription] = updatedMetadata.city;
          // GPS
          if (updatedMetadata.latitude && updatedMetadata.longitude) {
            exifObj['GPS'][piexif.GPSIFD.GPSLatitude] = piexif.GPSHelper.degToDmsRational(Math.abs(updatedMetadata.latitude));
            exifObj['GPS'][piexif.GPSIFD.GPSLatitudeRef] = updatedMetadata.latitude >= 0 ? 'N' : 'S';
            exifObj['GPS'][piexif.GPSIFD.GPSLongitude] = piexif.GPSHelper.degToDmsRational(Math.abs(updatedMetadata.longitude));
            exifObj['GPS'][piexif.GPSIFD.GPSLongitudeRef] = updatedMetadata.longitude >= 0 ? 'E' : 'W';
          }
          if (updatedMetadata.altitude) {
            const alt = Number(updatedMetadata.altitude) || 0;
            exifObj['GPS'][piexif.GPSIFD.GPSAltitude] = [Math.round(Math.abs(alt) * 100), 100];
            exifObj['GPS'][piexif.GPSIFD.GPSAltitudeRef] = alt >= 0 ? 0 : 1;
          }

          // Map other common fields into ImageDescription / Exif.UserComment as a fallback
          const handled = new Set([
            'camera','lens','aperture','shutterSpeed','iso','focalLength','colorSpace','dotsPerInch','timeZone',
            'latitudeRef','longitudeRef','altitudeRef','directionRef','direction','pointingDirection','city','state','country',
            'latitude','longitude','altitude','width','height','address'
          ]);
          const extras: Record<string, any> = {};
          Object.keys(updatedMetadata).forEach(k => {
            if (!handled.has(k)) extras[k] = updatedMetadata[k];
          });
          if (Object.keys(extras).length > 0) {
            try {
              exifObj['0th'][piexif.ImageIFD.ImageDescription] = JSON.stringify(extras);
            } catch (e) {
              // best effort: put as string
              exifObj['0th'][piexif.ImageIFD.ImageDescription] = String(extras);
            }
          }

          // Remove thumbnail if present (optional)
          (exifObj as any).thumbnail = null;

          // Dump EXIF to binary
          console.log(`[createImageWithMetadata] Dumping EXIF data`);
          const exifBytes = piexif.dump(exifObj);
          console.log(`[createImageWithMetadata] EXIF bytes created, size: ${exifBytes.length}`);

          // Remove old EXIF and insert new
          console.log(`[createImageWithMetadata] Inserting EXIF into image`);
          const newDataUrl = piexif.insert(exifBytes, originalDataUrl);
          console.log(`[createImageWithMetadata] New DataURL created, length: ${newDataUrl?.length || 0}`);

          // Convert DataURL to Blob
          const byteString = atob(newDataUrl.split(',')[1]);
          const mimeString = newDataUrl.split(',')[0].split(':')[1].split(';')[0];
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: mimeString });
          console.log(`[createImageWithMetadata] Blob created successfully, size: ${blob.size}, type: ${blob.type}`);
          resolve(blob);
        } catch (err) {
          console.error(`[createImageWithMetadata] Error in file processing:`, err);
          reject(err);
        }
      };
      reader.onerror = (err) => {
        console.error(`[createImageWithMetadata] FileReader error:`, err);
        reject(err);
      };
      reader.readAsDataURL(originalFile);
    } catch (error) {
      console.error(`[createImageWithMetadata] Error in Promise setup:`, error);
      reject(error);
    }
  });
}

/**
 * Creates a metadata text file (.txt) containing all edited metadata
 * This can be downloaded alongside the image
 */
export function createMetadataFile(metadata: Record<string, any>): Blob {
  const lines: string[] = [
    '=== PHOTO METADATA ===',
    new Date().toLocaleString(),
    '================================',
    ''
  ];
  
  // Free fields (always shown)
  const freeFields = [
    'name', 'size', 'dateCreated', 'camera', 'lens', 'aperture', 
    'shutterSpeed', 'iso', 'focalLength', 'width', 'height',
    'latitude', 'longitude', 'altitude', 'address'
  ];
  
  lines.push('FREE METADATA:');
  freeFields.forEach(field => {
    const value = metadata[field];
    if (value !== undefined && value !== null && value !== '') {
      if (field === 'dateCreated' && value instanceof Date) {
        lines.push(`${field}: ${value.toLocaleString()}`);
      } else if (typeof value === 'object') {
        lines.push(`${field}: ${JSON.stringify(value)}`);
      } else {
        lines.push(`${field}: ${value}`);
      }
    }
  });
  
  lines.push('');
  lines.push('PREMIUM METADATA:');
  
  // Premium fields
  const premiumFields = [
    'colorSpace', 'dotsPerInch', 'timeZone', 'latitudeRef', 'longitudeRef',
    'altitudeRef', 'directionRef', 'direction', 'pointingDirection', 'city', 'state', 'country'
  ];
  
  premiumFields.forEach(field => {
    const value = metadata[field];
    if (value !== undefined && value !== null && value !== '') {
      lines.push(`${field}: ${value}`);
    }
  });
  
  const content = lines.join('\n');
  return new Blob([content], { type: 'text/plain' });
}

/**
 * Validates and normalizes metadata values
 */
export function validateMetadataValue(key: string, value: any): any {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }
  
  const numberFields = ['dotsPerInch', 'latitude', 'longitude', 'altitude', 'direction'];
  if (numberFields.includes(key)) {
    const num = parseFloat(value);
    return isNaN(num) ? undefined : num;
  }
  
  return String(value).trim() || undefined;
}

/**
 * Prepares multiple images for batch download
 */
export async function prepareBatchDownload(
  photos: Array<{ file: File; metadata: Record<string, any> }>,
  onProgress?: (current: number, total: number) => void
): Promise<Array<{ imageBlob: Blob; filename: string }>> {
  console.log(`[prepareBatchDownload] Starting with ${photos.length} photos`);
  const results: Array<{ imageBlob: Blob; filename: string }> = [];
  
  for (let i = 0; i < photos.length; i++) {
    const { file, metadata } = photos[i];
    try {
      console.log(`[prepareBatchDownload] Processing file ${i + 1}/${photos.length}: ${file.name}`);
      const imageBlob = await createImageWithMetadata(file, metadata);
      console.log(`[prepareBatchDownload] Successfully processed: ${file.name}, blob size: ${imageBlob.size}`);
      const filename = file.name.replace(/\.[^.]+$/, '');
      results.push({ imageBlob, filename });
      onProgress?.(i + 1, photos.length);
    } catch (error: any) {
      console.error(`[prepareBatchDownload] Error processing ${file.name}:`, error?.message || error);
      if (error && error.stack) console.error(error.stack);
    }
  }
  
  console.log(`[prepareBatchDownload] Completed with ${results.length}/${photos.length} successful results`);
  return results;
}

/**
 * Triggers a download for a single file
 */
export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Triggers batch downloads using a zip library (or sequential downloads)
 */
export async function batchDownloadFiles(
  files: Array<{ imageBlob: Blob; filename: string }>
) {
  for (let i = 0; i < files.length; i++) {
    const { imageBlob, filename } = files[i];
    downloadFile(imageBlob, `${filename}_edited.jpg`);
    if (i < files.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}
