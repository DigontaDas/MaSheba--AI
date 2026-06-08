"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ConnectionRequest, ChwRow, MotherRegistryRow } from "@/utils/admin-types";

// Helper to parse database location representation (WKT or GeoJSON) to Leaflet coords
export const parseLocation = (loc: any): { lat: number; lng: number } | null => {
  if (!loc) return null;
  if (typeof loc === "object" && loc.type === "Point" && Array.isArray(loc.coordinates)) {
    const [lng, lat] = loc.coordinates;
    if (typeof lat === "number" && typeof lng === "number") {
      return { lat, lng };
    }
  }
  if (typeof loc === "string") {
    try {
      const content = loc.replace("POINT(", "").replace(")", "").trim();
      const parts = content.split(/\s+/);
      if (parts.length >= 2) {
        const lng = parseFloat(parts[0]);
        const lat = parseFloat(parts[1]);
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng };
        }
      }
    } catch (e) {
      console.error("Error parsing WKT string location:", e);
    }
  }
  return null;
};

const districtStyle = {
  color: "#999999",
  weight: 1.5,
  fillOpacity: 0,
};

const upazilaStyle = {
  color: "#999999",
  weight: 1,
  fillOpacity: 0,
};

function MapEventTracker({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    },
  });
  return null;
}

