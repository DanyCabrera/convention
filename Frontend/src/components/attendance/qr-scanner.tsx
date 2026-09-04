"use client";

import { useEffect, useRef, useCallback, useState, useId } from "react";
import { AlertCircle } from "lucide-react";

interface QrScannerProps {
  onScan: (decodedText: string) => void;
  paused?: boolean;
}

export function QrScanner({ onScan, paused = false }: QrScannerProps) {
  const elementId = useId().replace(/:/g, "");
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  const pausedRef = useRef(paused);
  const lastScanRef = useRef<string>("");
  const lastScanTimeRef = useRef<number>(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const handleScan = useCallback((decodedText: string) => {
    if (pausedRef.current) return;

    const now = Date.now();
    if (
      decodedText === lastScanRef.current &&
      now - lastScanTimeRef.current < 3000
    ) {
      return;
    }

    lastScanRef.current = decodedText;
    lastScanTimeRef.current = now;
    onScanRef.current(decodedText);
  }, []);

  useEffect(() => {
    let mounted = true;
    let startingScanner = false;

    async function stopScanner() {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (!scanner) return;

      try {
        await scanner.stop();
      } catch {
        /* scanner may already be stopped */
      }

      try {
        scanner.clear();
      } catch {
        /* ignore */
      }
    }

    async function startScanner() {
      if (startingScanner || !mounted) return;
      startingScanner = true;

      setStarting(true);
      setCameraError(null);

      try {
        await stopScanner();
        if (!mounted) return;

        const { Html5Qrcode } = await import("html5-qrcode");
        if (!mounted) return;

        const scanner = new Html5Qrcode(elementId, { verbose: false });
        scannerRef.current = scanner;

        const qrboxSize = Math.min(Math.floor(window.innerWidth * 0.65), 280);
        const config = {
          fps: 8,
          qrbox: { width: qrboxSize, height: qrboxSize },
          aspectRatio: 1,
          disableFlip: false,
        };

        try {
          await scanner.start(
            { facingMode: { exact: "environment" } },
            config,
            handleScan,
            () => {}
          );
        } catch {
          await scanner.start(
            { facingMode: "user" },
            config,
            handleScan,
            () => {}
          );
        }

        if (mounted) setStarting(false);
      } catch (err) {
        if (!mounted) return;

        const msg =
          err instanceof Error ? err.message : "No se pudo acceder a la cámara";
        const isSecure =
          window.isSecureContext ||
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1";

        if (!isSecure) {
          setCameraError(
            "La cámara requiere una conexión segura (HTTPS). Si no funciona, ingresa el número de ticket manualmente abajo."
          );
        } else {
          setCameraError(
            msg.includes("Permission")
              ? "Permiso de cámara denegado. Actívalo en la configuración del navegador."
              : "No se pudo iniciar la cámara. Usa la entrada manual abajo."
          );
        }
        setStarting(false);
      } finally {
        startingScanner = false;
      }
    }

    startScanner();

    return () => {
      mounted = false;
      void stopScanner();
    };
  }, [elementId, handleScan]);

  if (cameraError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-warning/30 bg-warning/5 p-6 text-center">
        <AlertCircle className="h-8 w-8 text-warning" />
        <p className="text-sm text-muted-foreground">{cameraError}</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-black">
      {(starting || paused) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
          <p className="text-sm text-white">
            {starting ? "Iniciando cámara..." : "Procesando ticket..."}
          </p>
        </div>
      )}
      <div id={elementId} className="w-full [&_video]:!rounded-2xl" />
    </div>
  );
}
