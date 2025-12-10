import { useCallback, useRef, useState } from 'react';
import { Upload, ImagePlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePhotos } from '@/contexts/PhotoContext';
import { FilePickerDialog } from './FilePickerDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { analytics, handleError } from '@/lib/analytics';

export function PhotoUploader() {
  const { addPhotos, isLoading, photos } = usePhotos();
  const [showPicker, setShowPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const browseFilesRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      try {
        if (e.target.files && e.target.files.length > 0) {
          // Filter only image files
          const imageFiles: File[] = [];
          for (let i = 0; i < e.target.files.length; i++) {
            const file = e.target.files[i];
            if (file.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(file.name)) {
              imageFiles.push(file);
            }
          }
          
          if (imageFiles.length > 0) {
            const dataTransfer = new DataTransfer();
            imageFiles.forEach(file => dataTransfer.items.add(file));
            const totalSize = imageFiles.reduce((sum, f) => sum + f.size, 0);
            await addPhotos(dataTransfer.files);
            analytics.photoUpload(imageFiles.length, totalSize);
            // update storage usage after successful upload
            try {
              await analytics.updateStorageUsage();
            } catch (err) {
              console.error('Failed to update storage usage after upload:', err);
            }
          } else {
            toast.error('Please select image files');
          }
        }
      } catch (error) {
        await handleError(error as Error, 'PhotoUploader', { action: 'file_change' });
        toast.error('Failed to process photos. Please try again.');
      } finally {
        e.target.value = '';
      }
    },
    [addPhotos]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const totalSize = Array.from(e.dataTransfer.files).reduce((sum, f) => sum + f.size, 0);
        await addPhotos(e.dataTransfer.files);
        analytics.photoUpload(e.dataTransfer.files.length, totalSize);
        try {
          await analytics.updateStorageUsage();
        } catch (err) {
          console.error('Failed to update storage usage after drop upload:', err);
        }
      }
    },
    [addPhotos]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleSelectPhotos = () => {
    if (isMobile) {
      setShowPicker(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleCameraSelect = () => {
    setShowPicker(false);
    // Small delay to ensure dialog closes first
    setTimeout(() => {
      cameraInputRef.current?.click();
    }, 100);
  };

  const handleFilesSelect = () => {
    setShowPicker(false);
    // Small delay to ensure dialog closes first
    setTimeout(() => {
      browseFilesRef.current?.click();
    }, 100);
  };

  if (photos.length === 0) {
    return (
      <>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="flex min-h-[60vh] flex-col items-center justify-center border-4 border-dashed border-foreground bg-secondary p-8 transition-colors hover:bg-accent"
        >
          {isLoading ? (
            <>
              <Loader2 className="mb-4 h-16 w-16 animate-spin" />
              <p className="font-mono text-lg">Processing your photos...</p>
            </>
          ) : (
            <>
              <div className="mb-6 flex h-24 w-24 items-center justify-center border-4 border-foreground bg-background shadow-md">
                <Upload className="h-12 w-12" />
              </div>
              <h2 className="mb-2 font-mono text-2xl font-bold">Drop your photos here</h2>
              <p className="mb-6 text-muted-foreground text-center max-w-md">
                {isMobile 
                  ? 'Tap below to select photos. Use "Browse Files" for best GPS data preservation.'
                  : 'or click to browse your device'
                }
              </p>
              
              {/* Standard file input for desktop */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,application/json"
                onChange={handleFileChange}
                className="hidden"
              />
              
              {/* Camera input - captures photo directly */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
              
              {/* Browse files input - NO accept attribute to open native file browser */}
              <input
                ref={browseFilesRef}
                type="file"
                multiple
                onChange={handleFileChange}
                accept="image/*,application/json"
                className="hidden"
              />
              
              <Button 
                onClick={handleSelectPhotos}
                className="cursor-pointer gap-2 shadow-sm"
              >
                <ImagePlus className="h-4 w-4" />
                Select Photos
              </Button>
              
              <p className="mt-6 text-sm text-muted-foreground">
                Supports JPG, PNG, HEIC with GPS data
              </p>
            </>
          )}
        </div>
        
        <FilePickerDialog
          isOpen={showPicker}
          onClose={() => setShowPicker(false)}
          onSelectCamera={handleCameraSelect}
          onSelectFiles={handleFilesSelect}
        />
      </>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between border-2 border-foreground bg-secondary p-4">
        <div className="flex items-center gap-4">
          <span className="font-mono text-lg font-bold">{photos.length} photos loaded</span>
          {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
        </div>
        
        {/* Standard file input for desktop */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,application/json"
          onChange={handleFileChange}
          className="hidden"
        />
        
        {/* Camera input */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        
        {/* Browse files input - NO accept attribute */}
        <input
          ref={browseFilesRef}
          type="file"
          multiple
          onChange={handleFileChange}
          accept="image/*,application/json"
          className="hidden"
        />
        
        <Button 
          onClick={handleSelectPhotos}
          variant="outline" 
          className="cursor-pointer gap-2"
        >
          <ImagePlus className="h-4 w-4" />
          Add More
        </Button>
      </div>
      
      <FilePickerDialog
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        onSelectCamera={handleCameraSelect}
        onSelectFiles={handleFilesSelect}
      />
    </>
  );
}