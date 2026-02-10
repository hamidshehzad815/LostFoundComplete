"use client";
import { useEffect, useRef, useState } from "react";

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
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (typeof window !== "undefined") {
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      const L = (window as any).L;
      if (L) {
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
  }, []);

  const initializeMap = () => {
    if (!mapRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    if (mapInstanceRef.current) {
      return;
    }

    try {
      if (mapRef.current) {
        mapRef.current.innerHTML = "";
        mapRef.current.className = "";
      }

      const newMap = L.map(mapRef.current, {
        center: [initialLat, initialLng],
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(newMap);

      const newMarker = L.marker([initialLat, initialLng], {
        draggable: true,
      }).addTo(newMap);

      newMarker.on("dragend", function (e: any) {
        const position = e.target.getLatLng();
        onLocationSelect(position.lat, position.lng);
      });

      newMap.on("click", function (e: any) {
        const { lat, lng } = e.latlng;
        newMarker.setLatLng([lat, lng]);
        onLocationSelect(lat, lng);
      });

      mapInstanceRef.current = newMap;
      markerRef.current = newMarker;
      setIsReady(true);

      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 100);
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  };

  useEffect(() => {
    if (isReady && mapInstanceRef.current && markerRef.current) {
      if (initialLat !== 31.5204 || initialLng !== 74.3587) {
        markerRef.current.setLatLng([initialLat, initialLng]);
        mapInstanceRef.current.setView([initialLat, initialLng], 13);
      }
    }
  }, [initialLat, initialLng, isReady]);

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: "400px",
        borderRadius: "12px",
        overflow: "hidden",
        background: "#f8fafc",
      }}
    />
  );
}
