"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Cropper from "react-easy-crop";
import { Button } from "./Button";

interface ImageUploaderProps {
  onUploadSuccess: (url: string) => void;
  currentImage?: string | null;
}

export function ImageUploader({ onUploadSuccess, currentImage }: ImageUploaderProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => setImageSrc(reader.result as string));
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
  });

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Creates the cropped image using canvas
  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob> => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement("canvas");
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) throw new Error("No 2d context");

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((file) => {
        if (file) resolve(file);
        else reject(new Error("Canvas is empty"));
      }, "image/jpeg", 0.9);
    });
  };

  const handleUpload = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setIsUploading(true);
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const file = new File([croppedBlob], "cropped-image.jpg", { type: "image/jpeg" });

      // 1. Send file as FormData to Next API to bypass R2 CORS
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to upload to server");
      }

      const { publicUrl } = await res.json();
      onUploadSuccess(publicUrl);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Error uploading image. Please check your R2 configuration.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {imageSrc ? (
        <div className="space-y-4">
          <div className="relative w-full h-64 bg-slate-100 rounded-lg overflow-hidden border border-slate-300">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>
          <div className="flex items-center gap-4">
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setImageSrc(null)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Crop & Upload"}
            </Button>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? "border-sky-500 bg-sky-50" : "border-slate-300 hover:border-sky-400 bg-slate-50"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center space-y-2">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-medium text-slate-700">
              {isDragActive ? "Drop image here" : "Drag & drop an image, or click to select"}
            </p>
            <p className="text-xs text-slate-500">Must be 1:1 ratio (will crop automatically)</p>
          </div>
        </div>
      )}

      {currentImage && !imageSrc && (
        <div className="mt-4 flex items-center gap-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
          <img src={currentImage} alt="Current" className="w-16 h-16 object-cover rounded shadow-sm bg-white" />
          <div className="text-xs text-slate-500 truncate flex-1">
            <span className="font-semibold block text-slate-700">Current Image</span>
            {currentImage}
          </div>
        </div>
      )}
    </div>
  );
}
