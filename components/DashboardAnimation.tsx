import { useEffect, useState } from "react";
import { Bell, Home, MessageSquare, Settings, User } from "lucide-react";
import { PhoneMockup } from "./PhoneMockup";
import { SiWhatsapp, SiTelegram, SiGoogle } from "react-icons/si";

const recentVerifications = [
  {
    service: "WhatsApp",
    status: "success",
    time: "2m ago",
    Icon: SiWhatsapp,
    color: "#25D366",
  },
  {
    service: "Telegram",
    status: "success",
    time: "15m ago",
    Icon: SiTelegram,
    color: "#26A5E4",
  },
  {
    service: "Google",
    status: "pending",
    time: "Just now",
    Icon: SiGoogle,
    color: "#4285F4",
  },
];

export const DashboardAnimation = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [balance, setBalance] = useState(0);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Animate balance counting
    let current = 0;
    const target = 2450;
    const step = Math.ceil(target / 30);
    const interval = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(interval);
      }
      setBalance(current);
    }, 50);

    // Show notification after delay
    const notifTimeout = setTimeout(() => {
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 2000);
    }, 2000);

    // Cycle through tabs
    const tabInterval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % 4);
    }, 3000);

    return () => {
      clearInterval(interval);
      clearInterval(tabInterval);
      clearTimeout(notifTimeout);
    };
  }, []);

  return (
    <PhoneMockup className="animate-float">
      <div className="h-full flex flex-col bg-background relative">
        {/* Notification Toast */}
        {showNotification && (
          <div className="absolute top-12 left-3 right-3 bg-success text-success-foreground rounded-lg p-2.5 shadow-lg z-20 animate-scale-in">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-success-foreground/20 flex items-center justify-center text-xs">
                ✓
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-semibold">
                  Verification Complete
                </p>
                <p className="text-[10px] opacity-80">Google code received</p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-primary pt-10 pb-4 px-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-primary-foreground/70 text-[10px]">
                Welcome back
              </p>
              <p className="text-primary-foreground font-semibold text-sm">
                John Doe
              </p>
            </div>
            <div className="relative">
              <Bell className="w-5 h-5 text-primary-foreground" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-destructive rounded-full" />
            </div>
          </div>

          {/* Balance Card */}
          <div className="bg-primary-foreground/10 rounded-xl p-3 backdrop-blur-sm">
            <p className="text-primary-foreground/70 text-[10px]">
              Available Balance
            </p>
            <p className="text-primary-foreground text-2xl font-bold">
              ₦{balance.toLocaleString()}
            </p>
            <div className="flex gap-2 mt-2">
              <button className="flex-1 bg-primary-foreground text-primary text-[10px] font-medium py-1.5 rounded-lg">
                Top Up
              </button>
              <button className="flex-1 bg-primary-foreground/20 text-primary-foreground text-[10px] font-medium py-1.5 rounded-lg">
                History
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 p-3 -mt-2">
          {[
            { label: "Today", value: "12" },
            { label: "Success", value: "98%" },
            { label: "Saved", value: "₦5.2K" },
          ].map((stat, i) => (
            <div key={i} className="bg-card border rounded-lg p-2 text-center">
              <p className="text-foreground font-bold text-sm">{stat.value}</p>
              <p className="text-muted-foreground text-[9px]">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Recent Verifications */}
        <div className="flex-1 px-3">
          <p className="text-[10px] font-semibold text-muted-foreground mb-2">
            RECENT ACTIVITY
          </p>
          <div className="space-y-2">
            {recentVerifications.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-card border rounded-lg p-2.5"
              >
                <span
                  className="inline-flex items-center justify-center w-6 h-6 rounded-md"
                  style={{ backgroundColor: `${item.color}20` }}
                >
                  <item.Icon
                    className="w-4 h-4"
                    style={{ color: item.color }}
                  />
                </span>
                <div className="flex-1">
                  <p className="text-xs font-medium text-foreground">
                    {item.service}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {item.time}
                  </p>
                </div>
                <div
                  className={`text-[9px] px-2 py-0.5 rounded-full ${
                    item.status === "success"
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning"
                  }`}
                >
                  {item.status === "success" ? "Done" : "Pending"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="border-t bg-card px-2 py-2">
          <div className="flex justify-around">
            {[Home, MessageSquare, User, Settings].map((Icon, i) => (
              <button
                key={i}
                className={`p-2 rounded-lg transition-colors ${
                  activeTab === i
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </PhoneMockup>
  );
};
