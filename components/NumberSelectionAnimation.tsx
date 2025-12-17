"use client";

import { useEffect, useState } from "react";
import { Check, Globe, Search } from "lucide-react";
import { PhoneMockup } from "./PhoneMockup";

const countries = [
  { code: "+1", name: "United States", flag: "🇺🇸" },
  { code: "+44", name: "United Kingdom", flag: "🇬🇧" },
  { code: "+91", name: "India", flag: "🇮🇳" },
  { code: "+49", name: "Germany", flag: "🇩🇪" },
];

const numbers = ["+1 202 XXX 7842", "+1 415 XXX 2291", "+1 646 XXX 5130"];

type Phase = "browsing" | "selecting" | "selected";

export const NumberSelectionAnimation = () => {
  const [phase, setPhase] = useState<Phase>("browsing");
  const [selectedCountry, setSelectedCountry] = useState(0);
  const [selectedNumber, setSelectedNumber] = useState(-1);
  const [highlightedCountry, setHighlightedCountry] = useState(-1);

  useEffect(() => {
    let timeout: number;

    if (phase === "browsing") {
      // Animate through countries
      let i = 0;
      const animateCountries = () => {
        if (i < countries.length) {
          setHighlightedCountry(i);
          i++;
          timeout = window.setTimeout(animateCountries, 400);
        } else {
          setSelectedCountry(0); // Select United States
          setPhase("selecting");
        }
      };
      timeout = window.setTimeout(animateCountries, 500);
    } else if (phase === "selecting") {
      // Animate through numbers
      let n = 0;
      const animateNumbers = () => {
        if (n < numbers.length) {
          setSelectedNumber(n);
          n++;
          timeout = window.setTimeout(animateNumbers, 500);
        } else {
          setSelectedNumber(1);
          setPhase("selected");
        }
      };
      timeout = window.setTimeout(animateNumbers, 600);
    } else if (phase === "selected") {
      timeout = window.setTimeout(() => {
        setPhase("browsing");
        setHighlightedCountry(-1);
        setSelectedNumber(-1);
      }, 2500);
    }

    return () => clearTimeout(timeout);
  }, [phase]);

  return (
    <PhoneMockup className="animate-float">
      <div className="h-full flex flex-col bg-background">
        {/* App Header */}
        <div className="bg-primary pt-10 pb-4 px-4">
          <p className="text-primary-foreground text-sm font-semibold text-center">
            Select Number
          </p>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b">
          <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Search country...
            </span>
          </div>
        </div>

        {/* Country List */}
        <div className="flex-1 overflow-hidden">
          <p className="text-[10px] text-muted-foreground px-3 py-2 bg-muted/50">
            POPULAR COUNTRIES
          </p>
          <div className="divide-y">
            {countries.map((country, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-3 py-2.5 transition-all duration-200 ${
                  highlightedCountry === i ||
                  (phase !== "browsing" && selectedCountry === i)
                    ? "bg-primary/10"
                    : ""
                }`}
              >
                <span className="text-xl">{country.flag}</span>
                <div className="flex-1">
                  <p className="text-xs font-medium text-foreground">
                    {country.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {country.code}
                  </p>
                </div>
                {phase !== "browsing" && selectedCountry === i && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </div>
            ))}
          </div>

          {/* Available Numbers */}
          {phase !== "browsing" && (
            <div className="mt-2 animate-fade-in">
              <p className="text-[10px] text-muted-foreground px-3 py-2 bg-muted/50">
                AVAILABLE NUMBERS
              </p>
              <div className="divide-y">
                {numbers.map((num, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-3 py-2.5 transition-all duration-200 ${
                      selectedNumber === i ? "bg-success/10" : ""
                    }`}
                  >
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <p className="text-xs font-mono text-foreground flex-1">
                      {num}
                    </p>
                    {selectedNumber === i && phase === "selected" && (
                      <div className="bg-success text-success-foreground text-[10px] px-2 py-0.5 rounded-full">
                        Reserved
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Status */}
        <div className="p-3 border-t bg-muted/30">
          <div
            className={`text-center text-xs font-medium py-2 rounded-lg transition-all ${
              phase === "selected"
                ? "bg-success text-success-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {phase === "selected" ? "✓ Number Reserved" : "Select a number..."}
          </div>
        </div>
      </div>
    </PhoneMockup>
  );
};
