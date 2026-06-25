import { useState, useRef, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";

interface QRGeneratorProps {
  url: string;
}

export default function QRGenerator({ url }: QRGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<SVGSVGElement>(null);
  
  // Reset copied state when URL changes
  useEffect(() => {
    setCopied(false);
  }, [url]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error copying URL: ", err);
    }
  };

  const handleDownload = () => {
    if (!qrRef.current) return;
    
    // We get the SVG string and convert to a data URL to download
    const svgData = new XMLSerializer().serializeToString(qrRef.current);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      // Add a little padding and background
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
        
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = "cv_qr_code.png";
        downloadLink.href = `${pngFile}`;
        downloadLink.click();
      }
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Generador de QR visual */}
      <div className="bg-white p-6 rounded-3xl shadow-xl border-4 border-white/10 relative group">
        <QRCodeSVG 
          value={url} 
          size={250} 
          bgColor={"#ffffff"} 
          fgColor={"#0a0a0a"} 
          level={"Q"}
          includeMargin={false}
          ref={qrRef}
          imageSettings={{
            src: "https://januscore.pro/favicon.svg", // Reemplazar con URL absoluta de tu logo si es necesario
            x: undefined,
            y: undefined,
            height: 40,
            width: 40,
            excavate: true,
          }}
        />
        
        {/* Capa oculta para descargar (hover effect) */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button 
            onClick={handleDownload}
            className="bg-primary text-bg font-bold px-6 py-2 rounded-full hover:scale-105 transition-transform flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Descargar
          </button>
        </div>
      </div>

      {/* URL Copy Tool */}
      <div className="w-full max-w-md">
        <div className="flex bg-bg/50 border border-white/10 rounded-xl overflow-hidden shadow-inner">
          <div className="px-4 py-3 text-text-secondary text-sm truncate flex-1 font-mono">
            {url}
          </div>
          <button 
            onClick={handleCopy}
            className={`px-4 py-3 font-bold transition-colors border-l border-white/10 ${copied ? 'bg-green-500 text-bg' : 'bg-surface hover:bg-white/5 text-primary'}`}
          >
            {copied ? '¡Copiado!' : 'Copiar'}
          </button>
        </div>
        <p className="text-center text-xs text-text-secondary mt-3">
          Esta URL incluye tu token de acceso privado seguro.
        </p>
      </div>
    </div>
  );
}
