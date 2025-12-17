// "use client";

// import { useEffect, useState } from "react";
// import { CheckCircle2 } from "lucide-react";
// import { PhoneMockup } from "./PhoneMockup";

// export const WhatsAppVerification = () => {
//   const [step, setStep] = useState<"phone" | "confirm" | "verify" | "success">(
//     "phone"
//   );
//   const [phoneNumber, setPhoneNumber] = useState("");
//   const [verificationCode, setVerificationCode] = useState("");
//   // System status bar (time, signal) handled by PhoneMockup

//   useEffect(() => {
//     // Auto-progress through steps
//     if (step === "phone") {
//       // Type phone number (United States)
//       const phone = "+1 415 555 0137";
//       let idx = 0;
//       const interval = setInterval(() => {
//         if (idx <= phone.length) {
//           setPhoneNumber(phone.slice(0, idx));
//           idx++;
//         } else {
//           clearInterval(interval);
//           setTimeout(() => setStep("confirm"), 800);
//         }
//       }, 150);
//       return () => clearInterval(interval);
//     } else if (step === "confirm") {
//       setTimeout(() => setStep("verify"), 2500);
//     } else if (step === "verify") {
//       // Type verification code
//       const code = "482916";
//       let idx = 0;
//       const interval = setInterval(() => {
//         if (idx <= code.length) {
//           setVerificationCode(code.slice(0, idx));
//           idx++;
//         } else {
//           clearInterval(interval);
//           setTimeout(() => setStep("success"), 600);
//         }
//       }, 400);
//       return () => clearInterval(interval);
//     } else if (step === "success") {
//       setTimeout(() => {
//         setPhoneNumber("");
//         setVerificationCode("");
//         setStep("phone");
//       }, 3000);
//     }
//   }, [step]);

//   return (
//     <div className="relative flex items-center justify-center min-h-screen bg-linear-to-br from-slate-100 to-slate-200 p-4">
//       <PhoneMockup>
//         {/* App Header */}
//         <div className="bg-[#075E54] pt-10 pb-3 px-4">
//           <div className="flex items-center justify-center">
//             <div className="flex items-center gap-2">
//               <svg
//                 className="w-5 h-5 text-white"
//                 viewBox="0 0 24 24"
//                 fill="currentColor"
//               >
//                 <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884" />
//               </svg>
//               <span className="text-white font-semibold text-sm">WhatsApp</span>
//             </div>
//           </div>
//         </div>

//         {/* Content Area */}
//         <div className="h-full flex flex-col bg-white">
//           {/* Phone Number Entry Step */}
//           {step === "phone" && (
//             <div className="flex-1 flex flex-col px-6 py-8">
//               <div className="text-center mb-8">
//                 <h1 className="text-xl font-medium text-gray-800 mb-2">
//                   Verify your phone number
//                 </h1>
//                 <p className="text-sm text-gray-600 leading-relaxed">
//                   WhatsApp will send an SMS message to verify your phone number.
//                   Enter your country code and phone number:
//                 </p>
//               </div>

//               <div className="space-y-4">
//                 <div className="relative">
//                   <select className="w-full px-4 py-3 border-b-2 border-gray-300 bg-white text-gray-700 focus:outline-none focus:border-[#25D366]">
//                     <option>🇺🇸 United States</option>
//                   </select>
//                 </div>

//                 <div className="flex gap-3">
//                   <input
//                     type="text"
//                     value="+1"
//                     readOnly
//                     className="w-20 px-3 py-3 border-b-2 border-gray-300 text-center font-medium focus:outline-none"
//                   />
//                   <input
//                     type="tel"
//                     value={phoneNumber.replace("+1 ", "")}
//                     readOnly
//                     placeholder="phone number"
//                     className="flex-1 px-3 py-3 border-b-2 border-gray-300 font-medium focus:outline-none focus:border-[#25D366]"
//                   />
//                 </div>
//               </div>