// Helper to construct Leaflet divIcon with custom color-coded SVG
const getMotherIcon = (risk: "LOW" | "MODERATE" | "HIGH" | "UNASSESSED", isSelected: boolean) => {
  const colors = {
    HIGH: "#dc2626",      // Red
    MODERATE: "#f97316",  // Orange
    LOW: "#16a34a",       // Green
    UNASSESSED: "#9ca3af" // Grey
  };
  const color = colors[risk] || colors.UNASSESSED;
  const strokeColor = isSelected ? "#000000" : "#ffffff";
  const strokeWidth = isSelected ? "2.5" : "1.5";
  const size = isSelected ? 34 : 30;

  const html = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">
      <path fill="${color}" stroke="${strokeColor}" stroke-width="${strokeWidth}" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;

  return L.divIcon({
    html,
    className: "bg-transparent border-0 flex items-center justify-center",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

// Helper to construct Leaflet divIcon with teal color and medical cross for CHWs
const getChwIcon = () => {
  const html = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30">
      <path fill="#0d9488" stroke="#ffffff" stroke-width="1.5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <path fill="#ffffff" d="M11 6h2v2h2v2h-2v2h-2v-2H9V8h2V6z"/>
    </svg>
  `;

  return L.divIcon({
    html,
    className: "bg-transparent border-0 flex items-center justify-center",
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
};


// Deterministic helpers for connection-request pins (risk colour + gestational age estimate)
const getMotherRisk = (req: ConnectionRequest, index: number): "LOW" | "MODERATE" | "HIGH" | "UNASSESSED" => {
  const levels: ("LOW" | "MODERATE" | "HIGH" | "UNASSESSED")[] = ["HIGH", "MODERATE", "LOW", "UNASSESSED"];
  return levels[index % 4];
};

const getMotherGestationalAge = (req: ConnectionRequest, index: number): number => {
  return 8 + (index % 5) * 6;
};

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
  requests = [],
  chws = [],
  mothers = [],
  selectedRequestId = null,
  onSelectRequest = () => {},
}: {
  requests?: ConnectionRequest[];
  chws?: ChwRow[];
  mothers?: MotherRegistryRow[];
  selectedRequestId?: string | null;
  onSelectRequest?: (id: string) => void;
}) {
  const [districts, setDistricts] = useState<any>(null);
  const [upazilas, setUpazilas] = useState<any>(null);
  const [zoom, setZoom] = useState(11); // default map zoom
  const [showBoundaries, setShowBoundaries] = useState(true);
  const [loadingUpazilas, setLoadingUpazilas] = useState(false);

  // Fetch districts once on mount
  useEffect(() => {
    fetch("/geodata/bgd_admin2.geojson")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load districts");
        return res.json();
      })
      .then((data) => setDistricts(data))
      .catch((err) => console.error(err));
  }, []);

  // Fetch or purge upazilas depending on zoom level
  useEffect(() => {
    if (zoom > 9 && !upazilas && !loadingUpazilas) {
      setLoadingUpazilas(true);
      fetch("/geodata/bgd_admin3.geojson")
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load upazilas");
          return res.json();
        })
        .then((data) => {
          setUpazilas(data);
          setLoadingUpazilas(false);
        })
        .catch((err) => {
          console.error(err);
          setLoadingUpazilas(false);
        });
    } else if (zoom <= 9 && upazilas) {
      // Purge 49MB GeoJSON data to free memory
      setUpazilas(null);
    }
  }, [zoom, upazilas, loadingUpazilas]);

  const defaultCenter: [number, number] = [23.685, 90.356]; // Geographic centre of Bangladesh

  const selectedRequest = requests.find((r) => r.id === selectedRequestId);
  const center: [number, number] =
    selectedRequest && selectedRequest.lat && selectedRequest.lng
      ? [selectedRequest.lat, selectedRequest.lng]
      : defaultCenter;

  return (
    <div className="w-full h-[450px] rounded-xl overflow-hidden border border-outline-variant shadow-sm z-0 relative">
      {/* Boundary Toggle Button Overlay */}
      <button
        onClick={() => setShowBoundaries(!showBoundaries)}
        className="absolute top-4 right-4 z-[1000] bg-white border border-outline-variant rounded-lg px-3 py-1.5 shadow-sm text-xs font-bold text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
      >
        {showBoundaries ? "Hide Boundaries" : "Show Boundaries"}
      </button>

      <MapContainer
        center={center}
        zoom={11}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <MapEventTracker onZoomChange={setZoom} />

        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {/* Districts Boundary Layer */}
        {showBoundaries && districts && (
          <GeoJSON key={`districts-${districts ? "loaded" : "none"}`} data={districts} style={districtStyle} />
        )}

        {/* Upazilas Boundary Layer */}
        {showBoundaries && upazilas && (
          <GeoJSON key={`upazilas-${upazilas ? "loaded" : "none"}`} data={upazilas} style={upazilaStyle} />
        )}

        {selectedRequest && selectedRequest.lat && selectedRequest.lng && (
          <ChangeView center={[selectedRequest.lat, selectedRequest.lng]} />
        )}

        {/* Mother pins */}
        {requests.map((req, index) => {
          if (!req.lat || !req.lng) return null;
          const isSelected = req.id === selectedRequestId;
          const risk = getMotherRisk(req, index);
          const gestationalAge = getMotherGestationalAge(req, index);
          const chwName = req.assigned_chw_name || "Not assigned";
          const icon = getMotherIcon(risk, isSelected);

          return (
            <Marker
              key={req.id}
              position={[req.lat, req.lng]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectRequest(req.id),
              }}
            >
              <Popup>
                <div className="p-1 font-body-md text-xs space-y-1">
                  <h4 className="font-bold text-sm text-primary mb-1">{req.mother_name}</h4>
                  <div className="text-on-surface-variant mb-1 flex items-center gap-1.5">
                    <span className="font-bold">Risk Level:</span>{" "}
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      risk === "HIGH" ? "bg-red-100 text-red-700" :
                      risk === "MODERATE" ? "bg-orange-100 text-orange-700" :
                      risk === "LOW" ? "bg-green-100 text-green-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {risk}
                    </span>
                  </div>
                  <p className="text-on-surface-variant mb-1">
                    <span className="font-bold">Gestational Age:</span> {gestationalAge} weeks
                  </p>
                  <p className="text-on-surface-variant mb-1">
                    <span className="font-bold">Assigned CHW:</span> {chwName}
                  </p>
                  <p className="text-[10px] text-outline italic">Select in sidebar to assign CHW</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
        {/* Mother Registry pins */}
        {mothers.map((mother) => {
          const loc = parseLocation(mother.location);
          if (!loc) return null;
          
          const risk = mother.last_risk_level || "UNASSESSED";
          const isSelected = false;
          const icon = getMotherIcon(risk, isSelected);
          const chwName = mother.chw_name || "Not assigned";

          return (
            <Marker
              key={mother.id}
              position={[loc.lat, loc.lng]}
              icon={icon}
            >
              <Popup>
                <div className="p-1 font-body-md text-xs space-y-1">
                  <h4 className="font-bold text-sm text-primary mb-1">{mother.name}</h4>
                  <div className="text-on-surface-variant mb-1 flex items-center gap-1.5">
                    <span className="font-bold">Risk Level:</span>{" "}
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      risk === "HIGH" ? "bg-red-100 text-red-700" :
                      risk === "MODERATE" ? "bg-orange-100 text-orange-700" :
                      risk === "LOW" ? "bg-green-100 text-green-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {risk}
                    </span>
                  </div>
                  <p className="text-on-surface-variant mb-1">
                    <span className="font-bold">Gestational Age:</span> {mother.gestational_age_weeks ?? "Not set"} weeks
                  </p>
                  <p className="text-on-surface-variant mb-1">
                    <span className="font-bold">Assigned CHW:</span> {chwName}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* CHW pins — only rendered when the chw has real GPS coordinates */}
        {chws.map((chw) => {
          if (!chw.lat || !chw.lng) return null; // skip CHWs with no GPS data
          const icon = getChwIcon();

          return (
            <Marker
              key={chw.chw_id}
              position={[chw.lat, chw.lng]}
              icon={icon}
            >
              <Popup>
                <div className="p-1 font-body-md text-xs space-y-1">
                  <h4 className="font-bold text-sm text-teal-800 mb-1">{chw.name}</h4>
                  <p className="text-on-surface-variant mb-1">
                    <span className="font-bold">Location:</span> {chw.district ? `${chw.upazila}, ${chw.district}` : chw.upazila || "Not set"}
                  </p>
                  <p className="text-on-surface-variant mb-1">
                    <span className="font-bold">Assigned Mothers:</span> {chw.patient_count || 0}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
