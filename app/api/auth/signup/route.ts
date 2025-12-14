import { NextRequest } from "next/server";
import { json, error } from "@/lib/server/utils/response";
import { createUser } from "@/lib/server/services/auth.service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, userName, phone, country, referralCode } =
      body || {};
    if (!email || !password || !userName)
      return error("Email, password and userName required", 400);
    const user = await createUser({
      email,
      password,
      userName,
      phone,
      country,
      referralCode,
    });
    return json({ ok: true, user });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid JSON payload";
    const status = msg.includes("already") ? 409 : 400;
    return error(msg, status);
  }
}
