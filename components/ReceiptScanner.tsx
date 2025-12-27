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
                    <div className="relative w-full h-full bg-black flex flex-col items-center justify-center">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain" />
                        <div className="absolute bottom-6 flex justify-center">
                            <button onClick={handleCapture} className="h-20 w-20 rounded-full bg-white/30 border-4 border-white flex items-center justify-center backdrop-blur-sm" aria-label="Capture receipt photo">
                                <div className="h-16 w-16 rounded-full bg-white"></div>
                            </button>
                        </div>
                    </div>
                );
            case 'upload':
                return (
                    <div className="w-full h-full p-6 flex flex-col items-center justify-center">
                        <label 
                            htmlFor="file-upload"
                            className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        >
                            <div className="text-center p-4">
                                <UploadIcon className="mx-auto h-12 w-12 text-slate-400" />
                                <p className="mt-4 block text-lg font-semibold text-slate-800">
                                    Drop receipt image here
                                </p>
                                <p className="mt-1 text-sm text-slate-500">or click to upload</p>
                                <input
                                    id="file-upload"
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => handleFileSelect(e.target.files ? e.target.files[0] : null)}
                                />
                                {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
                            </div>
                        </label>
                    </div>
                );
            case 'loading':
                return (
                    <div className="relative w-full h-full bg-slate-200 flex flex-col items-center justify-center">
                        {imageSrc && <img src={imageSrc} alt="Captured receipt" className="max-w-full max-h-full object-contain opacity-50" />}
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white p-4">
                            <SpinnerIcon className="h-12 w-12 text-white" />
                            <p className="mt-4 text-lg font-semibold">Analyzing your receipt...</p>
                        </div>
                    </div>
                );
            case 'error':
                 return (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Parsing Failed</h3>
                        <p className="bg-red-100 text-red-800 p-3 rounded-md mb-6 max-w-md">{error}</p>
                        <button onClick={handleReset} className="w-full sm:w-auto px-6 py-2 rounded-lg font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300">
                            Try Again
                        </button>
                    </div>
                );
        }
    };
    
    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={onClose}
        >
             <div 
                className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-2 right-2 text-white bg-black/40 rounded-full p-1 z-10" aria-label="Close scanner">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0-0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <canvas ref={canvasRef} className="hidden"></canvas>
                {renderContent()}
             </div>
        </div>
    );
};

export default ReceiptScanner;
