"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Station } from "@/lib/types";

interface NetworkMapProps {
  stations: Station[];
  colorBy: "status" | "renewable";
}

export default function NetworkMap({ stations, colorBy }: NetworkMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.FeatureGroup | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!leafletMapRef.current) {
      leafletMapRef.current = L.map(mapRef.current);
      // Use OpenStreetMap free public tiles (no API key required)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(leafletMapRef.current);
      
      layerGroupRef.current = L.featureGroup().addTo(leafletMapRef.current);
    }

    return () => {
      // Map cleanup on unmount handled gracefully
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []); // Initialize only once

  useEffect(() => {
    if (!leafletMapRef.current || !layerGroupRef.current) return;

    // Clear old markers
    layerGroupRef.current.clearLayers();

    if (stations.length === 0) return;

    stations.forEach((st) => {
      if (!st.lat || !st.lng) return;

      let color = "#6B7280"; // Gray default

      if (colorBy === "status") {
        color = st.status === "available" ? "#22C55E" // Green
          : st.status === "busy" ? "#F59E0B" // Amber
            : st.status === "full" ? "#EF4444" // Red
              : "#6B7280";
      } else {
        color = st.renewable_pct >= 70 ? "#22C55E"
          : st.renewable_pct >= 40 ? "#F59E0B"
            : "#EF4444";
      }

      const markerHtml = `
        <div style="
          width: 14px;
          height: 14px;
          background-color: ${color};
          border-radius: 50%;
          border: 2px solid #FFFFFF;
          box-shadow: 0 0 6px rgba(0,0,0,0.5);
        "></div>
      `;

      const icon = L.divIcon({
        html: markerHtml,
        className: "",
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const popupHtml = `
        <div style="color: #1A1F1C; font-family: sans-serif;">
          <strong style="display:block; margin-bottom: 4px;">${st.name}</strong>
          <span style="font-size: 12px;">City: ${st.city}</span><br/>
          <span style="font-size: 12px;">Status: <strong style="text-transform: capitalize;">${st.status}</strong></span><br/>
          <span style="font-size: 12px;">Renewable: <strong>${st.renewable_pct}%</strong></span><br/>
          <span style="font-size: 12px;">Price: ₹${st.price_per_kwh}/kWh</span>
        </div>
      `;

      L.marker([st.lat, st.lng], { icon })
        .bindPopup(popupHtml)
        .addTo(layerGroupRef.current!);
    });

    // Auto-zoom map to fit all operator's markers perfectly
    const bounds = layerGroupRef.current.getBounds();
    if (bounds.isValid()) {
      leafletMapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }

  }, [stations, colorBy]);

  return (
    <div className="w-full h-full relative" style={{ borderRadius: "inherit", overflow: "hidden" }}>
      <div ref={mapRef} className="absolute inset-0" style={{ zIndex: 1 }} />
    </div>
  );
}
