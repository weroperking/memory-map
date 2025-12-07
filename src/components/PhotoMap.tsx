import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { usePhotos } from '@/contexts/PhotoContext';
import { MapPin, Image, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PhotoMetadata } from '@/lib/exif-utils';

mapboxgl.accessToken = 'pk.eyJ1IjoibG92YWJsZS1kZW1vIiwiYSI6ImNtNXN6Z3A2bDBsMW8yanM2aG15cDVlbHIifQ.sk0KbXhxCHPvqOWVYR-qcg';

export function PhotoMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const { photos, selectPhoto } = usePhotos();
  const [hoveredCluster, setHoveredCluster] = useState<{ photos: PhotoMetadata[]; position: { x: number; y: number } } | null>(null);

  const photosWithLocation = photos.filter((p) => p.latitude && p.longitude);

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [0, 20],
      zoom: 1.5,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (photosWithLocation.length === 0) return;

    // Group photos by approximate location
    const clusters = new Map<string, PhotoMetadata[]>();
    photosWithLocation.forEach((photo) => {
      const key = `${photo.latitude!.toFixed(2)},${photo.longitude!.toFixed(2)}`;
      if (!clusters.has(key)) {
        clusters.set(key, []);
      }
      clusters.get(key)!.push(photo);
    });

    // Create markers for each cluster
    clusters.forEach((clusterPhotos, key) => {
      const [lat, lng] = key.split(',').map(Number);
      const firstPhoto = clusterPhotos[0];

      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'photo-marker';
      el.innerHTML = `
        <div class="relative cursor-pointer group">
          <div class="w-12 h-12 border-2 border-black bg-white shadow-sm flex items-center justify-center overflow-hidden transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md">
            <img src="${firstPhoto.url}" class="w-full h-full object-cover" />
          </div>
          ${clusterPhotos.length > 1 ? `
            <div class="absolute -top-2 -right-2 w-6 h-6 bg-black text-white text-xs font-mono font-bold flex items-center justify-center border-2 border-white">
              ${clusterPhotos.length}
            </div>
          ` : ''}
        </div>
      `;

      el.addEventListener('click', () => {
        if (clusterPhotos.length === 1) {
          selectPhoto(clusterPhotos[0]);
        } else {
          const rect = el.getBoundingClientRect();
          setHoveredCluster({
            photos: clusterPhotos,
            position: { x: rect.left + rect.width / 2, y: rect.top },
          });
        }
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([firstPhoto.longitude!, firstPhoto.latitude!])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Fit map to show all markers
    if (photosWithLocation.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      photosWithLocation.forEach((photo) => {
        bounds.extend([photo.longitude!, photo.latitude!]);
      });
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 12 });
    }
  }, [photosWithLocation, selectPhoto]);

  return (
    <div className="relative h-[calc(100vh-12rem)] border-2 border-foreground">
      {photosWithLocation.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center bg-muted p-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center border-2 border-foreground bg-background">
            <MapPin className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 font-mono text-xl font-bold">No photos with location</h3>
          <p className="text-muted-foreground">
            Upload photos with GPS data to see them on the map
          </p>
        </div>
      ) : (
        <>
          <div ref={mapContainer} className="h-full w-full" />
          
          {/* Stats overlay */}
          <div className="absolute left-4 top-4 flex items-center gap-2 border-2 border-foreground bg-background px-3 py-2 shadow-sm">
            <Image className="h-4 w-4" />
            <span className="font-mono text-sm font-bold">
              {photosWithLocation.length} photos mapped
            </span>
          </div>

          {/* Cluster popup */}
          {hoveredCluster && (
            <div
              className="fixed z-50 -translate-x-1/2 -translate-y-full"
              style={{ left: hoveredCluster.position.x, top: hoveredCluster.position.y - 10 }}
            >
              <div className="border-2 border-foreground bg-background p-3 shadow-md">
                <div className="mb-2 flex items-center justify-between gap-4">
                  <span className="font-mono text-sm font-bold">
                    {hoveredCluster.photos.length} photos
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setHoveredCluster(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid max-h-48 grid-cols-3 gap-1 overflow-y-auto">
                  {hoveredCluster.photos.map((photo) => (
                    <button
                      key={photo.id}
                      onClick={() => {
                        selectPhoto(photo);
                        setHoveredCluster(null);
                      }}
                      className="aspect-square overflow-hidden border border-foreground transition-opacity hover:opacity-80"
                    >
                      <img
                        src={photo.url}
                        alt={photo.name}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