//               <div className="mt-auto">
//                 <button className="w-full bg-[#25D366] text-white py-3 rounded-full font-medium text-sm shadow-lg">
//                   NEXT
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* Confirmation Step */}
//           {step === "confirm" && (
//             <div className="flex-1 flex flex-col px-6 py-8">
//               <div className="text-center mb-8">
//                 <h1 className="text-xl font-medium text-gray-800 mb-4">
//                   Is this the correct number?
//                 </h1>
//                 <div className="bg-gray-50 rounded-lg p-4 mb-4">
//                   <p className="text-2xl font-medium text-gray-800">
//                     +1 415 555 0137
//                   </p>
//                 </div>
//                 <p className="text-sm text-gray-600 leading-relaxed">
//                   We&rsquo;ll send a code to this number via SMS to verify your
//                   phone.
//                 </p>
//               </div>

//               <div className="mt-auto space-y-3">
//                 <button className="w-full bg-[#25D366] text-white py-3 rounded-full font-medium text-sm shadow-lg">
//                   OK
//                 </button>
//                 <button className="w-full bg-white text-[#25D366] py-3 rounded-full font-medium text-sm border border-[#25D366]">
//                   EDIT
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* Verification Code Step */}
//           {step === "verify" && (
//             <div className="flex-1 flex flex-col px-6 py-8">
//               <div className="text-center mb-8">
//                 <h1 className="text-2xl font-medium text-gray-800 mb-4">
//                   Verifying your number
//                 </h1>
//                 <p className="text-sm text-gray-600 mb-6 leading-relaxed">
//                   Waiting to automatically detect an SMS sent to
//                   <br />
//                   <span className="font-medium text-gray-700">
//                     +1 415 555 0137
//                   </span>
//                 </p>

//                 <div className="flex justify-center gap-2 mb-6">
//                   {[0, 1, 2, 3, 4, 5].map((i) => (
//                     <div
//                       key={i}
//                       className={`w-12 h-14 rounded-lg border-2 flex items-center justify-center text-2xl font-bold transition-all ${
//                         i < verificationCode.length
//                           ? "border-[#25D366] text-[#25D366] bg-green-50"
//                           : "border-gray-300 text-gray-400"
//                       }`}
//                     >
//                       {verificationCode[i] || ""}
//                       {i === verificationCode.length &&
//                         verificationCode.length < 6 && (
//                           <span className="inline-block w-0.5 h-8 bg-[#25D366] animate-pulse"></span>
//                         )}
//                     </div>
//                   ))}
//                 </div>

//                 <p className="text-xs text-gray-500">Enter 6-digit code</p>
//               </div>

//               <div className="mt-auto text-center space-y-3">
//                 <button className="text-[#25D366] font-medium text-sm">
//                   Didn&rsquo;t receive code?
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* Success Step */}
//           {step === "success" && (
//             <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
//               <div className="text-center">
//                 <div className="w-24 h-24 mx-auto mb-6 bg-[#25D366] rounded-full flex items-center justify-center animate-scale-in">
//                   <CheckCircle2 className="w-14 h-14 text-white" />
//                 </div>
//                 <h1 className="text-2xl font-medium text-gray-800 mb-3">
//                   Verification Successful!
//                 </h1>
//                 <p className="text-sm text-gray-600 leading-relaxed">
//                   Your phone number has been verified successfully.
//                 </p>
//               </div>
//             </div>
//           )}
//         </div>
//       </PhoneMockup>

//       {/* Decorative Glow Effects */}
//       <div className="absolute -top-8 -right-8 w-40 h-40 bg-[#25D366] rounded-full blur-3xl opacity-20"></div>
//       <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-[#075E54] rounded-full blur-3xl opacity-20"></div>

//       <style jsx>{`
//         @keyframes scale-in {
//           0% {
//             transform: scale(0);
//           }
//           50% {
//             transform: scale(1.1);
//           }
//           100% {
//             transform: scale(1);
//           }
//         }
//         .animate-scale-in {
//           animation: scale-in 0.5s ease-out;
//         }
//       `}</style>
//     </div>
//   );
// };

// "use client";

