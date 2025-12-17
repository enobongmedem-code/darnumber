import Link from "next/link";
import { MessageSquare } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold tracking-tight">
                  DarNumber
                </span>
              </Link>
            </div>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
