import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapInstanceTracker } from './MapViewHelper';

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom driver icon
const driverIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

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

export default function MapView({
  center,
  zoom = 12,
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
}
