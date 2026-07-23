"use client";
import { useCallback, useEffect, useRef } from "react";

type LatLngTuple = [number, number];

interface LeafletPosition {
  lat: number;
  lng: number;
}

interface LeafletMarker {
  setLatLng: (position: LatLngTuple) => void;
  getLatLng: () => LeafletPosition;
  on: (event: "dragend", handler: (event: { target: LeafletMarker }) => void) => void;
  addTo: (map: LeafletMap) => LeafletMarker;
}

interface LeafletMap {
  remove: () => void;
  invalidateSize: () => void;
  setView: (position: LatLngTuple, zoom: number) => void;
  on: (event: "click", handler: (event: { latlng: LeafletPosition }) => void) => void;
}

interface LeafletApi {
  map: (
    element: HTMLElement,
    options: { center: LatLngTuple; zoom: number; zoomControl: boolean },
  ) => LeafletMap;
  tileLayer: (
    url: string,
    options: { attribution: string; maxZoom: number },
  ) => { addTo: (map: LeafletMap) => void };
  marker: (
    position: LatLngTuple,
    options: { draggable: boolean },
  ) => LeafletMarker;
}

interface MapSelectorProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat: number;
  initialLng: number;
}

export default function MapSelector({
  onLocationSelect,
  initialLat,
  initialLng,
}: MapSelectorProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const initialPositionRef = useRef<LatLngTuple>([initialLat, initialLng]);
  const onLocationSelectRef = useRef(onLocationSelect);

  useEffect(() => {
    initialPositionRef.current = [initialLat, initialLng];
    onLocationSelectRef.current = onLocationSelect;
  }, [initialLat, initialLng, onLocationSelect]);

  const initializeMap = useCallback(() => {
    if (!mapRef.current) return;

    const leaflet = (window as Window & { L?: LeafletApi }).L;
    if (!leaflet) return;

    if (mapInstanceRef.current) {
      return;
    }

    try {
      if (mapRef.current) {
        mapRef.current.innerHTML = "";
        mapRef.current.className = "";
      }

      const initialPosition = initialPositionRef.current;
      const newMap = leaflet.map(mapRef.current, {
        center: initialPosition,
        zoom: 13,
        zoomControl: true,
      });

      leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(newMap);

      const newMarker = leaflet.marker(initialPosition, {
        draggable: true,
      }).addTo(newMap);

      newMarker.on("dragend", (event) => {
        const position = event.target.getLatLng();
        onLocationSelectRef.current(position.lat, position.lng);
      });

      newMap.on("click", (event) => {
        const { lat, lng } = event.latlng;
        newMarker.setLatLng([lat, lng]);
        onLocationSelectRef.current(lat, lng);
      });

      mapInstanceRef.current = newMap;
      markerRef.current = newMarker;

      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 100);
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (typeof window !== "undefined") {
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      const leaflet = (window as Window & { L?: LeafletApi }).L;
      if (leaflet) {
        if (isMounted) {
          initializeMap();
        }
      } else {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.async = true;

        script.onload = () => {
          if (isMounted) {
            setTimeout(() => {
              if (isMounted) {
                initializeMap();
              }
            }, 100);
          }
        };

        if (!document.querySelector('script[src*="leaflet.js"]')) {
          document.body.appendChild(script);
        }
      }
    }

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          markerRef.current = null;
        } catch (error) {
          console.error("Error cleaning up map:", error);
        }
      }
    };
  }, [initializeMap]);

  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      if (initialLat !== 31.5204 || initialLng !== 74.3587) {
        markerRef.current.setLatLng([initialLat, initialLng]);
        mapInstanceRef.current.setView([initialLat, initialLng], 13);
      }
    }
  }, [initialLat, initialLng]);

  return (
    <div
      style={{
        width: "100%",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        overflow: "hidden",
        background: "var(--surface)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "400px",
          background: "#eef2f5",
        }}
      />
    </div>
  );
}
