import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { isAdmin } from "@/app/lib/checkRole";

export const DELETE = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const client = await clerkClient();

    const { id } = await params;
    
    // Empêcher un admin de se supprimer lui-même
    if (id === userId) {
      return NextResponse.json({ 
        error: "Vous ne pouvez pas supprimer votre propre compte" 
      }, { status: 400 });
    }

    // Supprimer l'utilisateur
    await client.users.deleteUser(id);

    return NextResponse.json({ 
      success: true, 
      message: "Utilisateur supprimé avec succès" 
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
};