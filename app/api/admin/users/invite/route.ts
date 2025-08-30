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

    // Vérifier s'il existe déjà des invitations pour cet email
    // Récupérer toutes les invitations pour filtrer manuellement par email et statut
    const allInvitations = await client.invitations.getInvitationList();
    
    const existingInvitation = allInvitations.data.find(
      inv => inv.emailAddress.toLowerCase() === email.toLowerCase() && 
             (inv.status === 'pending' || inv.status === 'expired')
    );

    if (existingInvitation) {
      // Si l'invitation est expirée, la révoquer et créer une nouvelle
      if (existingInvitation.status === 'expired') {
        console.log(`Revoking expired invitation ${existingInvitation.id} for ${email}`);
        await client.invitations.revokeInvitation(existingInvitation.id);
      } else if (existingInvitation.status === 'pending') {
        return NextResponse.json({ 
          error: `Une invitation est déjà en attente pour ${email}. Vérifiez la boîte mail ou contactez l'administrateur pour révoquer l'ancienne invitation.` 
        }, { status: 400 });
      }
    }

    // Créer une invitation avec ignoreExisting pour gérer les cas edge
    const invitation = await client.invitations.createInvitation({
      emailAddress: email,
      ignoreExisting: true
    });

    return NextResponse.json({ 
      success: true, 
      invitationId: invitation.id,
      email: invitation.emailAddress 
    });
  } catch (error) {
    console.error("Error creating invitation:", error);
    
    // Log détaillé des erreurs Clerk
    if (error && typeof error === 'object' && 'errors' in error) {
      console.error("Clerk error details:", (error as any).errors);
      console.error("Clerk trace ID:", (error as any).clerkTraceId);
      console.error("Status:", (error as any).status);
    }
    
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
    
    // Vérifier si c'est une erreur Clerk avec des détails
    if (error && typeof error === 'object' && 'errors' in error) {
      const clerkErrors = (error as any).errors;
      if (Array.isArray(clerkErrors) && clerkErrors.length > 0) {
        const firstError = clerkErrors[0];
        console.error("First Clerk error:", firstError);
        
        // Retourner une erreur plus spécifique basée sur le code d'erreur Clerk
        return NextResponse.json({ 
          error: `Erreur d'invitation: ${firstError.message || firstError.code || 'Erreur inconnue'}`,
          clerkTraceId: (error as any).clerkTraceId
        }, { status: 400 });
      }
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
};