// import { useEffect, useRef, useState } from "react";
// import { CheckCircle2, MessageSquare, Phone } from "lucide-react";
// import { PhoneMockup } from "./PhoneMockup";

// export const WhatsAppVerification = () => {
//   const [step, setStep] = useState<"phone" | "confirm" | "verify" | "success">(
//     "phone"
//   );
//   const [phoneNumber, setPhoneNumber] = useState("");
//   const [verificationCode, setVerificationCode] = useState("");
//   const [resendTimer, setResendTimer] = useState(120);
//   const [resendActive, setResendActive] = useState(false);
//   const [showCallOption, setShowCallOption] = useState(false);
//   const [banner, setBanner] = useState<string | null>(null);
//   const [autoFillStarted, setAutoFillStarted] = useState(false);

//   const timersRef = useRef<number[]>([]);
//   const intervalsRef = useRef<number[]>([]);

//   const clearTimers = () => {
//     timersRef.current.forEach((t) => clearTimeout(t));
//     timersRef.current = [];
//   };
//   const clearIntervals = () => {
//     intervalsRef.current.forEach((i) => clearInterval(i));
//     intervalsRef.current = [];
//   };
//   const pushTimer = (id: number) => timersRef.current.push(id);
//   const pushInterval = (id: number) => intervalsRef.current.push(id);

//   const formatTime = (s: number) => {
//     const m = Math.floor(s / 60)
//       .toString()
//       .padStart(1, "0");
//     const sec = Math.floor(s % 60)
//       .toString()
//       .padStart(2, "0");
//     return `${m}:${sec}`;
//   };

//   useEffect(() => {
//     // reset timers on step change and cleanup on unmount
//     clearTimers();
//     clearIntervals();

//     if (step === "phone") {
//       const phone = "415 555 0137";
//       let idx = 0;
//       const iv = window.setInterval(() => {
//         if (idx <= phone.length) {
//           setPhoneNumber(phone.slice(0, idx));
//           idx++;
//         } else {
//           clearInterval(iv);
//           pushTimer(window.setTimeout(() => setStep("confirm"), 800));
//         }
//       }, 100);
//       pushInterval(iv);
//     } else if (step === "verify") {
//       // reset verify step state
//       setVerificationCode("");
//       setResendTimer(120);
//       setResendActive(false);
//       setShowCallOption(false);
//       setBanner(null);
//       setAutoFillStarted(false);

//       // countdown
//       const iv = window.setInterval(() => {
//         setResendTimer((prev) => {
//           if (prev <= 1) {
//             clearInterval(iv);
//             setResendActive(true);
//             return 0;
//           }
//           return prev - 1;
//         });
//       }, 1000);
//       pushInterval(iv);

//       // reveal call option
//       pushTimer(window.setTimeout(() => setShowCallOption(true), 15000));

//       // simulate incoming SMS
//       pushTimer(
//         window.setTimeout(() => {
//           setBanner("SMS code received");
//           pushTimer(window.setTimeout(() => setBanner(null), 1800));
//           if (!autoFillStarted) startAutoFill();
//         }, 4000)
//       );
//     } else if (step === "success") {
//       pushTimer(
//         window.setTimeout(() => {
//           setPhoneNumber("");
//           setVerificationCode("");
//           setStep("phone");
//         }, 4000)
//       );
//     }

//     return () => {
//       clearTimers();
//       clearIntervals();
//     };
//   }, [step]);

//   const startAutoFill = () => {
//     setAutoFillStarted(true);
//     const code = "482916";
//     let idx = 0;
//     const iv = window.setInterval(() => {
//       if (idx <= code.length) {
//         setVerificationCode(code.slice(0, idx));
//         idx++;
//       } else {
//         clearInterval(iv);
//         pushTimer(window.setTimeout(() => setStep("success"), 600));
//       }
//     }, 250);
//     pushInterval(iv);
//   };

