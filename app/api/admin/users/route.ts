import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export const GET = async () => {
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

    // Récupérer tous les utilisateurs
    const users = await client.users.getUserList({
      limit: 100,
      orderBy: "-created_at"
    });

    return NextResponse.json(users.data);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
};