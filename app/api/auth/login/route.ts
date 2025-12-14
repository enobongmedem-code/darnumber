import { NextRequest } from "next/server";
import { json, error } from "@/lib/server/utils/response";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body || {};
    if (!email || !password) return error("Email and password required", 400);
    // This route is superseded by NextAuth Credentials provider
    return json(
      {
        ok: false,
        message: "Use /api/auth/[...nextauth] with Credentials provider.",
      },
      { status: 410 }
    );
  } catch (e) {
    return error("Invalid JSON payload", 400);
  }
}
