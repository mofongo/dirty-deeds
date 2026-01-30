import React, { useRef } from 'react';

interface ImageUploaderProps {
    onImageSelected: (file: File) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onImageSelected(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onImageSelected(e.target.files[0]);
        }
    };

    return (
        <div
            className="upload-area"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleChange}
                accept="image/*"
                style={{ display: 'none' }}
            />
            <h3>Drop your image here</h3>
            <p style={{ opacity: 0.6 }}>or click to browse</p>
        </div>
    );
};
