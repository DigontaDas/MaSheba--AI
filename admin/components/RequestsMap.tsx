"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ConnectionRequest } from "@/utils/admin-types";

// Fix for Next.js image loading inside Leaflet (bundled asset resolves as local URL)
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

// Custom active/selected marker icon (orange pin)
const activeIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

/**
 * Custom view control hook to center/zoom map programmatically when a request is selected.
 */
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
}

export function RequestsMap({
  requests,
  selectedRequestId,
  onSelectRequest,
}: {
  requests: ConnectionRequest[];
  selectedRequestId: string | null;
  onSelectRequest: (id: string) => void;
}) {
  const defaultCenter: [number, number] = [23.9097, 90.7153]; // Narsingdi District Center

  const selectedRequest = requests.find((r) => r.id === selectedRequestId);
  const center: [number, number] =
    selectedRequest && selectedRequest.lat && selectedRequest.lng
      ? [selectedRequest.lat, selectedRequest.lng]
      : defaultCenter;

  return (
    <div className="w-full h-[450px] rounded-xl overflow-hidden border border-outline-variant shadow-sm z-0 relative">
      <MapContainer
        center={center}
        zoom={11}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
        />

        {selectedRequest && selectedRequest.lat && selectedRequest.lng && (
          <ChangeView center={[selectedRequest.lat, selectedRequest.lng]} />
        )}

        {requests.map((req) => {
          if (!req.lat || !req.lng) return null;
          const isSelected = req.id === selectedRequestId;
          return (
            <Marker
              key={req.id}
              position={[req.lat, req.lng]}
              icon={isSelected ? activeIcon : defaultIcon}
              eventHandlers={{
                click: () => onSelectRequest(req.id),
              }}
            >
              <Popup>
                <div className="p-1 font-body-md text-xs">
                  <h4 className="font-bold text-sm text-primary mb-1">{req.mother_name}</h4>
                  <p className="text-on-surface-variant mb-1 font-semibold">
                    Proximity Point: [{req.lat.toFixed(4)}, {req.lng.toFixed(4)}]
                  </p>
                  <p className="text-on-surface-variant mb-1">
                    Waiting since: {new Date(req.created_at).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-outline italic">Select in sidebar to assign CHW</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
