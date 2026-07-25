import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapInstanceTracker } from './MapViewHelper';

// Custom SVG Pickup Pin
const pickupPinSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 24 24" fill="%234F46E5" stroke="%23ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="white"/></svg>`;

const DefaultIcon = L.icon({
  iconUrl: pickupPinSvg,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -40],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom SVG Driver Truck Icon (Red/Emerald)
const driverTruckSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="%23EF4444" stroke="%23ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5" fill="%231E293B"/><circle cx="18.5" cy="18.5" r="2.5" fill="%231E293B"/></svg>`;

const driverIcon = L.icon({
  iconUrl: driverTruckSvg,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -34],
});

// Helper component to pan map smoothly whenever center updates
function MapReCenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { animate: true, duration: 1 });
  }, [center[0], center[1], zoom, map]);
  return null;
}

export interface MapMarker {
  lat: number;
  lng: number;
  popupText?: string;
  isDriver?: boolean;
  draggable?: boolean;
  onDragEnd?: (lat: number, lng: number) => void;
  markerRef?: React.RefObject<any>;
}

export interface MapViewProps {
  center: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  routePositions?: [number, number][];
  polylineColor?: string;
  setMap?: (map: L.Map | null) => void;
  children?: React.ReactNode;
}

export const MapView = React.memo(function MapView({
  center,
  zoom = 13,
  markers = [],
  routePositions = [],
  polylineColor = 'blue',
  setMap,
  children
}: MapViewProps) {
  return (
    <MapContainer 
      center={center} 
      zoom={zoom} 
      className="w-full h-full"
      style={{ minHeight: '300px' }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      
      <MapReCenter center={center} zoom={zoom} />
      {setMap && <MapInstanceTracker setMap={setMap} />}

      {markers.map((marker, idx) => {
        const icon = marker.isDriver ? driverIcon : DefaultIcon;
        const position: [number, number] = [marker.lat, marker.lng];

        const handlers = marker.draggable && marker.onDragEnd ? {
          dragend(e: any) {
            const m = e.target;
            if (m) {
              const { lat, lng } = m.getLatLng();
              marker.onDragEnd!(Number(lat.toFixed(6)), Number(lng.toFixed(6)));
            }
          }
        } : undefined;

        return (
          <Marker 
            key={idx} 
            position={position} 
            icon={icon} 
            draggable={marker.draggable} 
            eventHandlers={handlers}
            ref={marker.markerRef}
          >
            {marker.popupText && <Popup>{marker.popupText}</Popup>}
          </Marker>
        );
      })}

      {routePositions.length > 0 && (
        <Polyline positions={routePositions} color={polylineColor} />
      )}

      {children}
    </MapContainer>
  );
});

export default MapView;
