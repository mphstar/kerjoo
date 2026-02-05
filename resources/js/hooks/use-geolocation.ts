import { useState, useCallback, useEffect, useRef } from 'react';

export interface GeolocationState {
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
    error: string | null;
    permissionState: 'granted' | 'denied' | 'prompt' | 'unavailable';
    isLoading: boolean;
}

export interface UseGeolocationReturn extends GeolocationState {
    requestPermission: () => Promise<void>;
    getCurrentPosition: () => Promise<GeolocationCoordinates | null>;
    calculateDistance: (targetLat: number, targetLng: number, fromLat?: number, fromLng?: number) => number | null;
    isWithinRadius: (targetLat: number, targetLng: number, radius: number) => boolean | null;
    startWatching: () => void;
    stopWatching: () => void;
    isWatching: boolean;
}

const initialState: GeolocationState = {
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    permissionState: 'prompt',
    isLoading: false,
};

/**
 * Calculate distance between two coordinates using Haversine formula.
 * Returns distance in meters.
 */
function haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371000; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * Custom hook for geolocation with location validation support.
 */
export function useGeolocation(): UseGeolocationReturn {
    const [state, setState] = useState<GeolocationState>(initialState);
    const [isWatching, setIsWatching] = useState(false);
    const watchIdRef = useRef<number | null>(null);

    // Check geolocation support and permission status on mount
    useEffect(() => {
        if (!navigator.geolocation) {
            setState((prev) => ({
                ...prev,
                permissionState: 'unavailable',
                error: 'Geolocation tidak didukung oleh browser ini.',
            }));
            return;
        }

        // Check permission status if available
        if (navigator.permissions) {
            navigator.permissions
                .query({ name: 'geolocation' })
                .then((result) => {
                    setState((prev) => ({
                        ...prev,
                        permissionState: result.state as GeolocationState['permissionState'],
                    }));

                    // Listen for permission changes
                    result.onchange = () => {
                        setState((prev) => ({
                            ...prev,
                            permissionState: result.state as GeolocationState['permissionState'],
                        }));
                    };
                })
                .catch(() => {
                    // Permission API not fully supported
                });
        }

        // Cleanup watcher on unmount
        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);

    /**
     * Request geolocation permission by trying to get position
     */
    const requestPermission = useCallback(async (): Promise<void> => {
        if (!navigator.geolocation) {
            setState((prev) => ({
                ...prev,
                error: 'Geolocation tidak didukung oleh browser ini.',
                permissionState: 'unavailable',
            }));
            return;
        }

        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        try {
            await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                });
            });

            setState((prev) => ({
                ...prev,
                permissionState: 'granted',
                isLoading: false,
            }));
        } catch (error) {
            const geoError = error as GeolocationPositionError;
            let errorMessage = 'Gagal mendapatkan lokasi.';
            let permission: GeolocationState['permissionState'] = 'prompt';

            switch (geoError.code) {
                case GeolocationPositionError.PERMISSION_DENIED:
                    errorMessage = 'Akses lokasi ditolak. Silakan izinkan akses lokasi di pengaturan browser.';
                    permission = 'denied';
                    break;
                case GeolocationPositionError.POSITION_UNAVAILABLE:
                    errorMessage = 'Informasi lokasi tidak tersedia.';
                    break;
                case GeolocationPositionError.TIMEOUT:
                    errorMessage = 'Waktu permintaan lokasi habis. Silakan coba lagi.';
                    break;
            }

            setState((prev) => ({
                ...prev,
                error: errorMessage,
                permissionState: permission,
                isLoading: false,
            }));
        }
    }, []);

    /**
     * Get current position once with fallback to low accuracy
     * Throws error message string if retrieval fails.
     * Includes retry logic for better reliability.
     */
    const getCurrentPosition = useCallback(async (): Promise<GeolocationCoordinates> => {
        if (!navigator.geolocation) {
            const msg = 'Geolocation tidak didukung oleh browser ini.';
            setState((prev) => ({ ...prev, error: msg }));
            throw msg;
        }

        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        const getPositionPromised = (options: PositionOptions): Promise<GeolocationPosition> => {
            return new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, options);
            });
        };

        // Retry logic - try up to 3 times
        const maxRetries = 3;
        let lastError: GeolocationPositionError | null = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                let position: GeolocationPosition;
                try {
                    // Try High Accuracy first (GPS) - 15s timeout, allow 30s old cache
                    position = await getPositionPromised({
                        enableHighAccuracy: true,
                        timeout: 15000, // 15s for GPS lock
                        maximumAge: 30000, // Accept 30s old cached position
                    });
                } catch (error) {
                    const geoError = error as GeolocationPositionError;
                    // Only fallback on Timeout or Position Unavailable
                    if (geoError.code == GeolocationPositionError.TIMEOUT ||
                        geoError.code == GeolocationPositionError.POSITION_UNAVAILABLE) {
                        console.warn(`Attempt ${attempt}: High accuracy location failed, falling back to low accuracy.`);
                        // Fallback to Low Accuracy (Wi-Fi/Cellular) - 10s timeout, allow 60s old cache
                        position = await getPositionPromised({
                            enableHighAccuracy: false,
                            timeout: 10000, // 10s for network location
                            maximumAge: 60000, // Accept 60s old cached position
                        });
                    } else {
                        throw error;
                    }
                }

                setState((prev) => ({
                    ...prev,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    permissionState: 'granted',
                    isLoading: false,
                    error: null,
                }));

                return position.coords;
            } catch (error) {
                lastError = error as GeolocationPositionError;

                // Only retry on timeout, not on permission denied
                if (lastError.code == GeolocationPositionError.PERMISSION_DENIED) {
                    break; // No point retrying if permission denied
                }

                if (attempt < maxRetries) {
                    console.warn(`Geolocation attempt ${attempt} failed, retrying... (${maxRetries - attempt} attempts left)`);
                    // Small delay before retry
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
        }

        // All retries failed
        let errorMessage = 'Gagal mendapatkan lokasi setelah beberapa percobaan.';

        if (lastError) {
            switch (lastError.code) {
                case GeolocationPositionError.PERMISSION_DENIED:
                    errorMessage = 'Akses lokasi ditolak. Silakan izinkan akses lokasi di pengaturan browser.';
                    setState((prev) => ({ ...prev, permissionState: 'denied' }));
                    break;
                case GeolocationPositionError.POSITION_UNAVAILABLE:
                    errorMessage = 'Informasi lokasi tidak tersedia. Pastikan GPS/lokasi aktif.';
                    break;
                case GeolocationPositionError.TIMEOUT:
                    errorMessage = 'Lokasi tidak dapat ditemukan. Pastikan Anda berada di area dengan sinyal GPS yang baik, atau coba pindah ke area terbuka.';
                    break;
            }
        }

        setState((prev) => ({
            ...prev,
            error: errorMessage,
            isLoading: false,
        }));

        throw errorMessage;
    }, []);

    /**
     * Start watching position for real-time updates
     */
    const startWatching = useCallback(() => {
        if (!navigator.geolocation) {
            return;
        }

        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
        }

        setIsWatching(true);
        setState((prev) => ({ ...prev, isLoading: true }));

        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                setState((prev) => ({
                    ...prev,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    permissionState: 'granted',
                    isLoading: false,
                    error: null,
                }));
            },
            (error) => {
                let errorMessage = 'Gagal melacak lokasi.';
                switch (error.code) {
                    case GeolocationPositionError.PERMISSION_DENIED:
                        errorMessage = 'Akses lokasi ditolak.';
                        break;
                    case GeolocationPositionError.POSITION_UNAVAILABLE:
                        errorMessage = 'Lokasi tidak tersedia.';
                        break;
                    case GeolocationPositionError.TIMEOUT:
                        errorMessage = 'Waktu pelacakan habis.';
                        break;
                }
                setState((prev) => ({
                    ...prev,
                    error: errorMessage,
                    isLoading: false,
                }));
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 5000,
            }
        );
    }, []);

    /**
     * Stop watching position
     */
    const stopWatching = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setIsWatching(false);
    }, []);

    /**
     * Calculate distance from current position (or provided position) to target coordinates.
     * Returns distance in meters.
     */
    const calculateDistance = useCallback(
        (targetLat: number, targetLng: number, fromLat?: number, fromLng?: number): number | null => {
            const lat = fromLat ?? state.latitude;
            const lng = fromLng ?? state.longitude;

            if (lat === null || lng === null) {
                return null;
            }
            return haversineDistance(lat, lng, targetLat, targetLng);
        },
        [state.latitude, state.longitude]
    );

    /**
     * Check if current position is within specified radius of target.
     * Returns null if position is not available.
     */
    const isWithinRadius = useCallback(
        (targetLat: number, targetLng: number, radius: number): boolean | null => {
            const distance = calculateDistance(targetLat, targetLng);
            if (distance === null) {
                return null;
            }
            return distance <= radius;
        },
        [calculateDistance]
    );

    return {
        ...state,
        requestPermission,
        getCurrentPosition,
        calculateDistance,
        isWithinRadius,
        startWatching,
        stopWatching,
        isWatching,
    };
}

export default useGeolocation;
