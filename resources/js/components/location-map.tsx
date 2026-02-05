import { useEffect } from 'react';
import { Circle, MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default marker icon in React-Leaflet
const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Props {
    latitude: number | null;
    longitude: number | null;
    radius?: number;
    onLocationSelect: (lat: number, lng: number) => void;
}

function LocationMarker({ position, onLocationSelect }: { position: LatLngExpression | null, onLocationSelect: (lat: number, lng: number) => void }) {
    const map = useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });

    useEffect(() => {
        if (position) {
            // Check if map center is far from new position to avoid jarring movements on small adjustments?
            // "flyTo" is nice but might be too much if we are just dragging?
            // But here we click to set.
            map.flyTo(position, map.getZoom());
        }
    }, [position, map]);

    return position ? <Marker position={position} /> : null;
}

export default function LocationMap({ latitude, longitude, radius = 100, onLocationSelect }: Props) {
    // Default center (Jakarta) if no location
    const defaultCenter: LatLngExpression = [-6.2088, 106.8456];
    const position: LatLngExpression | null = (latitude && longitude) ? [latitude, longitude] : null;

    return (
        <MapContainer
            center={position || defaultCenter}
            zoom={15}
            scrollWheelZoom={true}
            className="h-full w-full min-h-[300px] rounded-md z-0"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={position} onLocationSelect={onLocationSelect} />
            {position && radius > 0 && (
                <Circle center={position} radius={radius} pathOptions={{ fillColor: 'blue', fillOpacity: 0.2 }} />
            )}
        </MapContainer>
    );
}
