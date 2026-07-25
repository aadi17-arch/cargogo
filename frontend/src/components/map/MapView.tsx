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

// Custom Animated Uber/Ola Style Driver Car Icon using L.divIcon
const driverCarDivIcon = () => L.divIcon({
  className: 'custom-driver-car-marker',
  html: `<div style="position: relative; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px;">
    <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(239, 68, 68, 0.25); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
    <div style="position: relative; width: 32px; height: 32px; background: #0F172A; border: 2px solid #EF4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F8FAFC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 11.2 2 11.6 2 12v4c0 .6.4 1 1 1h2"/>
        <circle cx="7" cy="17" r="2"/>
        <circle cx="17" cy="17" r="2"/>
      </svg>
    </div>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
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
        const icon = marker.isDriver ? driverCarDivIcon() : DefaultIcon;
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