//   const handleResend = () => {
//     if (!resendActive) return;
//     setResendActive(false);
//     setResendTimer(120);
//     const iv = window.setInterval(() => {
//       setResendTimer((prev) => {
//         if (prev <= 1) {
//           clearInterval(iv);
//           setResendActive(true);
//           return 0;
//         }
//         return prev - 1;
//       });
//     }, 1000);
//     pushInterval(iv);
//     setBanner("SMS resent");
//     pushTimer(window.setTimeout(() => setBanner(null), 1500));
//     pushTimer(
//       window.setTimeout(() => !autoFillStarted && startAutoFill(), 2000)
//     );
//   };

//   const handleCallMeInstead = () => {
//     if (!showCallOption) return;
//     setBanner("You will receive a call");
//     pushTimer(window.setTimeout(() => setBanner(null), 1700));
//     pushTimer(
//       window.setTimeout(() => !autoFillStarted && startAutoFill(), 2200)
//     );
//   };

//   return (
//     <div>
//       <PhoneMockup>
//         <div className="flex flex-col h-full bg-white font-sans">
//           {/* Header */}
//           <div className="bg-[#075E54] pt-12 pb-4 px-4 shrink-0">
//             <div className="flex items-center justify-between text-white">
//               <span className="text-lg font-medium">Verify your number</span>
//               <svg
//                 className="w-5 h-5 opacity-80"
//                 fill="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
//               </svg>
//             </div>
//           </div>

//           <div className="flex-1 flex flex-col overflow-y-auto">
//             {/* STEP: PHONE ENTRY */}
//             {step === "phone" && (
//               <div className="p-6 flex flex-col h-full">
//                 <p className="text-sm text-center text-gray-600 mb-8 px-2">
//                   WhatsApp will need to verify your phone number.
//                 </p>
//                 <div className="mx-auto w-full max-w-[240px] border-b-2 border-[#00a884] pb-1 mb-8">
//                   <div className="text-center text-[#00a884] text-sm mb-1">
//                     United States
//                   </div>
//                   <div className="flex items-center text-xl">
//                     <span className="text-gray-400 mr-4">+ 1</span>
//                     <span className="flex-1 text-gray-800 tabular-nums">
//                       {phoneNumber}
//                       <span className="inline-block w-[2px] h-6 bg-[#00a884] animate-pulse align-middle ml-1" />
//                     </span>
//                   </div>
//                 </div>
//                 <div className="mt-auto flex justify-center pb-8">
//                   <button className="bg-[#00a884] text-white px-6 py-2 rounded shadow-md font-medium text-sm tracking-wide uppercase">
//                     Next
//                   </button>
//                 </div>
//               </div>
//             )}

//             {/* STEP: CONFIRMATION MODAL */}
//             {step === "confirm" && (
//               <div className="absolute inset-0 z-10 bg-black/20 flex items-center justify-center p-6">
//                 <div className="bg-white rounded-sm shadow-xl p-6 w-full max-w-[280px]">
//                   <p className="text-gray-700 text-sm mb-6 leading-relaxed">
//                     You entered the phone number:
//                     <br />
//                     <span className="font-bold block mt-2 text-base">
//                       +1 415 555 0137
//                     </span>
//                     <br />
//                     Is this OK, or would you like to edit the number?
//                   </p>
//                   <div className="flex justify-end gap-6 text-[#00a884] font-bold text-sm">
//                     <button
//                       onClick={() => setStep("phone")}
//                       className="uppercase"
//                     >
//                       Edit
//                     </button>
//                     <button
//                       onClick={() => setStep("verify")}
//                       className="uppercase"
//                     >
//                       Ok
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* STEP: OTP VERIFICATION */}
//             {step === "verify" && (
//               <div className="p-6 flex flex-col items-center relative w-full">
//                 {banner && (
//                   <div className="absolute -top-1 left-4 right-4 bg-[#e7f8ef] text-[#1f7a53] text-xs px-3 py-2 rounded shadow-sm">
//                     {banner}
//                   </div>
//                 )}
//                 <h2 className="text-[#00a884] font-medium mb-4">
//                   Verifying +1 415 555 0137
//                 </h2>
//                 <p className="text-xs text-center text-gray-500 mb-8 leading-relaxed px-4">
//                   Waiting to automatically detect an SMS sent to your number.{" "}
//                   <span className="text-blue-500">Wrong number?</span>
//                 </p>
//                 <div className="flex gap-4 border-b-2 border-gray-200 pb-2 mb-2 w-32 justify-center">
//                   <span className="text-2xl tracking-[0.5em] font-medium text-gray-700 tabular-nums">
//                     {verificationCode}
//                   </span>
//                   {verificationCode.length < 6 && (
//                     <span className="w-[2px] h-8 bg-[#00a884] animate-pulse" />
//                   )}
//                 </div>
//                 <p className="text-xs text-gray-400 mb-10">
//                   Enter 6-digit code
//                 </p>
//                 <div className="w-full space-y-3">
//                   <button
//                     disabled={!resendActive}
//                     onClick={handleResend}
//                     className={`w-full flex items-center gap-3 text-sm px-2 py-2 rounded ${
//                       resendActive ? "text-[#00a884]" : "text-gray-500"
//                     }`}
//                   >
//                     <span className="w-5 h-5 inline-flex items-center justify-center">
//                       <MessageSquare className="w-4 h-4" />
//                     </span>
//                     <span>Resend SMS</span>
//                     <span className="ml-auto text-xs opacity-60">
//                       {resendActive ? "" : formatTime(resendTimer)}
//                     </span>
//                   </button>

