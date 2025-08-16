"use client";

import { useRole } from "@/app/lib/useRole";
import { redirect } from "next/navigation";
import { UsersManagement } from "@/components/UsersManagement";

const UsersPage = () => {
  const role = useRole();

  if (role !== "admin") {
    redirect("/");
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Gestion des utilisateurs</h1>
      <UsersManagement />
    </div>
  );
};

export default UsersPage;