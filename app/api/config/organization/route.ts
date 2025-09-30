import {NextResponse} from "next/server";
import {db} from "@/app/db/inscriptionsDB";
import {getDbTables} from "@/app/lib/getDbTables";
import {eq} from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code") || "FFS"; // Default to FFS for Phase 1

    const { organizations } = getDbTables();

    const organization = await db
      .select()
      .from(organizations)
      .where(eq(organizations.code, code))
      .limit(1);

    if (!organization || organization.length === 0) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(organization[0]);
  } catch (error) {
    console.error("Error fetching organization config:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}