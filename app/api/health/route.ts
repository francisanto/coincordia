import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET() {
  let mongoHealthy = false;

  try {
    // Try to ping MongoDB
    if (mongoose.connection.readyState === 1) {
      mongoHealthy = true;
    } else {
      await mongoose.connect(process.env.MONGO_URI as string, {
        dbName: process.env.MONGO_DB || "concordia",
      });
      mongoHealthy = true;
    }
  } catch (err) {
    mongoHealthy = false;
  }

  return NextResponse.json(
    {
      status: mongoHealthy ? "OK" : "UNHEALTHY",
      timestamp: new Date().toISOString(),
      services: {
        mongodb: mongoHealthy,
      },
    },
    { status: mongoHealthy ? 200 : 503 }
  );
}