//                   {showCallOption && (
//                     <button
//                       onClick={handleCallMeInstead}
//                       className="w-full flex items-center gap-3 text-sm px-2 py-2 rounded text-[#00a884]"
//                     >
//                       <span className="w-5 h-5 inline-flex items-center justify-center">
//                         <Phone className="w-4 h-4" />
//                       </span>
//                       <span>Call me instead</span>
//                     </button>
//                   )}
//                 </div>
//               </div>
//             )}

//             {/* STEP: SUCCESS */}
//             {step === "success" && (
//               <div className="flex-1 flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-500">
//                 <div className="w-20 h-20 bg-[#00a884] rounded-full flex items-center justify-center mb-6 shadow-lg">
//                   <CheckCircle2 className="w-12 h-12 text-white" />
//                 </div>
//                 <h1 className="text-xl font-semibold text-gray-800 mb-2 text-center">
//                   Verification complete
//                 </h1>
//                 <p className="text-sm text-gray-500 text-center leading-relaxed">
//                   Your number has been successfully linked to WhatsApp.
//                 </p>
//               </div>
//             )}
//           </div>
//         </div>
//       </PhoneMockup>

//       {/* Background Orbs */}
//       <div className="absolute top-1/4 -right-20 w-64 h-64 bg-green-200 rounded-full blur-3xl opacity-30 -z-10" />
//       <div className="absolute bottom-1/4 -left-20 w-64 h-64 bg-teal-200 rounded-full blur-3xl opacity-30 -z-10" />
//     </div>
//   );
// };

"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, MessageSquare, Phone } from "lucide-react";
import { PhoneMockup } from "./PhoneMockup";

