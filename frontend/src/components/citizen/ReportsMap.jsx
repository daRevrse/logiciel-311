import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Centre par défaut : Lomé, Togo
const DEFAULT_CENTER = [6.1256, 1.2325];

const STATUS_COLOR = {
  pending: '#f59e0b',
  in_progress: '#3b82f6',
  resolved: '#2BB673',
  rejected: '#94a3b8'
};

/**
 * Construit un marqueur coloré selon le statut du signalement.
 */
const buildIcon = (status) => {
  const color = STATUS_COLOR[status] || STATUS_COLOR.pending;
  return L.divIcon({
    className: 'reports-map-pin',
    html: `<span style="
      display:block;width:18px;height:18px;border-radius:9999px;
      background:${color};border:3px solid white;
      box-shadow:0 1px 4px rgba(15,23,42,.35);"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
};

/** Recentre la carte quand le centre calculé change. */
const Recenter = ({ center }) => {
  const map = useMap();
  React.useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

/**
 * Carte en lecture seule affichant un ensemble de signalements géolocalisés.
 * Réutilisée sur le Home (flux) et adaptable ailleurs.
 */
const ReportsMap = ({ reports = [], height = '100%', onSelect }) => {
  const navigate = useNavigate();

  const points = useMemo(
    () =>
      reports.filter(
        (r) => r.latitude != null && r.longitude != null && !Number.isNaN(parseFloat(r.latitude))
      ),
    [reports]
  );

  const center = useMemo(() => {
    if (points.length === 0) return DEFAULT_CENTER;
    const avgLat = points.reduce((s, r) => s + parseFloat(r.latitude), 0) / points.length;
    const avgLng = points.reduce((s, r) => s + parseFloat(r.longitude), 0) / points.length;
    return [avgLat, avgLng];
  }, [points]);

  const handleOpen = (id) => {
    if (onSelect) onSelect(id);
    else navigate(`/reports/${id}`);
  };

  return (
    <div style={{ height, width: '100%' }} className="relative">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <Recenter center={center} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((r) => (
          <Marker
            key={r.id}
            position={[parseFloat(r.latitude), parseFloat(r.longitude)]}
            icon={buildIcon(r.status)}
          >
            <Popup>
              <div className="min-w-[180px]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-turquoise mb-1">
                  {r.category?.name || 'Général'}
                </p>
                <p className="font-bold text-navy-deep text-sm leading-snug mb-1">{r.title}</p>
                {r.address && <p className="text-xs text-gray-500 mb-2">{r.address}</p>}
                <button
                  onClick={() => handleOpen(r.id)}
                  className="text-xs font-bold text-navy-deep underline underline-offset-2 hover:text-turquoise"
                >
                  Voir le détail
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default ReportsMap;
