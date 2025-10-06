import { NextResponse } from "next/server";
import { db } from "@/app/db/inscriptionsDB";
import { getDbTables } from "@/app/lib/getDbTables";
import { requireSuperAdmin } from "@/app/lib/checkRole";

export const GET = async () => {
  try {
    await requireSuperAdmin();

    const { organizations } = getDbTables();

    const allOrgs = await db.select().from(organizations);

    return NextResponse.json(allOrgs);
  } catch (error) {
    if (error instanceof Error && error.message === "Super admin access required") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error fetching organizations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
};
