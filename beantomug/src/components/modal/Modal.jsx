import React, { useEffect } from "react";
import classes from "./modal.module.css";
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footerButtons
}) {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    
      <div className={classes.modal_content} onClick={handleOverlayClick}>
        {title && <h2 className="text-lg font-semibold mb-4">{title}</h2>}
        <div className="mb-4">{children}</div>
        {footerButtons && (
          <div className="flex justify-end gap-3">
            {footerButtons.map((btn, index) => (
              <button
                key={index}
                className={btn.className || "px-4 py-2 rounded transition"}
                onClick={btn.onClick}
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}
      </div>
  );
}
