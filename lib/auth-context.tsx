"use client";

import { createContext, useContext, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SessionProvider, signIn, signOut, useSession } from "next-auth/react";

type User = {
  id: string;
  email: string;
  name?: string | null;
  role?: string | null;
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const publicRoutes = [
  "/login",
  "/signup",
  "/forget-password",
  "/reset-password",
];

function InnerAuthProvider({ children }: { children: React.ReactNode }) {
  const { data, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const user = (
    data?.user
      ? {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.name ?? null,
          role: (data.user as any).role ?? null,
        }
      : null
  ) as User | null;

  const loading = status === "loading";

  // Simple redirect logic: if not authed and route is protected, go to login
  if (!loading) {
    const isPublic = publicRoutes.includes(pathname);
    if (!user && !isPublic) router.push("/login");
    if (user && isPublic) router.push("/dashboard");
  }

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      login: async (email: string, password: string) => {
        const res = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });
        if (!res || res.error) throw new Error(res?.error || "Login failed");
      },
      logout: async () => {
        await signOut({ redirect: false });
        router.push("/login");
      },
      refreshUser: async () => {
        // No-op with JWT session; could revalidate user endpoints here
      },
    }),
    [user, loading, router]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <InnerAuthProvider>{children}</InnerAuthProvider>
    </SessionProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
