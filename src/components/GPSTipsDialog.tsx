import { HelpCircle, Smartphone, Monitor, Apple } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function GPSTipsDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-2 border-foreground">
          <HelpCircle className="h-4 w-4" />
          GPS Tips
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl border-2 border-foreground">
        <DialogHeader className="border-b-2 border-foreground pb-4">
          <DialogTitle className="font-mono text-xl">
            Enable GPS in Your Photos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border-2 border-chart-1 bg-chart-1/10 p-4">
            <p className="font-mono text-sm font-bold text-chart-1 mb-2">⚠️ BROWSER PRIVACY NOTICE</p>
            <p className="text-sm text-muted-foreground">
              Web browsers often <strong>strip GPS metadata</strong> from uploaded images for privacy protection. 
              For best results, use a native app or transfer files directly via USB/AirDrop.
            </p>
          </div>

          <Tabs defaultValue="android" className="w-full">
            <TabsList className="w-full grid grid-cols-4 border-2 border-foreground">
              <TabsTrigger value="android" className="gap-2 font-mono text-xs">
                <Smartphone className="h-4 w-4" />
                Android
              </TabsTrigger>
              <TabsTrigger value="ios" className="gap-2 font-mono text-xs">
                <Apple className="h-4 w-4" />
                iOS
              </TabsTrigger>
              <TabsTrigger value="windows" className="gap-2 font-mono text-xs">
                <Monitor className="h-4 w-4" />
                Windows
              </TabsTrigger>
              <TabsTrigger value="mac" className="gap-2 font-mono text-xs">
                <Apple className="h-4 w-4" />
                Mac/Linux
              </TabsTrigger>
            </TabsList>

            <TabsContent value="android" className="mt-4 space-y-3">
              <h4 className="font-mono font-bold">Samsung Camera App:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Open <strong>Camera</strong> app</li>
                <li>Tap the <strong>⚙️ Settings</strong> gear icon</li>
                <li>Enable <strong>"Location tags"</strong> or <strong>"Save location"</strong></li>
                <li>Allow location permission when prompted</li>
              </ol>
              
              <h4 className="font-mono font-bold mt-4">Google Camera:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Open Camera → Swipe down for settings</li>
                <li>Go to <strong>More settings</strong> → <strong>Save location</strong></li>
                <li>Toggle ON</li>
              </ol>

              <h4 className="font-mono font-bold mt-4">Transfer Tips:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Use <strong>USB cable</strong> to transfer (preserves metadata)</li>
                <li>Avoid messaging apps (WhatsApp, Telegram strip GPS)</li>
                <li>Use <strong>Google Photos</strong> web → download original</li>
              </ul>
            </TabsContent>

            <TabsContent value="ios" className="mt-4 space-y-3">
              <h4 className="font-mono font-bold">Enable Location for Camera:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Go to <strong>Settings</strong> → <strong>Privacy & Security</strong></li>
                <li>Tap <strong>Location Services</strong></li>
                <li>Find <strong>Camera</strong> → Set to <strong>"While Using"</strong></li>
              </ol>

              <h4 className="font-mono font-bold mt-4">Transfer Tips:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Use <strong>AirDrop</strong> to Mac (preserves all metadata)</li>
                <li>Use <strong>Files app</strong> → Save to iCloud/Dropbox</li>
                <li>Download from <strong>iCloud.com</strong> on computer</li>
                <li>Avoid iMessage/social apps (often strip GPS)</li>
              </ul>

              <h4 className="font-mono font-bold mt-4">Check Photo Has GPS:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Open Photos app → Select photo</li>
                <li>Swipe up to see info</li>
                <li>Look for map thumbnail (means GPS exists)</li>
              </ol>
            </TabsContent>

            <TabsContent value="windows" className="mt-4 space-y-3">
              <h4 className="font-mono font-bold">Windows Camera App:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Go to <strong>Settings</strong> → <strong>Privacy</strong> → <strong>Location</strong></li>
                <li>Enable <strong>"Allow apps to access your location"</strong></li>
                <li>Scroll down and enable for <strong>Camera</strong> app</li>
              </ol>

              <h4 className="font-mono font-bold mt-4">Check Photo Metadata:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Right-click photo → <strong>Properties</strong></li>
                <li>Go to <strong>Details</strong> tab</li>
                <li>Look for <strong>GPS</strong> section with Latitude/Longitude</li>
              </ol>

              <h4 className="font-mono font-bold mt-4">Browser Workaround:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Try <strong>Firefox</strong> - less aggressive metadata stripping</li>
                <li>Or download our native app (coming soon)</li>
              </ul>
            </TabsContent>

            <TabsContent value="mac" className="mt-4 space-y-3">
              <h4 className="font-mono font-bold">macOS/Linux:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Photos from iPhone via <strong>AirDrop</strong> keep GPS</li>
                <li>Photos via <strong>USB import</strong> keep GPS</li>
                <li>Use <strong>Image Capture</strong> app (Mac) for direct camera import</li>
              </ol>

              <h4 className="font-mono font-bold mt-4">Check GPS in Preview:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Open photo in <strong>Preview</strong></li>
                <li>Press <strong>⌘ + I</strong> (Get Info)</li>
                <li>Check <strong>GPS</strong> tab for coordinates</li>
              </ol>

              <h4 className="font-mono font-bold mt-4">Linux (ExifTool):</h4>
              <pre className="bg-muted p-2 rounded text-xs font-mono overflow-x-auto">
                exiftool -GPSLatitude -GPSLongitude photo.jpg
              </pre>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
