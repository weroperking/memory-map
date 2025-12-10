import { Camera, FileImage, Folder } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface FilePickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCamera: () => void;
  onSelectFiles: () => void;
}

export function FilePickerDialog({ isOpen, onClose, onSelectCamera, onSelectFiles }: FilePickerDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-2 border-foreground">
        <DialogHeader>
          <DialogTitle className="text-center font-mono text-xl">Choose an action</DialogTitle>
          <p className="text-center text-muted-foreground text-sm">
            For best GPS metadata preservation, use "Browse Files"
          </p>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-4">
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-28 gap-3 border-2 border-foreground hover:bg-secondary"
            onClick={() => {
              onSelectCamera();
              onClose();
            }}
          >
            <div className="flex h-12 w-12 items-center justify-center border-2 border-foreground bg-secondary rounded-lg">
              <Camera className="h-6 w-6" />
            </div>
            <span className="font-mono text-sm font-bold">Camera</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-28 gap-3 border-2 border-foreground hover:bg-secondary"
            onClick={() => {
              onSelectFiles();
              onClose();
            }}
          >
            <div className="flex h-12 w-12 items-center justify-center border-2 border-foreground bg-chart-4 rounded-lg">
              <Folder className="h-6 w-6" />
            </div>
            <span className="font-mono text-sm font-bold">Browse Files</span>
          </Button>
        </div>
        
        <div className="border-t-2 border-foreground pt-4">
          <div className="flex items-start gap-2 p-3 bg-chart-4/10 border border-chart-4 rounded">
            <FileImage className="h-5 w-5 text-chart-4 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <p className="font-bold text-foreground mb-1">Why "Browse Files"?</p>
              <p>Google Photos and gallery apps often strip GPS metadata. Using the file browser preserves all original EXIF data including location.</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
