"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Interactive Circular Image Cropper Modal
 * Allows users to pan, zoom, rotate, and crop an image into a perfect circle.
 * Enforces strict boundary clamping so photo ALWAYS covers the crop circle completely without empty space.
 */
export default function ImageCropperModal({ imageFile, onCropComplete, onCancel }) {
  const canvasRef = useRef(null);
  const [imageObj, setImageObj] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const offsetStartRef = useRef({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  const circleRadius = 135;

  // Helper: Calculate minimum zoom scale so image ALWAYS covers circle diameter
  const calculateMinZoom = useCallback((img, currentRotation) => {
    if (!img) return 1;
    const isRotatedQuarter = currentRotation % 180 !== 0;
    const imgW = isRotatedQuarter ? img.height : img.width;
    const imgH = isRotatedQuarter ? img.width : img.height;

    const scaleX = (circleRadius * 2) / imgW;
    const scaleY = (circleRadius * 2) / imgH;
    return Math.max(scaleX, scaleY);
  }, [circleRadius]);

  // Helper: Clamp pan offset so crop circle NEVER exposes empty/black space
  const clampOffset = useCallback((rawOffset, currentZoom, currentRotation, img) => {
    if (!img) return rawOffset;
    const isRotatedQuarter = currentRotation % 180 !== 0;
    const imgW = isRotatedQuarter ? img.height : img.width;
    const imgH = isRotatedQuarter ? img.width : img.height;

    const scaledW = imgW * currentZoom;
    const scaledH = imgH * currentZoom;

    const maxX = Math.max(0, (scaledW / 2) - circleRadius);
    const maxY = Math.max(0, (scaledH / 2) - circleRadius);

    return {
      x: Math.max(-maxX, Math.min(maxX, rawOffset.x)),
      y: Math.max(-maxY, Math.min(maxY, rawOffset.y)),
    };
  }, [circleRadius]);

  // Load image file into HTMLImageElement
  useEffect(() => {
    if (!imageFile) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setImageObj(img);
        const baseMinZoom = calculateMinZoom(img, 0);
        const initialZoom = baseMinZoom * 1.05;
        setMinZoom(baseMinZoom);
        setZoom(initialZoom);
        setOffset({ x: 0, y: 0 });
        setRotation(0);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(imageFile);
  }, [imageFile, calculateMinZoom]);

  // Render canvas frame
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageObj) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // 1. Clear canvas
    ctx.clearRect(0, 0, width, height);

    // 2. Draw transformed image in 100% original full brightness
    ctx.save();
    ctx.translate(centerX + offset.x, centerY + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    ctx.drawImage(imageObj, -imageObj.width / 2, -imageObj.height / 2);
    ctx.restore();

    // 3. Draw dark overlay ONLY OUTSIDE the circular crop area
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.70)';
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.restore();

    // 4. Draw Circular Accent Ring & 3x3 Grid Lines inside circle
    ctx.save();

    // Outer Circle Border Ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#3b82f6';
    ctx.stroke();

    // 3x3 Grid Lines inside circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
    ctx.clip();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.40)';
    ctx.lineWidth = 1;

    const step = (circleRadius * 2) / 3;
    const startX = centerX - circleRadius;
    const startY = centerY - circleRadius;

    // Vertical grid lines
    ctx.beginPath();
    ctx.moveTo(startX + step, centerY - circleRadius);
    ctx.lineTo(startX + step, centerY + circleRadius);
    ctx.moveTo(startX + step * 2, centerY - circleRadius);
    ctx.lineTo(startX + step * 2, centerY + circleRadius);
    ctx.stroke();

    // Horizontal grid lines
    ctx.beginPath();
    ctx.moveTo(centerX - circleRadius, startY + step);
    ctx.lineTo(centerX + circleRadius, startY + step);
    ctx.moveTo(centerX - circleRadius, startY + step * 2);
    ctx.lineTo(centerX + circleRadius, startY + step * 2);
    ctx.stroke();

    ctx.restore();
  }, [imageObj, zoom, rotation, offset, circleRadius]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Pointer / Touch / Mouse Drag handlers with strict boundary clamping
  const handlePointerDown = (e) => {
    setIsDragging(true);
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    dragStartRef.current = { x: clientX, y: clientY };
    offsetStartRef.current = { ...offset };
  };

  const handlePointerMove = (e) => {
    if (!isDragging || !imageObj) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    const dx = clientX - dragStartRef.current.x;
    const dy = clientY - dragStartRef.current.y;
    const rawOffset = {
      x: offsetStartRef.current.x + dx,
      y: offsetStartRef.current.y + dy,
    };
    const clamped = clampOffset(rawOffset, zoom, rotation, imageObj);
    setOffset(clamped);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleZoomChange = (newZoomValue) => {
    if (!imageObj) return;
    const targetZoom = Math.max(minZoom, Math.min(minZoom * 4, newZoomValue));
    setZoom(targetZoom);
    setOffset((prevOffset) => clampOffset(prevOffset, targetZoom, rotation, imageObj));
  };

  const handleWheel = (e) => {
    if (e.cancelable) {
      try { e.preventDefault(); } catch (err) {}
    }
    if (!imageObj) return;
    const zoomFactor = e.deltaY < 0 ? 1.05 : 0.95;
    const targetZoom = Math.max(minZoom, Math.min(minZoom * 4, zoom * zoomFactor));
    setZoom(targetZoom);
    setOffset((prevOffset) => clampOffset(prevOffset, targetZoom, rotation, imageObj));
  };

  const handleRotate = () => {
    if (!imageObj) return;
    const newRotation = (rotation + 90) % 360;
    const newMinZoom = calculateMinZoom(imageObj, newRotation);
    const targetZoom = Math.max(newMinZoom, zoom);
    setRotation(newRotation);
    setMinZoom(newMinZoom);
    setZoom(targetZoom);
    setOffset((prevOffset) => clampOffset(prevOffset, targetZoom, newRotation, imageObj));
  };

  // High-Res Export of Cropped Circle Area
  const handleDone = async () => {
    if (!imageObj || isProcessing) return;
    setIsProcessing(true);

    try {
      const outputSize = 800; // 800x800 high res cropped square
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = outputSize;
      exportCanvas.height = outputSize;
      const ctx = exportCanvas.getContext('2d');

      const previewWidth = 340;
      const previewHeight = 340;
      const scaleRatio = outputSize / (circleRadius * 2);

      const centerX = previewWidth / 2;
      const centerY = previewHeight / 2;

      ctx.save();
      ctx.translate(outputSize / 2, outputSize / 2);
      ctx.scale(scaleRatio, scaleRatio);
      ctx.translate(offset.x, offset.y);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);
      ctx.drawImage(imageObj, -imageObj.width / 2, -imageObj.height / 2);
      ctx.restore();

      exportCanvas.toBlob(
        (blob) => {
          if (!blob) {
            onCancel();
            return;
          }
          const fileExt = imageFile.name.split('.').pop() || 'jpg';
          const croppedFile = new File([blob], `cropped-${imageFile.name}`, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          onCropComplete(croppedFile);
        },
        'image/jpeg',
        0.95
      );
    } catch (err) {
      console.error("Crop export error:", err);
      onCancel();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-4 font-sans antialiased animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity" onClick={onCancel}></div>

      {/* Cropper Container Modal */}
      <div className="relative z-10 w-full max-w-md bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col animate-fade-in-up">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">Adjust & Crop Photo</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cancel"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Canvas Area */}
        <div
          className="relative bg-slate-950 flex items-center justify-center p-4 cursor-grab active:cursor-grabbing select-none overflow-hidden touch-none"
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          onWheel={handleWheel}
        >
          <canvas ref={canvasRef} width={340} height={340} className="rounded-2xl max-w-full h-auto shadow-inner" />
          
          {/* Subtle instruction pill */}
          <div className="absolute top-6 px-3 py-1 bg-slate-900/80 backdrop-blur-md rounded-full border border-slate-700/60 text-slate-300 text-[11px] font-semibold tracking-wide pointer-events-none shadow-md">
            Drag to reposition photo inside circle
          </div>
        </div>

        {/* Control Toolbar */}
        <div className="p-5 bg-slate-900 border-t border-slate-800/80 flex flex-col gap-4">
          {/* Zoom & Rotate Controls */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleZoomChange(zoom - 0.15)}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer shrink-0"
              title="Zoom Out"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
              </svg>
            </button>

            {/* Slider */}
            <input
              type="range"
              min={minZoom}
              max={minZoom * 4}
              step={0.01}
              value={zoom}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />

            <button
              type="button"
              onClick={() => handleZoomChange(zoom + 0.15)}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer shrink-0"
              title="Zoom In"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>

            <button
              type="button"
              onClick={handleRotate}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 flex items-center justify-center transition cursor-pointer shrink-0 ml-1"
              title="Rotate 90°"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleDone}
              className="flex-1 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing ? (
                <span>Cropping...</span>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Done &amp; Apply</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
