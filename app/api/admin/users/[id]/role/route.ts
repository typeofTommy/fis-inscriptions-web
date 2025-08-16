import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

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
    
    // Vérifier que l'utilisateur connecté est admin
    const currentUser = await client.users.getUser(userId);
    if (currentUser.publicMetadata.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { role } = await req.json();
    
    if (!role || !["admin", "user"].includes(role)) {
      return NextResponse.json({ 
        error: "Role must be 'admin' or 'user'" 
      }, { status: 400 });
    }

    // Empêcher un admin de se rétrograder lui-même
    if (id === userId && role !== "admin") {
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