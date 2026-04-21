import React, { useState, useRef, useEffect } from 'react';
import { Transaction } from '../types';
import { parseTransactionFromReceipt } from '../services/geminiService';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { UploadIcon } from './icons/UploadIcon';

interface ReceiptScannerProps {
  onClose: () => void;
  onReceiptParsed: (data: Omit<Transaction, 'id'>, imageDataUrl: string) => void;
  initialMode: 'camera' | 'upload';
}

type View = 'camera' | 'upload' | 'loading' | 'error';

const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onClose, onReceiptParsed, initialMode }) => {
    const [view, setView] = useState<View>(initialMode);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const startCamera = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'environment' } 
                });
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                setError("Could not access camera. Please ensure you have given permission.");
                setView('error');
            }
        };

        if (view === 'camera') {
            startCamera();
        }

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [view]);

    const processImage = async (dataUrl: string) => {
        setView('loading');
        try {
            const base64Data = dataUrl.split(',')[1];
            const parsedData = await parseTransactionFromReceipt(base64Data);
            onReceiptParsed(parsedData as Omit<Transaction, 'id'>, dataUrl);
        } catch (err: any) {
            setError(err.message || 'Failed to parse receipt.');
            setView('error');
        }
    };

    const handleCapture = async () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg');
                setImageSrc(dataUrl);
                
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                    setStream(null);
                }
                
                await processImage(dataUrl);
            }
        }
    };

    const handleFileSelect = (file: File | null) => {
        if (file && file.type.startsWith('image/')) {
            setError(null);
            const reader = new FileReader();
            reader.onload = async (e) => {
                const dataUrl = e.target?.result as string;
                if (dataUrl) {
                    setImageSrc(dataUrl);
                    await processImage(dataUrl);
                }
            };
            reader.readAsDataURL(file);
        } else if (file) {
            setError("Please select a valid image file (e.g., JPG, PNG).");
        }
    };

    const handleReset = () => {
        setImageSrc(null);
        setError(null);
        setView(initialMode);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files ? e.dataTransfer.files[0] : null;
        handleFileSelect(file);
    };

    const renderContent = () => {
        switch (view) {
            case 'camera':
                return (
                    <div className="relative w-full h-full bg-slate-900 flex flex-col items-center justify-center">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain" />
                        <div className="absolute bottom-10 flex justify-center">
                            <button onClick={handleCapture} className="h-16 w-16 rounded-full bg-white/20 border-2 border-white flex items-center justify-center backdrop-blur-md active:scale-95 transition-transform" aria-label="Capture receipt photo">
                                <div className="h-12 w-12 rounded-full bg-white shadow-lg"></div>
                            </button>
                        </div>
                    </div>
                );
            case 'upload':
                return (
                    <div className="w-full h-full p-8 flex flex-col items-center justify-center">
                        <label 
                            htmlFor="file-upload"
                            className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-white hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer group"
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        >
                            <div className="text-center p-4">
                                <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                    <UploadIcon className="h-8 w-8 text-slate-400" />
                                </div>
                                <p className="text-lg font-bold text-slate-900 tracking-tight">
                                    Capture or Drop
                                </p>
                                <p className="mt-2 text-sm text-slate-500 font-medium">Select a receipt photo to analyze</p>
                                <input
                                    id="file-upload"
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => handleFileSelect(e.target.files ? e.target.files[0] : null)}
                                />
                                {error && (
                                    <div className="mt-6 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100">
                                        {error}
                                    </div>
                                )}
                            </div>
                        </label>
                    </div>
                );
            case 'loading':
                return (
                    <div className="relative w-full h-full bg-slate-50 flex flex-col items-center justify-center">
                        {imageSrc && <img src={imageSrc} alt="Captured receipt" className="max-w-full max-h-full object-contain opacity-20" />}
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                            <div className="h-16 w-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-6">
                                <SpinnerIcon className="h-8 w-8 text-slate-900 animate-spin" />
                            </div>
                            <p className="text-lg font-bold text-slate-900 tracking-tight">Extracting Data</p>
                            <p className="mt-2 text-sm text-slate-500 font-medium">Gemini is processing your receipt...</p>
                        </div>
                    </div>
                );
            case 'error':
                 return (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-white">
                        <div className="h-16 w-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 text-red-500">
                            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-2">Analysis Failed</h3>
                        <p className="text-slate-500 font-medium mb-8 max-w-sm mx-auto">{error}</p>
                        <button onClick={handleReset} className="btn-primary w-full sm:w-auto px-10">
                            Try Again
                        </button>
                    </div>
                );
        }
    };
    
    return (
        <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4 md:p-8"
            onClick={onClose}
        >
             <div 
                className="bg-slate-50 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative overflow-hidden board-white/20"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex-grow">
                    {renderContent()}
                </div>
                
                <button onClick={onClose} className="absolute top-4 right-4 bg-black/10 hover:bg-black/20 text-white rounded-full p-2 transition-colors z-[120]" aria-label="Close scanner">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <canvas ref={canvasRef} className="hidden"></canvas>
             </div>
        </div>
    );
};

export default ReceiptScanner;
