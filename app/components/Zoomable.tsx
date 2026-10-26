"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/** An image that opens full-screen on click; Esc, the close button, or a click outside closes it. */
export default function Zoomable({ src, alt, className, caption }: { src: string; alt: string; className?: string; caption?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <button className={`zoomable ${className ?? ""}`} onClick={() => setOpen(true)} aria-label={`Enlarge: ${alt}`}>
        <img src={src} alt={alt} loading="lazy" />
        <span className="zoom-hint" aria-hidden="true">⤢</span>
      </button>
      {/* Portalled to <body> so a sinking chapter's transform can't trap it. */}
      {open && createPortal(
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={alt} onClick={() => setOpen(false)}>
          <figure onClick={(e) => e.stopPropagation()}>
            <img src={src} alt={alt} />
            {caption && <figcaption>{caption}</figcaption>}
          </figure>
          <button className="lightbox-close" onClick={() => setOpen(false)} aria-label="Close">Close ✕</button>
        </div>,
        document.body
      )}
    </>
  );
}
