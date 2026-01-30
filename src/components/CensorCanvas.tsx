import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

interface CensorCanvasProps {
    imageFile: File | null;
}

export const CensorCanvas: React.FC<CensorCanvasProps> = ({ imageFile }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isModelsLoaded, setIsModelsLoaded] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState('Loading models...');

    useEffect(() => {
        const loadModels = async () => {
            try {
                await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
                await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
                setIsModelsLoaded(true);
                setStatus('Ready');
            } catch (err) {
                console.error("Failed to load models", err);
                setStatus('Error loading models');
            }
        };
        loadModels();
    }, []);

    useEffect(() => {
        if (!imageFile || !isModelsLoaded || !canvasRef.current) return;

        const processImage = async () => {
            setIsProcessing(true);
            setStatus('Processing...');

            const img = await faceapi.bufferToImage(imageFile);
            const canvas = canvasRef.current!;
            const displaySize = { width: img.width, height: img.height };

            // Resize canvas to match image
            canvas.width = img.width;
            canvas.height = img.height;
            faceapi.matchDimensions(canvas, displaySize);

            // Draw original image
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0);

            // Detect faces
            const detections = await faceapi.detectAllFaces(img).withFaceLandmarks();
            const resizedDetections = faceapi.resizeResults(detections, displaySize);

            resizedDetections.forEach(detection => {
                const landmarks = detection.landmarks;
                const leftEye = landmarks.getLeftEye();
                const rightEye = landmarks.getRightEye();

                // Calculate centers
                const leftEyeCenter = leftEye.reduce((acc, curr) => ({ x: acc.x + curr.x, y: acc.y + curr.y }), { x: 0, y: 0 });
                leftEyeCenter.x /= leftEye.length;
                leftEyeCenter.y /= leftEye.length;

                const rightEyeCenter = rightEye.reduce((acc, curr) => ({ x: acc.x + curr.x, y: acc.y + curr.y }), { x: 0, y: 0 });
                rightEyeCenter.x /= rightEye.length;
                rightEyeCenter.y /= rightEye.length;

                // Calculate angle
                const dy = rightEyeCenter.y - leftEyeCenter.y;
                const dx = rightEyeCenter.x - leftEyeCenter.x;
                const angle = Math.atan2(dy, dx);

                // Calculate dimensions
                const eyeDistance = Math.sqrt(dx * dx + dy * dy);
                const stripWidth = eyeDistance * 2.2; // Wider than eyes
                const stripHeight = eyeDistance * 0.6; // Proportional height

                // Midpoint
                const centerX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
                const centerY = (leftEyeCenter.y + rightEyeCenter.y) / 2;

                // Draw rotated strip
                ctx.save();
                ctx.translate(centerX, centerY);
                ctx.rotate(angle);
                ctx.fillStyle = 'black';
                ctx.fillRect(-stripWidth / 2, -stripHeight / 2, stripWidth, stripHeight);
                ctx.restore();
            });

            setIsProcessing(false);
            setStatus(resizedDetections.length > 0 ? 'Done' : 'No faces detected');
        };

        processImage();
    }, [imageFile, isModelsLoaded]);

    return (
        <div>
            <h3 style={{ marginBottom: '1rem', color: '#666' }}>{status}</h3>
            <div className="canvas-container">
                <canvas ref={canvasRef} />
            </div>
        </div>
    );
};
