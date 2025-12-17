"use client";

import { ReactNode } from "react";
import { Battery, Wifi, Signal } from "lucide-react";

interface PhoneMockupProps {
  children: ReactNode;
  className?: string;
}

export const PhoneMockup = ({ children, className = "" }: PhoneMockupProps) => {
  return (
    <div className={`phone-frame ${className}`}>
      {/* Decorative side buttons */}
      <div className="phone-button-left" />
      <div className="phone-button-right" />

      {/* Notch */}
      <div className="phone-notch" />

      {/* Screen */}
      <div className="phone-screen relative">
        {/* Status Bar */}
        <div className="phone-status">
          <span className="phone-time">9:41</span>
          <div className="phone-status-icons">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-3.5 h-3.5" />
          </div>
        </div>

        {children}

        {/* Home indicator */}
        <div className="phone-home" />
      </div>
    </div>
  );
};
