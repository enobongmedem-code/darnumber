import { useEffect, useRef, useState } from "react";
import { Check, Phone, Shield } from "lucide-react";
import { PhoneMockup } from "./PhoneMockup";

type Phase = "typing" | "processing" | "verified";

export const WhatsAppVerification = () => {
  const targetCode = "482916";
  const [enteredCode, setEnteredCode] = useState("");
  const [phase, setPhase] = useState<Phase>("typing");
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const clearTimers = () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current = [];
    };
    clearTimers();

    if (phase === "typing") {
      setEnteredCode("");
      targetCode.split("").forEach((ch, idx) => {
        const t = window.setTimeout(() => {
          setEnteredCode((prev) => prev + ch);
          if (idx === targetCode.length - 1) {
            const t2 = window.setTimeout(() => setPhase("processing"), 500);
            timersRef.current.push(t2);
          }
        }, 250 * (idx + 1));
        timersRef.current.push(t);
      });
    } else if (phase === "processing") {
      const t = window.setTimeout(() => setPhase("verified"), 800);
      timersRef.current.push(t);
    } else if (phase === "verified") {
      const t = window.setTimeout(() => setPhase("typing"), 2500);
      timersRef.current.push(t);
    }

    return () => clearTimers();
  }, [phase]);

  return (
    <PhoneMockup className="animate-float">
      <div className="h-full flex flex-col bg-[#111b21]">
        {/* WhatsApp Header */}
        <div className="bg-[#202c33] pt-10 pb-3 px-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-whatsapp/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-whatsapp" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#e9edef]">WhatsApp</p>
              <p className="text-xs text-[#8696a0]">Verification</p>
            </div>
            <Phone className="w-5 h-5 text-[#8696a0]" />
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 p-4 space-y-3 overflow-hidden">
          {/* System Message */}
          <div className="flex justify-center">
            <div className="bg-[#182229] px-3 py-1.5 rounded-lg">
              <p className="text-[10px] text-[#8696a0] text-center">
                Messages are end-to-end encrypted
              </p>
            </div>
          </div>

          {/* Incoming Message */}
          <div className="flex justify-start">
            <div className="bg-[#202c33] rounded-lg rounded-tl-none px-3 py-2 max-w-[85%]">
              <p className="text-[13px] text-[#e9edef] leading-relaxed">
                Your WhatsApp code is:
              </p>
              <p className="text-2xl font-bold text-whatsapp tracking-[0.2em] mt-1">
                {targetCode}
              </p>
              <p className="text-[10px] text-[#8696a0] mt-1">
                Don't share this code
              </p>
              <p className="text-[10px] text-[#8696a0] text-right mt-1">
                12:34 PM
              </p>
            </div>
          </div>
        </div>

        {/* Verification Input Area */}
        <div className="bg-[#202c33] p-4">
          <p className="text-[11px] text-[#8696a0] text-center mb-3">
            {phase === "verified" ? "Code verified!" : "Enter 6-digit code"}
          </p>
          <div className="flex gap-1.5 justify-center mb-3">
            {Array.from({ length: 6 }).map((_, i) => {
              const isFilled = i < enteredCode.length;
              const char = isFilled ? enteredCode[i] : "";
              const isVerified = phase === "verified";

              return (
                <div
                  key={i}
                  className={`w-9 h-11 rounded-md border-2 flex items-center justify-center text-lg font-bold transition-all duration-200 ${
                    isVerified
                      ? "bg-whatsapp/20 border-whatsapp text-whatsapp"
                      : isFilled
                      ? "bg-[#2a3942] border-whatsapp/60 text-[#e9edef] scale-105"
                      : "bg-[#2a3942] border-[#3b4a54] text-[#8696a0]"
                  }`}
                >
                  {isVerified && i === 2 ? <Check className="w-4 h-4" /> : char}
                </div>
              );
            })}
          </div>
          <div className="flex justify-center">
            <div
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 ${
                phase === "verified"
                  ? "bg-whatsapp text-primary-foreground"
                  : phase === "processing"
                  ? "bg-whatsapp/20 text-whatsapp animate-pulse"
                  : "bg-[#2a3942] text-[#8696a0]"
              }`}
            >
              {phase === "verified"
                ? "✓ Verified"
                : phase === "processing"
                ? "Verifying..."
                : "Receiving SMS..."}
            </div>
          </div>
        </div>
      </div>
    </PhoneMockup>
  );
};
