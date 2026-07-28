import { NextResponse } from "next/server";
import { sql } from "../../../lib/db";
import { getSessionUserId } from "../../../lib/auth";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ loggedIn: false });
  }

  const rows = await sql`SELECT email FROM users WHERE id = ${userId}`;
  return NextResponse.json({ loggedIn: true, email: rows[0]?.email });
}
