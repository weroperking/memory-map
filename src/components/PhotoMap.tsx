import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { usePhotos } from '@/contexts/PhotoContext';
import { MapPin, Image, X, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PhotoMetadata } from '@/lib/exif-utils';
import { analytics, handleError } from '@/lib/analytics';

type MapStyle = 'carto-light' | 'carto-dark' | 'osm' | 'satellite' | 'satellite-streets';

const MAP_STYLES: Record<MapStyle, { name: string; url: string; attribution: string }> = {
  'carto-light': {
    name: 'Carto Light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  },
  'carto-dark': {
    name: 'Carto Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  },
  osm: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
  'satellite': {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &copy; DigitalGlobe &copy; Earthstar Geographics',
  },
  'satellite-streets': {
    name: 'Satellite + Streets',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri',
  },
};

export function PhotoMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const { photos, selectPhoto } = usePhotos();
  const [hoveredCluster, setHoveredCluster] = useState<{ photos: PhotoMetadata[]; position: { x: number; y: number } } | null>(null);
  const [mapStyle, setMapStyle] = useState<MapStyle>('carto-dark');
  const [showStyleMenu, setShowStyleMenu] = useState(false);

  const photosWithLocation = photos.filter((p) => p.latitude && p.longitude);

  const [mapError, setMapError] = useState<string | null>(null);

  // Initialize or re-initialize map
  const createMap = () => {
    if (!mapContainer.current) return;
    try {
      // Remove existing map if present
      if (map.current) {
        map.current.remove();
        map.current = null;
      }

      // Create Leaflet map
      map.current = L.map(mapContainer.current, {
        center: [20, 0],
        zoom: 1.5,
      });

      // Add initial tile layer
      updateTileLayer('carto-dark');
      setMapError(null);
    } catch (err) {
      handleError(err as Error, 'PhotoMap', { action: 'createMap' });
      setMapError('Failed to initialize map.');
    }
  };

  // Update tile layer without recreating the map
  const updateTileLayer = (style: MapStyle) => {
    if (!map.current) return;

    const styleConfig = MAP_STYLES[style];

    // Remove existing tile layer
    if (tileLayerRef.current) {
      map.current.removeLayer(tileLayerRef.current);
    }

    // Add new tile layer
    tileLayerRef.current = L.tileLayer(styleConfig.url, {
      attribution: styleConfig.attribution,
      maxZoom: 20,
    }).addTo(map.current);
  };

  useEffect(() => {
    createMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Handle map style changes
  useEffect(() => {
    updateTileLayer(mapStyle);
    analytics.mapStyleChange(mapStyle);
  }, [mapStyle]);

  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (photosWithLocation.length === 0) return;

    // Helper function to calculate distance between two points (in meters)
    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371000; // Earth's radius in meters
      const φ1 = (lat1 * Math.PI) / 180;
      const φ2 = (lat2 * Math.PI) / 180;
      const Δφ = ((lat2 - lat1) * Math.PI) / 180;
      const Δλ = ((lon2 - lon1) * Math.PI) / 180;
      const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    // Group photos using distance-based clustering (100m tolerance)
    const clusters = new Map<string, PhotoMetadata[]>();
    const clusterCenters = new Map<string, { lat: number; lng: number }>();
    const CLUSTER_DISTANCE = 100; // meters

    photosWithLocation.forEach((photo) => {
      const lat = photo.latitude!;
      const lng = photo.longitude!;
      let assignedCluster = false;

      // Check if photo is close enough to existing cluster
      for (const [clusterId, center] of clusterCenters.entries()) {
        const distance = getDistance(lat, lng, center.lat, center.lng);
        if (distance <= CLUSTER_DISTANCE) {
          clusters.get(clusterId)!.push(photo);
          assignedCluster = true;
          break;
        }
      }

      // Create new cluster if not close to existing ones
      if (!assignedCluster) {
        const clusterId = `${clusters.size}`;
        clusters.set(clusterId, [photo]);
        clusterCenters.set(clusterId, { lat, lng });
      }
    });

    // Create markers for each cluster
    clusters.forEach((clusterPhotos, clusterId) => {
      // Calculate cluster center (average of all photos in cluster)
      const avgLat = clusterPhotos.reduce((sum, p) => sum + p.latitude!, 0) / clusterPhotos.length;
      const avgLng = clusterPhotos.reduce((sum, p) => sum + p.longitude!, 0) / clusterPhotos.length;
      
      const firstPhoto = clusterPhotos[0];

      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'photo-marker';
      el.innerHTML = `
        <div class="relative cursor-pointer group">
          <div class="w-12 h-12 border-2 border-black bg-white shadow-sm flex items-center justify-cente
r overflow-hidden transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md">              <img src="${firstPhoto.url}" class="w-full h-full object-cover" />
          </div>
          ${clusterPhotos.length > 1 ? `
            <div class="absolute -top-2 -right-2 w-6 h-6 bg-black text-white text-xs font-mono font-bold
 flex items-center justify-center border-2 border-white">                                                             ${clusterPhotos.length}
            </div>
          ` : ''}
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        analytics.logActivity('cluster_click', 'marker', undefined, { cluster_size: clusterPhotos.length });
        if (clusterPhotos.length === 1) {
          selectPhoto(clusterPhotos[0]);
        } else {
          // Zoom to cluster at level 18 for street-level detail
          map.current!.setView([avgLat, avgLng], 18, { animate: true });
          const rect = el.getBoundingClientRect();
          setHoveredCluster({
            photos: clusterPhotos,
            position: { x: rect.left + rect.width / 2, y: rect.top },
          });
        }
      });

      // Create Leaflet marker with custom icon
      const marker = L.marker([avgLat, avgLng], {
        icon: L.divIcon({
          html: el.innerHTML,
          className: '',
          iconSize: [48, 48],
          iconAnchor: [24, 24],
        }),
      }).addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Fit map to show all markers
    if (photosWithLocation.length > 0 && markersRef.current.length > 0) {
      const group = new L.FeatureGroup(markersRef.current);
      map.current.fitBounds(group.getBounds(), { padding: [50, 50] });
    }
  }, [photosWithLocation, selectPhoto]);

  return (
    <div className="relative h-[calc(100vh-12rem)] border-2 border-foreground">
      {photosWithLocation.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center bg-muted p-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center border-2 border-foreground bg-
background">                                                                                                        <MapPin className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 font-mono text-xl font-bold">No photos with location</h3>
          <p className="text-muted-foreground">
            Upload photos with GPS data to see them on the map
          </p>
        </div>
      ) : (
        <>
          <div ref={mapContainer} className={`h-full w-full z-0 transition-opacity ${hoveredCluster ? 'opacity-60' : 'opacity-100'}`} />
          {/* Map error overlay */}
          {mapError && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 p-4 text-center">                                                                                                <div className="mb-3 text-sm font-mono font-bold">{mapError}</div>
              <div className="flex gap-2">
                <Button onClick={() => { setMapError(null); createMap(); }} className="border-2">Retry</Button>
              </div>
            </div>
          )}

          {/* Stats overlay */}
          <div className="absolute left-4 top-4 z-30 flex items-center gap-2 border-2 border-foreground bg-background px-3 py-2 shadow-sm">
            <Image className="h-4 w-4" />
            <span className="font-mono text-sm font-bold">
              {photosWithLocation.length} photos mapped
            </span>
          </div>

          {/* Map style selector */}
          <div className="absolute right-4 top-4 z-30">
            <div className="relative">
              <Button
                onClick={() => setShowStyleMenu(!showStyleMenu)}
                variant="outline"
                size="sm"
                className="border-2 border-foreground gap-2"
              >
                <Layers className="h-4 w-4" />
                <span className="font-mono text-sm">{MAP_STYLES[mapStyle].name}</span>
              </Button>

              {showStyleMenu && (
                <div className="absolute right-0 mt-2 w-48 z-40 border-2 border-foreground bg-background shadow-lg">
                  {(Object.entries(MAP_STYLES) as [MapStyle, typeof MAP_STYLES[MapStyle]][]).map(([key, style]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setMapStyle(key);
                        setShowStyleMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 border-b border-border hover:bg-muted transition-colors font-mono text-sm ${
                        mapStyle === key ? 'bg-secondary font-bold' : ''
                      }`}
                    >
                      {style.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
