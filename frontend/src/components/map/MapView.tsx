import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapInstanceTracker } from './MapViewHelper';


import { defaultPinIcon, driverCarDivIcon } from './mapPins';

L.Marker.prototype.options.icon = defaultPinIcon;


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

const TILE_URLS = {
  light: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
};

export const MapView = React.memo(function MapView({
  center,
  zoom = 13,
  markers = [],
  routePositions = [],
  polylineColor = '#0F172A',
  setMap,
  children
}: MapViewProps) {
  return (
    <MapContainer 
      center={center} 
      zoom={zoom} 
      attributionControl={false}
      className="w-full h-full"
      style={{ minHeight: '300px' }}
    >
      <TileLayer url={TILE_URLS.light} />
      
      <MapReCenter center={center} zoom={zoom} />
      {setMap && <MapInstanceTracker setMap={setMap} />}

      {markers.map((marker, idx) => {
        const icon = marker.isDriver ? driverCarDivIcon() : defaultPinIcon;
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
