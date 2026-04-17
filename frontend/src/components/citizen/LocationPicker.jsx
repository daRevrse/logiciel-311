import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { Navigation, MapPin, AlertTriangle } from 'lucide-react';
import { Button } from '../common';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix pour les icônes Leaflet avec Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

/**
 * Composant pour déplacer le marker au clic
 */
const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      if (e.originalEvent) {
        e.originalEvent.stopPropagation();
      }
      setPosition(e.latlng);
    },
  });

  return position ? <Marker position={position} /> : null;
};

/**
 * Composant pour recentrer la carte
 */
const ChangeView = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

/**
 * Sélecteur de localisation avec carte interactive
 */
const LocationPicker = ({ address, setAddress, latitude, setLatitude, longitude, setLongitude, error }) => {
  const [markerPosition, setMarkerPosition] = useState(null);
  const [mapCenter, setMapCenter] = useState([6.1256, 1.2325]); // Lomé, Togo
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');

  // Coordonnées par défaut (Lomé)
  const defaultPosition = [6.1256, 1.2325];

  useEffect(() => {
    // Si des coordonnées sont fournies, les utiliser
    if (latitude && longitude) {
      const pos = { lat: parseFloat(latitude), lng: parseFloat(longitude) };
      setMarkerPosition(pos);
      setMapCenter([pos.lat, pos.lng]);
    } else {
      // Sinon, tenter une géolocalisation automatique discrète
      handleGetCurrentLocation();
    }
  }, []);

  const handleMarkerMove = (latlng) => {
    setMarkerPosition(latlng);
    setLatitude(latlng.lat.toFixed(6));
    setLongitude(latlng.lng.toFixed(6));
    setLocationError('');

    // Géocodage inverse (optionnel - nécessite API Nominatim)
    reverseGeocode(latlng.lat, latlng.lng);
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      console.log(`[LocationPicker] Geocoding inverse pour ${lat}, ${lng}...`);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();

      if (data.display_name) {
        console.log(`[LocationPicker] Adresse trouvée : ${data.display_name}`);
        setAddress(data.display_name);
      } else {
        console.warn(`[LocationPicker] Aucune adresse trouvée pour ces coordonnées.`);
      }
    } catch (error) {
      console.error('[LocationPicker] Erreur géocodage inverse:', error);
    }
  };

  const handleGetCurrentLocation = () => {
    setIsLoadingLocation(true);
    setLocationError('');
    console.log('[LocationPicker] Tentative de récupération de la position...');

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: lat, longitude: lng } = position.coords;
          const pos = { lat, lng };
          
          console.log(`[LocationPicker] Position récupérée : ${lat}, ${lng}`);

          setMarkerPosition(pos);
          setMapCenter([lat, lng]);
          setLatitude(lat.toFixed(6));
          setLongitude(lng.toFixed(6));
          setIsLoadingLocation(false);

          // Géocodage inverse
          reverseGeocode(lat, lng);
        },
        (error) => {
          console.error('[LocationPicker] Erreur géolocalisation:', error);
          let msg = 'Impossible d\'obtenir votre position.';
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              msg = 'Accès à la position refusé par le navigateur.';
              break;
            case error.POSITION_UNAVAILABLE:
              msg = 'L\'information de position est indisponible.';
              break;
            case error.TIMEOUT:
              msg = 'La demande de localisation a expiré.';
              break;
          }
          
          setLocationError(`${msg} Veuillez cliquer sur la carte.`);
          setIsLoadingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      console.warn('[LocationPicker] Géolocalisation non supportée');
      setLocationError('La géolocalisation n\'est pas disponible sur cet appareil.');
      setIsLoadingLocation(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Adresse <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Ex: Avenue de la Paix, Lomé"
          className={`input-field ${error ? 'border-red-300' : ''}`}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Localisation sur la carte
        </label>

        <Button
          type="button"
          variant="outline"
          onClick={handleGetCurrentLocation}
          disabled={isLoadingLocation}
          className="mb-3 w-full sm:w-auto"
        >
          <Navigation className="h-4 w-4 mr-2" />
          {isLoadingLocation ? 'Localisation...' : 'Utiliser ma position actuelle'}
        </Button>

        {locationError && (
          <div className="mb-3 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded text-sm">
            {locationError}
          </div>
        )}

        <div className="rounded-lg overflow-hidden border border-gray-300 h-96 relative">
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <ChangeView center={mapCenter} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={markerPosition} setPosition={handleMarkerMove} />
          </MapContainer>
        </div>

        <p className="mt-2 text-sm text-gray-500 flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          Cliquez sur la carte pour placer le marqueur à l'emplacement exact du problème
        </p>

        {markerPosition && (
          <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded p-2">
            <span className="font-medium">Coordonnées:</span> {latitude}, {longitude}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationPicker;
