// app/api/receiveData/route.js
import { NextResponse } from "next/server";

let latestData = null; // Stored in memory temporarily

export async function POST(request) {
  const body = await request.json();
  console.log("📥 Data received from ESP32:", body);
  latestData = body;

  return NextResponse.json({ message: "Data received successfully!" });
}

export async function GET() {
  return NextResponse.json({ data: latestData });
}
