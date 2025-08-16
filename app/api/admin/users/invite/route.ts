import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export const POST = async (req: NextRequest) => {
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

    const { email } = await req.json();
    
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Créer une invitation
    const invitation = await client.invitations.createInvitation({
      emailAddress: email,
      redirectUrl: `${process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || `${req.nextUrl.origin}/sign-up`}`,
    });

    return NextResponse.json({ 
      success: true, 
      invitationId: invitation.id,
      email: invitation.emailAddress 
    });
  } catch (error) {
    console.error("Error creating invitation:", error);
    
    // Gestion des erreurs spécifiques de Clerk
    if (error instanceof Error) {
      if (error.message.includes("already exists")) {
        return NextResponse.json({ 
          error: "Un utilisateur avec cet email existe déjà" 
        }, { status: 400 });
      }
      if (error.message.includes("invalid email")) {
        return NextResponse.json({ 
          error: "Format d'email invalide" 
        }, { status: 400 });
      }
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
};