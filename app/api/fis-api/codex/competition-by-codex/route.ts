import {NextRequest, NextResponse} from "next/server";
import {getFisToken} from "@/app/lib/fisAuth";

export async function GET(req: NextRequest) {
  const codex = req.nextUrl.searchParams.get("codex");
  if (!codex) {
    return NextResponse.json({error: "Missing codex"}, {status: 400});
  }

  try {
    const {access_token} = await getFisToken();
    if (!access_token) {
      return NextResponse.json({error: "Missing access token"}, {status: 400});
    }
    const fisRes = await fetch(
      `https://api.fis-ski.com/competitions/find-by-codex/AL/${codex}?season=2025`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: "application/json",
          "X-CSRF-TOKEN": "",
        },
      }
    );

    if (!fisRes.ok) {
      return NextResponse.json(
        {error: "FIS API error"},
        {status: fisRes.status}
      );
    }

    const data = await fisRes.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error("FIS API proxy error:", e);
    return NextResponse.json({error: "Internal error"}, {status: 500});
  }
}
