'use client';

// Ініціалізація Leaflet-карти з маркером (T-4405). Динамічний import —
// компонент рендериться і на сервері (Next), Leaflet чіпає window.
import { useEffect, useRef } from 'react';

export interface LeafletPoint {
  lat: number;
  lng: number;
}

export function useLeafletMap(
  lat: number,
  lng: number,
  onPick: (point: LeafletPoint) => void
): React.RefObject<HTMLDivElement | null> {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const markerRef = useRef<import('leaflet').Marker | null>(null);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    void import('leaflet').then(({ default: L }) => {
      if (cancelled || !containerRef.current) return;
      const map = L.map(containerRef.current).setView([lat, lng], 16);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);
      const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
      map.on('click', (event: { latlng: LeafletPoint }) =>
        pickRef.current({ lat: event.latlng.lat, lng: event.latlng.lng })
      );
      marker.on('dragend', () => {
        const point = marker.getLatLng();
        pickRef.current({ lat: point.lat, lng: point.lng });
      });
      mapRef.current = map;
      markerRef.current = marker;
      cleanup = () => {
        map.remove();
        mapRef.current = null;
        markerRef.current = null;
      };
    });
    return () => {
      cancelled = true;
      cleanup?.();
    };
    // Карта створюється один раз; зовнішні координати синхронізуються нижче.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    const current = marker.getLatLng();
    if (Math.abs(current.lat - lat) < 1e-7 && Math.abs(current.lng - lng) < 1e-7) return;
    marker.setLatLng([lat, lng]);
    map.panTo([lat, lng]);
  }, [lat, lng]);

  return containerRef;
}
