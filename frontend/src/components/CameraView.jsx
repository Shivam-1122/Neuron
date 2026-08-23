import React, { useRef, useEffect, useState } from 'react';
import { Camera, RefreshCw, Crosshair, Zap } from 'lucide-react';

export default function CameraView({ onCapture, isProcessing, trigger, isActive = false, buttonLabel }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);

    // Watch for external trigger
    useEffect(() => {
        if (trigger && trigger > 0 && isActive) {
            capture(3);
        }
    }, [trigger, isActive]);

    useEffect(() => {
        if (isActive) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isActive]);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            setError("Camera feed offline. Please grant visual sensor permissions in your browser.");
            console.error(err);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const capture = (retries = 3) => {
        if (!videoRef.current || !canvasRef.current) return;

        // Ensure video is playing and has data
        if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
            if (retries > 0) {
                console.warn(`Camera initializing... Retrying capture (${retries} left)`);
                setTimeout(() => capture(retries - 1), 300);
            } else {
                console.warn("Camera not ready for capture yet.");
            }
            return;
        }

        const context = canvasRef.current.getContext('2d');
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);

        canvasRef.current.toBlob((blob) => {
            if (blob) {
                onCapture(blob);
            } else {
                console.error("Failed to create blob from canvas");
            }
        }, 'image/jpeg', 0.9);
    };

    return (
        <div className="relative w-full max-w-[600px] mx-auto rounded-2xl overflow-hidden bg-[#060a12] border border-cyan-500/30 shadow-[0_0_30px_rgba(0,0,0,0.8)] tech-bracket">
            {error ? (
                <div className="p-8 text-center text-red-400 bg-red-950/30 font-mono text-xs border border-red-500/30">
                    <p className="font-bold mb-1">[SENSOR ERROR]</p>
                    <p>{error}</p>
                </div>
            ) : (
                <div className="relative w-full aspect-video bg-black overflow-hidden flex items-center justify-center">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />

                    {/* Cyber Target Overlays */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        {/* Center Target Crosshair */}
                        <div className="relative w-36 h-36 border border-cyan-400/40 rounded-2xl flex items-center justify-center animate-pulse">
                            <Crosshair size={32} className="text-cyan-400/60" />
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-cyan-950/90 text-cyan-300 text-[9px] font-mono px-2 py-0.5 rounded border border-cyan-500/40">
                                AI OPTICAL SCAN
                            </div>
                        </div>

                        {/* Animated Laser Scan Bar */}
                        <div className="scan-line" />
                    </div>

                    {/* Sensor Telemetry Pill */}
                    <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-cyan-500/30 font-mono text-[10px] text-cyan-400 flex items-center gap-1.5 pointer-events-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                        <span>LIVE OPTICAL FEED</span>
                    </div>
                </div>
            )}

            {/* Viewfinder Controls Footer */}
            <div className="p-3 bg-[#0a0f1d] border-t border-cyan-500/20 flex justify-center items-center">
                <button
                    type="button"
                    onClick={() => capture(3)}
                    disabled={isProcessing || !!error}
                    className="relative group overflow-hidden bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-mono text-xs font-bold tracking-wider px-6 py-2.5 rounded-full border border-cyan-400/50 shadow-[0_0_20px_rgba(0,240,255,0.4)] flex items-center gap-2.5 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                    {isProcessing ? (
                        <>
                            <RefreshCw className="animate-spin text-cyan-200" size={16} />
                            <span>ENCODING BIOMETRICS...</span>
                        </>
                    ) : (
                        <>
                            <div className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-400 flex items-center justify-center">
                                <Camera size={11} className="text-cyan-300" />
                            </div>
                            <span>{buttonLabel || "ACQUIRE OPTICAL SNAP"}</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
