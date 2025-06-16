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
    <div className={`${classes.modal_overlay} ${isOpen ? classes.active : ""}`} onClick={handleOverlayClick}>
      <div className={classes.modal_content}>
        
        <div className={classes.modal_body}>{children}</div>
        {footerButtons && (
          <div className={classes.modal_footer}>
            {footerButtons.map((btn, index) => (
              <button
                key={index}
                className={btn.className || classes.modal_button}
                onClick={btn.onClick}
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}
       
      </div>
    </div>
  );
}
