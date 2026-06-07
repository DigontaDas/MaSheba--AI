"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ConnectionRequest } from "@/utils/admin-types";

// Offline-compatible SVG Data URI for primary marker (Teal/Brand Accent)
const defaultPinSvg = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><path fill="%23006565" stroke="%23ffffff" stroke-width="1.5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`
)}`;

// Offline-compatible SVG Data URI for selected marker (Orange/Brand Secondary)
const activePinSvg = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><path fill="%239f402d" stroke="%23ffffff" stroke-width="1.5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`
)}`;

const defaultIcon = L.icon({
  iconUrl: defaultPinSvg,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});
L.Marker.prototype.options.icon = defaultIcon;

const activeIcon = L.icon({
  iconUrl: activePinSvg,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
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
