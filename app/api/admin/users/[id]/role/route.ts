import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getCurrentUserRole } from "@/app/lib/checkRole";

export const PATCH = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clerkClient();
    const currentUserRole = await getCurrentUserRole();

    // Only admins and super-admins can change roles
    if (currentUserRole !== "admin" && currentUserRole !== "super-admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { role } = await req.json();

    if (!role || !["super-admin", "admin", "user"].includes(role)) {
      return NextResponse.json({
        error: "Role must be 'super-admin', 'admin' or 'user'"
      }, { status: 400 });
    }

    // Only super-admins can assign super-admin role
    if (role === "super-admin" && currentUserRole !== "super-admin") {
      return NextResponse.json({
        error: "Only super-admins can assign super-admin role"
      }, { status: 403 });
    }

    // Prevent super-admin from demoting themselves
    if (id === userId && currentUserRole === "super-admin" && role !== "super-admin") {
      return NextResponse.json({
        error: "Vous ne pouvez pas modifier votre propre rôle de super-administrateur"
      }, { status: 400 });
    }

    // Prevent admin from demoting themselves
    if (id === userId && currentUserRole === "admin" && role !== "admin" && role !== "super-admin") {
      return NextResponse.json({
        error: "Vous ne pouvez pas modifier votre propre rôle d'administrateur"
      }, { status: 400 });
    }

    // Mettre à jour le rôle de l'utilisateur
    const updatedUser = await client.users.updateUserMetadata(id, {
      publicMetadata: { role }
    });

    return NextResponse.json({ 
      success: true, 
      userId: updatedUser.id,
      role: updatedUser.publicMetadata.role 
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
};