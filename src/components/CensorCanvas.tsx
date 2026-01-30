import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

interface CensorCanvasProps {
    imageFile: File | null;
}

// Album cover dimensions and regions (based on 500x500 original)
const ALBUM_SIZE = 500;
const HEADER_HEIGHT = 72;  // AC/DC logo area
const FOOTER_HEIGHT = 52;  // "Dirty Deeds Done Dirt Cheap" text area
const PHOTO_HEIGHT = ALBUM_SIZE - HEADER_HEIGHT - FOOTER_HEIGHT;

export const CensorCanvas: React.FC<CensorCanvasProps> = ({ imageFile }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const tempCanvasRef = useRef<HTMLCanvasElement>(null);
    const [isModelsLoaded, setIsModelsLoaded] = useState(false);
    const [albumCover, setAlbumCover] = useState<HTMLImageElement | null>(null);
    const [status, setStatus] = useState('Loading models...');

    // Load models and album cover
    useEffect(() => {
        const loadAssets = async () => {
            try {
                // Load face detection models
                await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
                await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
                setIsModelsLoaded(true);

                // Load album cover
                const img = new Image();
                img.onload = () => setAlbumCover(img);
                img.src = '/fq5dvg-dirtydeeds-master_500x500.jpg';

                setStatus('Ready');
            } catch (err) {
                console.error("Failed to load assets", err);
                setStatus('Error loading assets');
            }
        };
        loadAssets();
    }, []);

    useEffect(() => {
        if (!imageFile || !isModelsLoaded || !albumCover || !canvasRef.current || !tempCanvasRef.current) return;

        const processImage = async () => {
            setStatus('Processing...');

            const userImg = await faceapi.bufferToImage(imageFile);
            const canvas = canvasRef.current!;
            const tempCanvas = tempCanvasRef.current!;

            // Set up temp canvas for processing user image
            tempCanvas.width = userImg.width;
            tempCanvas.height = userImg.height;
            const tempCtx = tempCanvas.getContext('2d')!;
            tempCtx.drawImage(userImg, 0, 0);

            // Detect faces and draw censor bars on temp canvas
            const detections = await faceapi.detectAllFaces(userImg).withFaceLandmarks();
            const resizedDetections = faceapi.resizeResults(detections, { width: userImg.width, height: userImg.height });

            resizedDetections.forEach(detection => {
                const landmarks = detection.landmarks;
                const leftEye = landmarks.getLeftEye();
                const rightEye = landmarks.getRightEye();

                const leftEyeCenter = leftEye.reduce((acc, curr) => ({ x: acc.x + curr.x, y: acc.y + curr.y }), { x: 0, y: 0 });
                leftEyeCenter.x /= leftEye.length;
                leftEyeCenter.y /= leftEye.length;

                const rightEyeCenter = rightEye.reduce((acc, curr) => ({ x: acc.x + curr.x, y: acc.y + curr.y }), { x: 0, y: 0 });
                rightEyeCenter.x /= rightEye.length;
                rightEyeCenter.y /= rightEye.length;

                const dy = rightEyeCenter.y - leftEyeCenter.y;
                const dx = rightEyeCenter.x - leftEyeCenter.x;
                const angle = Math.atan2(dy, dx);

                const eyeDistance = Math.sqrt(dx * dx + dy * dy);
                const stripWidth = eyeDistance * 2.2;
                const stripHeight = eyeDistance * 0.6;

                const centerX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
                const centerY = (leftEyeCenter.y + rightEyeCenter.y) / 2;

                tempCtx.save();
                tempCtx.translate(centerX, centerY);
                tempCtx.rotate(angle);
                tempCtx.fillStyle = 'black';
                tempCtx.fillRect(-stripWidth / 2, -stripHeight / 2, stripWidth, stripHeight);
                tempCtx.restore();
            });

            // Now composite everything onto the main canvas
            canvas.width = ALBUM_SIZE;
            canvas.height = ALBUM_SIZE;
            const ctx = canvas.getContext('2d')!;

            // Draw header from album cover (AC/DC logo)
            ctx.drawImage(
                albumCover,
                0, 0, ALBUM_SIZE, HEADER_HEIGHT,  // source
                0, 0, ALBUM_SIZE, HEADER_HEIGHT   // destination
            );

            // Draw censored user image in the middle, scaled to fit
            const scale = Math.min(ALBUM_SIZE / tempCanvas.width, PHOTO_HEIGHT / tempCanvas.height);
            const scaledWidth = tempCanvas.width * scale;
            const scaledHeight = tempCanvas.height * scale;
            const offsetX = (ALBUM_SIZE - scaledWidth) / 2;
            const offsetY = HEADER_HEIGHT + (PHOTO_HEIGHT - scaledHeight) / 2;

            // Fill background for photo area (dark color matching album)
            ctx.fillStyle = '#2a1a1a';
            ctx.fillRect(0, HEADER_HEIGHT, ALBUM_SIZE, PHOTO_HEIGHT);

            ctx.drawImage(tempCanvas, offsetX, offsetY, scaledWidth, scaledHeight);

            // Draw footer from album cover (Dirty Deeds Done Dirt Cheap text)
            ctx.drawImage(
                albumCover,
                0, ALBUM_SIZE - FOOTER_HEIGHT, ALBUM_SIZE, FOOTER_HEIGHT,  // source
                0, ALBUM_SIZE - FOOTER_HEIGHT, ALBUM_SIZE, FOOTER_HEIGHT   // destination
            );

            setStatus(resizedDetections.length > 0 ? 'Done' : 'No faces detected');
        };

        processImage();
    }, [imageFile, isModelsLoaded, albumCover]);

    return (
        <div>
            <h3 style={{ marginBottom: '1rem', color: '#666' }}>{status}</h3>
            <div className="canvas-container">
                <canvas ref={canvasRef} />
                <canvas ref={tempCanvasRef} style={{ display: 'none' }} />
            </div>
        </div>
    );
};
