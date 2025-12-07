import { useCallback } from 'react';
import { Upload, ImagePlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePhotos } from '@/contexts/PhotoContext';

export function PhotoUploader() {
  const { addPhotos, isLoading, photos } = usePhotos();

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        await addPhotos(e.target.files);
        e.target.value = '';
      }
    },
    [addPhotos]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        await addPhotos(e.dataTransfer.files);
      }
    },
    [addPhotos]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  if (photos.length === 0) {
    return (
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
            <p className="mb-6 text-muted-foreground">
              or click to browse your device
            </p>
            <label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button asChild className="cursor-pointer gap-2 shadow-sm">
                <span>
                  <ImagePlus className="h-4 w-4" />
                  Select Photos
                </span>
              </Button>
            </label>
            <p className="mt-6 text-sm text-muted-foreground">
              Supports JPG, PNG, HEIC with GPS data
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="mb-4 flex items-center justify-between border-2 border-foreground bg-secondary p-4">
      <div className="flex items-center gap-4">
        <span className="font-mono text-lg font-bold">{photos.length} photos loaded</span>
        {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
      </div>
      <label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button asChild variant="outline" className="cursor-pointer gap-2">
          <span>
            <ImagePlus className="h-4 w-4" />
            Add More
          </span>
        </Button>
      </label>
    </div>
  );
}
