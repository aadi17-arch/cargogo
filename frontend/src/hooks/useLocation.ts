import { useState, useEffect } from "react";
interface LocationCoords {
  lat: number,
  lng: number
}
export const useLocation = () => {

  const [coords, setCoords] = useState<LocationCoords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const getCurrentLocation = (): Promise<LocationCoords> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const msg = 'GeoLocation is supported on this browser';
        setError(msg);
        reject(new Error(msg));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (x) => {
          const dx = {
            lat: x.coords.latitude,
            lng: x.coords.longitude,
          };
          setCoords(dx);
          setError(null);
          resolve(dx);
        },
        (e) => {
          setError(e.message);
          reject(e);
        }
      );
    });
  };
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (x) => {
        setCoords({ lat: x.coords.latitude, lng: x.coords.longitude });
        setError(null);
      },
      (e) => { setError(e.message); },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 5000,
      }
    );
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);
  return { coords, error, getCurrentLocation };
};
