import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { usePhotos } from '@/contexts/PhotoContext';
import { MapPin, Image, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PhotoMetadata } from '@/lib/exif-utils';

mapboxgl.accessToken = 'pk.eyJ1IjoibG92YWJsZS1kZW1vIiwiYSI6ImNtNXN6Z3A2bDBsMW8yanM2aG15cDVlbHIifQ.sk0KbXhxCHPvqOWVYR-qcg';

export function PhotoMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const { photos, selectPhoto } = usePhotos();
  const [hoveredCluster, setHoveredCluster] = useState<{ photos: PhotoMetadata[]; position: { x: number; y: number } } | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const photosWithLocation = photos.filter((p) => p.latitude && p.longitude);

  useEffect(() => {
    if (!mapContainer.current) return;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [0, 20],
        zoom: 1.5,
      });

      map.current.on('load', () => {
        setIsMapLoaded(true);
      });

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setMapError('Failed to load map. Please try again.');
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    } catch (err) {
      console.error('Map initialization error:', err);
      setMapError('Failed to initialize map.');
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (photosWithLocation.length === 0) return;

    // Group photos by approximate location (clustering)
    const clusters = new Map<string, PhotoMetadata[]>();
    photosWithLocation.forEach((photo) => {
      const key = `${photo.latitude!.toFixed(2)},${photo.longitude!.toFixed(2)}`;
      if (!clusters.has(key)) {
        clusters.set(key, []);
      }
      clusters.get(key)!.push(photo);
    });

    // Create markers for each cluster
    clusters.forEach((clusterPhotos) => {
      const firstPhoto = clusterPhotos[0];

      // Create custom marker element with brutalist square style
      const el = document.createElement('div');
      el.className = 'photo-marker';
      el.style.cssText = 'cursor: pointer;';
      
      el.innerHTML = `
        <div style="position: relative; transition: transform 0.2s;">
          <div style="width: 56px; height: 56px; border: 3px solid white; background: #1a1a1a; box-shadow: 0 4px 12px rgba(0,0,0,0.5); overflow: hidden;">
            <img src="${firstPhoto.url}" style="width: 100%; height: 100%; object-fit: cover;" alt="${firstPhoto.name}" />
          </div>
          ${clusterPhotos.length > 1 ? `
            <div style="position: absolute; top: -8px; right: -8px; width: 24px; height: 24px; background: #f97316; color: white; font-size: 11px; font-weight: bold; font-family: monospace; display: flex; align-items: center; justify-content: center; border: 2px solid white;">
              ${clusterPhotos.length}
            </div>
          ` : ''}
        </div>
      `;

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.1)';
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      el.addEventListener('click', (e) => {
        e.stopPropagation();
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

    // Fit map to show all markers with padding
    if (photosWithLocation.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      photosWithLocation.forEach((photo) => {
        bounds.extend([photo.longitude!, photo.latitude!]);
      });
      
      map.current.fitBounds(bounds, { 
        padding: { top: 80, bottom: 80, left: 80, right: 80 }, 
        maxZoom: 12,
        duration: 1000
      });
    }
  }, [photosWithLocation, selectPhoto, isMapLoaded]);

  // Close cluster popup when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setHoveredCluster(null);
    if (hoveredCluster) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [hoveredCluster]);

  if (mapError) {
    return (
      <div className="relative h-[calc(100vh-12rem)] border-2 border-foreground">
        <div className="flex h-full flex-col items-center justify-center bg-muted p-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center border-2 border-destructive bg-background">
            <MapPin className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="mb-2 font-mono text-xl font-bold">Map Error</h3>
          <p className="text-muted-foreground">{mapError}</p>
        </div>
      </div>
    );
  }

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
          
          {/* Loading overlay */}
          {!isMapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
          
          {/* Stats overlay */}
          <div className="absolute left-4 top-4 flex items-center gap-2 border-2 border-foreground bg-background px-3 py-2 shadow-lg">
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
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-2 border-foreground bg-background p-3 shadow-lg max-w-xs">
                <div className="mb-2 flex items-center justify-between gap-4">
                  <span className="font-mono text-sm font-bold">
                    {hoveredCluster.photos.length} photos at this location
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
                      className="aspect-square overflow-hidden border-2 border-foreground transition-all hover:scale-105 hover:shadow-md"
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
