"use client";

import { useEffect, useState } from "react";
import { SiWhatsapp } from "react-icons/si";
import { CheckCircle2 } from "lucide-react";

export const WhatsAppVerification = () => {
  const targetCode = "482916";
  const [enteredCode, setEnteredCode] = useState("");
  const [phase, setPhase] = useState<"typing" | "processing" | "verified">(
    "typing"
  );

  useEffect(() => {
    if (phase === "typing") {
      setEnteredCode("");
      targetCode.split("").forEach((ch, idx) => {
        setTimeout(() => {
          setEnteredCode((prev) => prev + ch);
          if (idx === targetCode.length - 1) {
            setTimeout(() => setPhase("processing"), 450);
          }
        }, 220 * (idx + 1));
      });
    } else if (phase === "processing") {
      setTimeout(() => setPhase("verified"), 650);
    } else if (phase === "verified") {
      setTimeout(() => setPhase("typing"), 2000);
    }
  }, [phase]);

  return (
    <div className="relative w-full max-w-[280px] sm:max-w-[320px]">
      {/* Phone Frame */}
      <div className="relative bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-10"></div>

        {/* Screen */}
        <div className="relative bg-white rounded-[2rem] overflow-hidden aspect-[9/19]">
          {/* WhatsApp Header */}
          <div className="bg-[#075E54] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <SiWhatsapp className="w-6 h-6 text-[#25D366]" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">WhatsApp</p>
                <p className="text-white/80 text-xs">Verification</p>
              </div>
            </div>
          </div>

          {/* Chat Content */}
          <div className="bg-[#ECE5DD] p-4 h-full">
            {/* Message Bubble */}
            <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm max-w-[85%] mb-3">
              <p className="text-xs text-gray-700 mb-2">
                Your verification code is:
              </p>
              <div
                className="font-mono text-2xl font-bold text-[#075E54] tracking-wider mb-1"
                aria-live="polite"
              >
                {phase === "verified" ? targetCode : enteredCode}
                {phase === "typing" && enteredCode.length < 6 && (
                  <span className="inline-block w-0.5 h-6 bg-[#075E54] ml-1 animate-pulse"></span>
                )}
              </div>
              <p className="text-[10px] text-gray-500">
                Do not share this code with anyone.
              </p>
              <div className="flex justify-end mt-1">
                <span className="text-[10px] text-gray-400">
                  {phase === "verified" ? "12:34 PM" : "12:34 PM"}
                </span>
              </div>
            </div>

            {/* Status Indicator */}
            {phase === "verified" && (
              <div className="flex justify-center animate-fade-in">
                <div className="bg-[#25D366] text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Code Verified</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Decorative Glow Effects */}
      <div className="absolute -top-4 -right-4 w-32 h-32 bg-purple-300 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-300 rounded-full blur-3xl opacity-30"></div>
    </div>
  );
};