export const WhatsAppVerification = () => {
  const [step, setStep] = useState<"phone" | "confirm" | "verify" | "success">(
    "phone"
  );
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [resendTimer, setResendTimer] = useState(120);
  const [resendActive, setResendActive] = useState(false);
  const [showCallOption, setShowCallOption] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [autoFillStarted, setAutoFillStarted] = useState(false);

  const timersRef = useRef<number[]>([]);
  const intervalsRef = useRef<number[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };
  const clearIntervals = () => {
    intervalsRef.current.forEach((i) => clearInterval(i));
    intervalsRef.current = [];
  };
  const pushTimer = (id: number) => timersRef.current.push(id);
  const pushInterval = (id: number) => intervalsRef.current.push(id);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(1, "0");
    const sec = Math.floor(s % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${sec}`;
  };

  useEffect(() => {
    clearTimers();
    clearIntervals();

    if (step === "phone") {
      const phone = "415 555 0137";
      let idx = 0;
      const iv = window.setInterval(() => {
        if (idx <= phone.length) {
          setPhoneNumber(phone.slice(0, idx));
          idx++;
        } else {
          clearInterval(iv);
          pushTimer(window.setTimeout(() => setStep("confirm"), 800));
        }
      }, 100);
      pushInterval(iv);
    } else if (step === "confirm") {
      // Automatically proceed to verification after showing the modal briefly
      pushTimer(window.setTimeout(() => setStep("verify"), 2000));
    } else if (step === "verify") {
      // Reset verify step state
      setVerificationCode("");
      setResendTimer(120);
      setResendActive(false);
      setShowCallOption(false);
      setBanner(null);
      setAutoFillStarted(false);

      // Countdown timer for resend
      const iv = window.setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(iv);
            setResendActive(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      pushInterval(iv);

      // Show "Call me" option after 15 seconds
      pushTimer(window.setTimeout(() => setShowCallOption(true), 15000));

      // Simulate incoming SMS after 4 seconds
      pushTimer(
        window.setTimeout(() => {
          setBanner("SMS code received");
          pushTimer(window.setTimeout(() => setBanner(null), 1800));
          if (!autoFillStarted) startAutoFill();
        }, 4000)
      );
    } else if (step === "success") {
      // After success screen, reset and loop back to start after 4 seconds
      pushTimer(
        window.setTimeout(() => {
          setPhoneNumber("");
          setVerificationCode("");
          setStep("phone");
        }, 4000)
      );
    }

    return () => {
      clearTimers();
      clearIntervals();
    };
  }, [step]);

  const startAutoFill = () => {
    setAutoFillStarted(true);
    const code = "482916";
    let idx = 0;
    const iv = window.setInterval(() => {
      if (idx <= code.length) {
        setVerificationCode(code.slice(0, idx));
        idx++;
      } else {
        clearInterval(iv);
        pushTimer(window.setTimeout(() => setStep("success"), 600));
      }
    }, 250);
    pushInterval(iv);
  };

  const handleResend = () => {
    if (!resendActive) return;
    setResendActive(false);
    setResendTimer(120);
    const iv = window.setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(iv);
          setResendActive(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    pushInterval(iv);
    setBanner("SMS resent");
    pushTimer(window.setTimeout(() => setBanner(null), 1500));
    pushTimer(
      window.setTimeout(() => !autoFillStarted && startAutoFill(), 2000)
    );
  };

  const handleCallMeInstead = () => {
    if (!showCallOption) return;
    setBanner("You will receive a call");
    pushTimer(window.setTimeout(() => setBanner(null), 1700));
    pushTimer(
      window.setTimeout(() => !autoFillStarted && startAutoFill(), 2200)
    );
  };

  return (
    <div>
      <PhoneMockup>
        <div className="flex flex-col h-full bg-white font-sans">
          {/* Header */}
          <div className="bg-[#075E54] pt-12 pb-4 px-4 shrink-0">
            <div className="flex items-center justify-between text-white">
              <span className="text-lg font-medium">Verify your number</span>
              <svg
                className="w-5 h-5 opacity-80"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-y-auto">
            {/* STEP: PHONE ENTRY */}
            {step === "phone" && (
              <div className="p-6 flex flex-col h-full">
                <p className="text-sm text-center text-gray-600 mb-8 px-2">
                  WhatsApp will need to verify your phone number.
                </p>
                <div className="mx-auto w-full max-w-[240px] border-b-2 border-[#00a884] pb-1 mb-8">
                  <div className="text-center text-[#00a884] text-sm mb-1">
                    United States
                  </div>
                  <div className="flex items-center text-xl">
                    <span className="text-gray-400 mr-4">+ 1</span>
                    <span className="flex-1 text-gray-800 tabular-nums">
                      {phoneNumber}
                      <span className="inline-block w-[2px] h-6 bg-[#00a884] animate-pulse align-middle ml-1" />
                    </span>
                  </div>
                </div>
                <div className="mt-auto flex justify-center pb-8">
                  <button className="bg-[#00a884] text-white px-6 py-2 rounded shadow-md font-medium text-sm tracking-wide uppercase">
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* STEP: CONFIRMATION MODAL (auto-confirms) */}
            {step === "confirm" && (
              <div className="absolute inset-0 z-10 bg-black/20 flex items-center justify-center p-6">
                <div className="bg-white rounded-sm shadow-xl p-6 w-full max-w-[280px]">
                  <p className="text-gray-700 text-sm mb-6 leading-relaxed">
                    You entered the phone number:
                    <br />
                    <span className="font-bold block mt-2 text-base">
                      +1 415 555 0137
                    </span>
                    <br />
                    Is this OK, or would you like to edit the number?
                  </p>
                  <div className="flex justify-end gap-6 text-[#00a884] font-bold text-sm">
                    <button
                      onClick={() => setStep("phone")}
                      className="uppercase"
                    >
                      Edit
                    </button>
                    <button className="uppercase text-[#00a884]  cursor-default">
                      Ok
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP: OTP VERIFICATION */}
            {step === "verify" && (
              <div className="p-6 flex flex-col items-center relative w-full">
                {banner && (
                  <div className="absolute -top-1 left-4 right-4 bg-[#e7f8ef] text-[#1f7a53] text-xs px-3 py-2 rounded shadow-sm">
                    {banner}
                  </div>
                )}
                <h2 className="text-[#00a884] font-medium mb-4">
                  Verifying +1 415 555 0137
                </h2>
                <p className="text-xs text-center text-gray-500 mb-8 leading-relaxed px-4">
                  Waiting to automatically detect an SMS sent to your number.{" "}
                  <span className="text-blue-500">Wrong number?</span>
                </p>
                <div className="flex gap-4 border-b-2 border-gray-200 pb-2 mb-2 w-32 justify-center">
                  <span className="text-2xl tracking-[0.5em] font-medium text-gray-700 tabular-nums">
                    {verificationCode}
                  </span>
                  {verificationCode.length < 6 && (
                    <span className="w-[2px] h-8 bg-[#00a884] animate-pulse" />
                  )}
                </div>
                <p className="text-xs text-gray-400 mb-10">
                  Enter 6-digit code
                </p>
                <div className="w-full space-y-3">
                  <button
                    disabled={!resendActive}
                    onClick={handleResend}
                    className={`w-full flex items-center gap-3 text-sm px-2 py-2 rounded ${
                      resendActive ? "text-[#00a884]" : "text-gray-500"
                    }`}
                  >
                    <span className="w-5 h-5 inline-flex items-center justify-center">
                      <MessageSquare className="w-4 h-4" />
                    </span>
                    <span>Resend SMS</span>
                    <span className="ml-auto text-xs opacity-60">
                      {resendActive ? "" : formatTime(resendTimer)}
                    </span>
                  </button>

                  {showCallOption && (
                    <button
                      onClick={handleCallMeInstead}
                      className="w-full flex items-center gap-3 text-sm px-2 py-2 rounded text-[#00a884]"
                    >
                      <span className="w-5 h-5 inline-flex items-center justify-center">
                        <Phone className="w-4 h-4" />
                      </span>
                      <span>Call me instead</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* STEP: SUCCESS */}
            {step === "success" && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-[#00a884] rounded-full flex items-center justify-center mb-6 shadow-lg">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-gray-800 mb-2 text-center">
                  Verification complete
                </h1>
                <p className="text-sm text-gray-500 text-center leading-relaxed">
                  Your number has been successfully linked to WhatsApp.
                </p>
              </div>
            )}
          </div>
        </div>
      </PhoneMockup>

      {/* Background Orbs */}
      <div className="absolute top-1/4 -right-20 w-64 h-64 bg-green-200 rounded-full blur-3xl opacity-30 -z-10" />
      <div className="absolute bottom-1/4 -left-20 w-64 h-64 bg-teal-200 rounded-full blur-3xl opacity-30 -z-10" />
    </div>
  );
};
