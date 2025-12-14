import { NextRequest } from "next/server";
import { error, json } from "@/lib/server/utils/response";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body || {};
    if (!email) return error("Email required", 400);
    // TODO: Implement reset flow using notification service
    return json({ ok: true, message: "Password reset request received" });
  } catch (e) {
    return error("Invalid JSON payload", 400);
  }
}
