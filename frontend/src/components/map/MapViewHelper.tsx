import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';


export function ChangeMapView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}


export function MapInstanceTracker({ setMap }: { setMap: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    if (map) setMap(map);
  }, [map, setMap]);
  return null;
}
