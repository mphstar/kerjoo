import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, RefreshCw, RotateCcw, X, AlertTriangle } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import Webcam from 'react-webcam';

interface CameraCaptureProps {
    onCapture: (imageFile: File) => void;
    label?: string;
    disabled?: boolean;
}

/**
 * Converts a base64 data URL to a File object
 */
function dataURLtoFile(dataUrl: string, filename: string): File {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}

export function CameraCapture({ onCapture, label = 'Ambil Foto', disabled = false }: CameraCaptureProps) {
    const webcamRef = useRef<Webcam>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const videoConstraints = {
        width: 1280,
        height: 720,
        facingMode: facingMode,
    };

    const handleUserMedia = useCallback(() => {
        setHasPermission(true);
        setErrorMessage(null);
    }, []);

    const handleUserMediaError = useCallback((error: string | DOMException) => {
        setHasPermission(false);
        if (error instanceof DOMException) {
            if (error.name === 'NotAllowedError') {
                setErrorMessage('Akses kamera ditolak. Harap izinkan akses kamera di pengaturan browser Anda untuk melanjutkan.');
            } else if (error.name === 'NotFoundError') {
                setErrorMessage('Kamera tidak ditemukan pada perangkat Anda.');
            } else if (error.name === 'NotReadableError') {
                setErrorMessage('Kamera sedang digunakan aplikasi lain. Tutup aplikasi yang menggunakan kamera dan coba lagi.');
            } else {
                setErrorMessage(`Gagal mengakses kamera: ${error.message}`);
            }
        } else {
            setErrorMessage('Gagal mengakses kamera. Pastikan perangkat memiliki kamera.');
        }
    }, []);

    const capture = useCallback(() => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            if (imageSrc) {
                setCapturedImage(imageSrc);
            }
        }
    }, []);

    const retake = useCallback(() => {
        setCapturedImage(null);
    }, []);

    const confirmCapture = useCallback(() => {
        if (capturedImage) {
            const filename = `foto_${Date.now()}.jpg`;
            const file = dataURLtoFile(capturedImage, filename);
            onCapture(file);
            setIsOpen(false);
            setCapturedImage(null);
        }
    }, [capturedImage, onCapture]);

    const switchCamera = useCallback(() => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    }, []);

    const openCamera = useCallback(() => {
        setIsOpen(true);
        setCapturedImage(null);
        setHasPermission(null);
        setErrorMessage(null);
    }, []);

    const closeDialog = useCallback(() => {
        setIsOpen(false);
        setCapturedImage(null);
    }, []);

    return (
        <>
            <Button
                type="button"
                variant="outline"
                onClick={openCamera}
                disabled={disabled}
                className="w-full gap-2"
            >
                <Camera className="h-4 w-4" />
                {label}
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-lg p-0 overflow-hidden">
                    <DialogHeader className="p-4 pb-0">
                        <DialogTitle className="flex items-center justify-between">
                            <span>{label}</span>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="relative bg-black aspect-[4/3] w-full">
                        {/* Permission Error State */}
                        {hasPermission === false && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white p-6 text-center">
                                <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
                                <p className="text-sm mb-4">{errorMessage}</p>
                                <p className="text-xs text-gray-400 mb-4">
                                    Tips: Buka pengaturan browser → Izin Situs → Kamera → Izinkan
                                </p>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="bg-white text-black hover:bg-gray-200"
                                    onClick={() => {
                                        setHasPermission(null);
                                        setErrorMessage(null);
                                    }}
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Coba Lagi
                                </Button>
                            </div>
                        )}

                        {/* Captured Image Preview */}
                        {capturedImage && (
                            <img
                                src={capturedImage}
                                alt="Captured"
                                className="w-full h-full object-cover"
                            />
                        )}

                        {/* Live Webcam Feed */}
                        {!capturedImage && hasPermission !== false && (
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                videoConstraints={videoConstraints}
                                onUserMedia={handleUserMedia}
                                onUserMediaError={handleUserMediaError}
                                className="w-full h-full object-cover"
                                mirrored={facingMode === 'user'}
                            />
                        )}

                        {/* Camera Switch Button - Only show when camera is active */}
                        {!capturedImage && hasPermission === true && (
                            <Button
                                type="button"
                                variant="secondary"
                                size="icon"
                                onClick={switchCamera}
                                className="absolute top-3 right-3 rounded-full bg-black/50 text-white hover:bg-black/70"
                            >
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="p-4 flex gap-3">
                        {!capturedImage ? (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={closeDialog}
                                    className="flex-1"
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Batal
                                </Button>
                                <Button
                                    onClick={capture}
                                    className="flex-1"
                                    disabled={hasPermission !== true}
                                >
                                    <Camera className="h-4 w-4 mr-2" />
                                    Ambil Foto
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={retake}
                                    className="flex-1"
                                >
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Ulangi
                                </Button>
                                <Button
                                    onClick={confirmCapture}
                                    className="flex-1"
                                >
                                    Gunakan Foto
                                </Button>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
