'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Camera,
  Upload,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';
import type { ScannedProductData } from '@/lib/invoice-parser/types';
import type { Category } from '@/lib/api';

type Step = 'capture' | 'processing' | 'review' | 'error';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onExtracted: (data: ScannedProductData) => void;
  categories: Category[];
}

export function ScanInvoiceModal({ isOpen, onClose, onExtracted, categories }: Props) {
  const [step, setStep] = useState<Step>('capture');
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState('');
  const [ocrExpanded, setOcrExpanded] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [reviewData, setReviewData] = useState<ScannedProductData>({});
  const [autoFilled, setAutoFilled] = useState<Set<string>>(new Set());

  // Camera (getUserMedia) state
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stop camera stream on unmount or when not needed
  useEffect(() => {
    return () => {
      stream?.getTracks().forEach(t => t.stop());
    };
  }, [stream]);

  useEffect(() => {
    if (!showCamera) {
      stream?.getTracks().forEach(t => t.stop());
      setStream(null);
    }
  }, [showCamera, stream]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('capture');
      setCapturedFile(null);
      setPreviewUrl(null);
      setOcrText('');
      setOcrExpanded(false);
      setErrorMsg('');
      setReviewData({});
      setAutoFilled(new Set());
      setShowCamera(false);
    }
  }, [isOpen]);

  const handleFileSelected = useCallback(async (file: File) => {
    setCapturedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setShowCamera(false);
    await processImage(file);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const processImage = async (file: File) => {
    setStep('processing');
    try {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('parser', 'heuristic');

      const res = await fetch('/api/admin/scan-invoice', { method: 'POST', body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const { extracted, ocrText: rawOcr } = await res.json();
      setOcrText(rawOcr || '');
      setReviewData(extracted || {});
      const filled = new Set(Object.keys(extracted || {}).filter(k => !!(extracted as Record<string, unknown>)[k]));
      setAutoFilled(filled as Set<string>);
      setStep('review');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al procesar la imagen');
      setStep('error');
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      setStream(mediaStream);
      setShowCamera(true);
      // Attach stream to video element after render
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }
      }, 50);
    } catch {
      setErrorMsg('No se pudo acceder a la cámara. Usa "Subir foto" en su lugar.');
      setStep('error');
    }
  };

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);

    canvas.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], `captura-${Date.now()}.jpg`, { type: 'image/jpeg' });
      handleFileSelected(file);
    }, 'image/jpeg', 0.92);
  };

  const handleConfirm = () => {
    onExtracted(reviewData);
    onClose();
  };

  const resetToCapture = () => {
    setStep('capture');
    setCapturedFile(null);
    setPreviewUrl(null);
    setOcrText('');
    setShowCamera(false);
  };

  const updateField = (key: keyof ScannedProductData, value: string) => {
    setReviewData(prev => ({ ...prev, [key]: value }));
  };

  const fieldBorder = (key: string) =>
    autoFilled.has(key)
      ? 'border-emerald-400 dark:border-emerald-500'
      : 'border-amber-300 dark:border-amber-600';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Camera className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Escanear Factura
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {/* ── CAPTURE STEP ── */}
          {step === 'capture' && (
            <div className="space-y-4">
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                Toma una foto de la factura o sube una imagen para extraer los datos del producto automáticamente.
              </p>

              {/* Camera viewfinder */}
              {showCamera ? (
                <div className="space-y-3">
                  <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                    <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="flex gap-3">
                    <button onClick={captureFrame} className="btn btn-primary flex-1 flex items-center justify-center gap-2">
                      <Camera className="w-5 h-5" /> Capturar foto
                    </button>
                    <button onClick={() => setShowCamera(false)} className="btn btn-secondary">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Drop zone / file upload */}
                  <label
                    htmlFor="invoice-file-input"
                    className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors"
                  >
                    <Upload className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      Subir foto de factura
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      JPG, PNG, HEIC — máx. 10 MB
                    </span>
                  </label>
                  {/* Hidden file input — capture="environment" triggers native camera on mobile */}
                  <input
                    id="invoice-file-input"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelected(file);
                      e.target.value = '';
                    }}
                  />

                  {/* Desktop camera button — only shown when getUserMedia is available */}
                  {typeof navigator !== 'undefined' && 'mediaDevices' in navigator && (
                    <button
                      onClick={startCamera}
                      className="btn btn-secondary w-full flex items-center justify-center gap-2"
                    >
                      <Camera className="w-5 h-5" /> Usar cámara (escritorio)
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── PROCESSING STEP ── */}
          {step === 'processing' && (
            <div className="flex flex-col items-center gap-6 py-10">
              {previewUrl && (
                <div className="relative w-40 h-40 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-600">
                  <Image src={previewUrl} alt="Factura" fill className="object-cover" sizes="160px" />
                </div>
              )}
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
                <p className="text-slate-700 dark:text-slate-300 font-medium">Procesando factura…</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Extrayendo texto con OCR
                </p>
              </div>
            </div>
          )}

          {/* ── REVIEW STEP ── */}
          {step === 'review' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-4 py-2 text-sm">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>
                  Datos extraídos. Revisa y edita antes de continuar.
                  <span className="ml-1 text-emerald-600 dark:text-emerald-500">
                    (verde = autodetectado, amarillo = completar manualmente)
                  </span>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left: image + raw OCR */}
                <div className="space-y-3">
                  {previewUrl && (
                    <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                      <Image src={previewUrl} alt="Factura" fill className="object-contain" sizes="320px" />
                    </div>
                  )}
                  {ocrText && (
                    <div>
                      <button
                        onClick={() => setOcrExpanded(v => !v)}
                        className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                      >
                        {ocrExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {ocrExpanded ? 'Ocultar' : 'Ver'} texto OCR raw
                      </button>
                      {ocrExpanded && (
                        <pre className="mt-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 rounded-lg p-3 overflow-auto max-h-48 whitespace-pre-wrap break-words">
                          {ocrText}
                        </pre>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: editable fields */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Nombre del producto</label>
                    <input
                      className={`input mt-1 border-2 ${fieldBorder('name')}`}
                      value={reviewData.name || ''}
                      onChange={e => updateField('name', e.target.value)}
                      placeholder="Nombre del producto"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Laboratorio</label>
                    <input
                      className={`input mt-1 border-2 ${fieldBorder('laboratory')}`}
                      value={reviewData.laboratory || ''}
                      onChange={e => updateField('laboratory', e.target.value)}
                      placeholder="Laboratorio fabricante"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Precio CLP</label>
                      <input
                        className={`input mt-1 border-2 ${fieldBorder('price')}`}
                        type="number"
                        min="0"
                        value={reviewData.price || ''}
                        onChange={e => updateField('price', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Stock</label>
                      <input
                        className={`input mt-1 border-2 ${fieldBorder('stock')}`}
                        type="number"
                        min="0"
                        value={reviewData.stock || ''}
                        onChange={e => updateField('stock', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Principio activo</label>
                    <input
                      className={`input mt-1 border-2 ${fieldBorder('active_ingredient')}`}
                      value={reviewData.active_ingredient || ''}
                      onChange={e => updateField('active_ingredient', e.target.value)}
                      placeholder="Principio activo"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Acción terapéutica</label>
                    <input
                      className={`input mt-1 border-2 ${fieldBorder('therapeutic_action')}`}
                      value={reviewData.therapeutic_action || ''}
                      onChange={e => updateField('therapeutic_action', e.target.value)}
                      placeholder="Acción terapéutica"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Presentación</label>
                    <input
                      className={`input mt-1 border-2 ${fieldBorder('presentation')}`}
                      value={reviewData.presentation || ''}
                      onChange={e => updateField('presentation', e.target.value)}
                      placeholder="ej: COMPRIMIDOS 500MG x 30"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Tipo de venta</label>
                      <select
                        className={`input mt-1 border-2 ${fieldBorder('prescription_type')}`}
                        value={reviewData.prescription_type || 'direct'}
                        onChange={e => updateField('prescription_type', e.target.value)}
                      >
                        <option value="direct">Venta directa</option>
                        <option value="prescription">Receta médica</option>
                        <option value="retained">Receta retenida</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Descuento %</label>
                      <input
                        className={`input mt-1 border-2 ${fieldBorder('discount_percent')}`}
                        type="number"
                        min="0"
                        max="100"
                        value={reviewData.discount_percent || ''}
                        onChange={e => updateField('discount_percent', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button onClick={resetToCapture} className="btn btn-secondary flex items-center gap-2">
                  <Camera className="w-4 h-4" /> Volver a escanear
                </button>
                <button onClick={handleConfirm} className="btn btn-primary flex-1 flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Usar estos datos
                </button>
              </div>
            </div>
          )}

          {/* ── ERROR STEP ── */}
          {step === 'error' && (
            <div className="flex flex-col items-center gap-5 py-8">
              <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <X className="w-7 h-7 text-red-600 dark:text-red-400" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Error al procesar</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{errorMsg}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={resetToCapture} className="btn btn-secondary flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" /> Reintentar
                </button>
                <button onClick={onClose} className="btn btn-primary">Cerrar</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
