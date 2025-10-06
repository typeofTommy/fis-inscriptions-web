import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/db/inscriptionsDB";
import { getDbTables } from "@/app/lib/getDbTables";
import { eq } from "drizzle-orm";
import { requireSuperAdmin } from "@/app/lib/checkRole";

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) => {
  try {
    await requireSuperAdmin();

    const { code } = await params;
    const { organizations } = getDbTables();

    const org = await db
      .select()
      .from(organizations)
      .where(eq(organizations.code, code))
      .limit(1);

    if (!org[0]) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    return NextResponse.json(org[0]);
  } catch (error) {
    if (error instanceof Error && error.message === "Super admin access required") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error fetching organization:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
};

export const PATCH = async (
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) => {
  try {
    await requireSuperAdmin();

    const { code } = await params;
    const { organizations } = getDbTables();

    const body = await req.json();

    const updated = await db
      .update(organizations)
      .set({
        name: body.name,
        country: body.country,
        logo: body.logo,
        baseUrl: body.baseUrl,
        fromEmail: body.fromEmail,
        emails: body.emails,
        contacts: body.contacts,
        emailTemplates: body.emailTemplates,
        updatedAt: new Date(),
      })
      .where(eq(organizations.code, code))
      .returning();

    if (!updated[0]) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    if (error instanceof Error && error.message === "Super admin access required") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error updating organization:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
};
