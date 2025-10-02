"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  UserPlus,
  Trash2,
  Shield,
  ShieldCheck,
  RefreshCw,
  Search
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { UserActivityModal } from "@/components/UserActivityModal";
import { useTranslations } from "next-intl";

type User = {
  id: string;
  emailAddresses: Array<{
    emailAddress: string;
    id: string;
  }>;
  firstName?: string;
  lastName?: string;
  username?: string;
  publicMetadata: {
    role?: "admin" | "user";
  };
  createdAt: number;
  lastSignInAt?: number;
};

export const UsersManagement = () => {
  const t = useTranslations("users");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users");
      if (!response.ok) throw new Error(t("errors.loadUsers"));
      const data = await response.json();
      setUsers(data);
    } catch {
      toast({
        title: t("invite.error"),
        description: t("errors.loadUsersDescription"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  const inviteUser = async () => {
    if (!inviteEmail.trim()) return;

    try {
      setInviting(true);
      const response = await fetch("/api/admin/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t("errors.inviteError"));
      }

      setInviteEmail("");
      toast({
        title: t("invite.success"),
        description: t("invite.successDescription", { email: inviteEmail }),
      });

      fetchUsers();
    } catch (error) {
      toast({
        title: t("invite.error"),
        description: error instanceof Error ? error.message : t("invite.errorDescription"),
        variant: "destructive",
      });
    } finally {
      setInviting(false);
    }
  };

  const toggleUserRole = async (userId: string, currentRole?: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";

    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) throw new Error(t("errors.roleChangeError"));

      toast({
        title: t("success.roleChanged"),
        description: newRole === "admin" ? t("success.roleChangedAdmin") : t("success.roleChangedUser"),
      });

      fetchUsers();
    } catch {
      toast({
        title: t("invite.error"),
        description: t("errors.roleChangeErrorDescription"),
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(t("user.confirmDelete", { email: userEmail }))) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error(t("errors.deleteError"));

      toast({
        title: t("success.userDeleted"),
        description: t("success.userDeletedDescription", { email: userEmail }),
      });

      fetchUsers();
    } catch {
      toast({
        title: t("invite.error"),
        description: t("errors.deleteErrorDescription"),
        variant: "destructive",
      });
    }
  };

  // Filtrage et tri des utilisateurs
  const filteredAndSortedUsers = useMemo(() => {
    const filtered = users.filter(user => {
      const email = user.emailAddresses[0]?.emailAddress || user.username || "";
      const displayName = user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : email;
      const role = user.publicMetadata.role || "user";
      
      // Filtre par terme de recherche
      const matchesSearch = searchTerm === "" || 
        email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        displayName.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtre par rôle
      const matchesRole = roleFilter === "all" || role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
    
    // Tri : admins en premier, puis par date de création
    return filtered.sort((a, b) => {
      const aRole = a.publicMetadata.role || "user";
      const bRole = b.publicMetadata.role || "user";
      
      // Les admins en premier
      if (aRole === "admin" && bRole !== "admin") return -1;
      if (bRole === "admin" && aRole !== "admin") return 1;
      
      // Ensuite par date de création (plus récent en premier)
      return b.createdAt - a.createdAt;
    });
  }, [users, searchTerm, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isRecentlyActive = (lastSignInAt?: number) => {
    if (!lastSignInAt) return false;
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return lastSignInAt > oneWeekAgo;
  };

  const stats = useMemo(() => {
    const adminCount = users.filter(u => u.publicMetadata.role === "admin").length;
    const userCount = users.filter(u => (u.publicMetadata.role || "user") === "user").length;
    const recentlyActiveCount = users.filter(u => isRecentlyActive(u.lastSignInAt)).length;
    
    return { adminCount, userCount, recentlyActiveCount };
  }, [users]);

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{t("stats.administrators")}</p>
                <p className="text-2xl font-bold">{stats.adminCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Shield className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{t("stats.users")}</p>
                <p className="text-2xl font-bold">{stats.userCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <div className="w-4 h-4 bg-green-500 rounded-full" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{t("stats.recentlyActive")}</p>
                <p className="text-2xl font-bold">{stats.recentlyActiveCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Mail className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{t("stats.total")}</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section d'invitation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {t("invite.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              type="email"
              placeholder={t("invite.emailPlaceholder")}
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && inviteUser()}
              className="flex-1"
            />
            <Button
              onClick={inviteUser}
              disabled={!inviteEmail.trim() || inviting}
              className="cursor-pointer"
            >
              {inviting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  {t("invite.button")}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Barre de recherche et filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            {t("search.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder={t("search.placeholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={roleFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setRoleFilter("all")}
                className="cursor-pointer"
              >
                {t("search.all", { count: users.length })}
              </Button>
              <Button
                variant={roleFilter === "admin" ? "default" : "outline"}
                size="sm"
                onClick={() => setRoleFilter("admin")}
                className="cursor-pointer"
              >
                <ShieldCheck className="h-4 w-4 mr-1" />
                {t("search.admins", { count: users.filter(u => u.publicMetadata.role === "admin").length })}
              </Button>
              <Button
                variant={roleFilter === "user" ? "default" : "outline"}
                size="sm"
                onClick={() => setRoleFilter("user")}
                className="cursor-pointer"
              >
                <Shield className="h-4 w-4 mr-1" />
                {t("search.users", { count: users.filter(u => (u.publicMetadata.role || "user") === "user").length })}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des utilisateurs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {roleFilter === "all"
              ? t("list.title", { filtered: filteredAndSortedUsers.length, total: users.length })
              : t("list.titleFiltered", {
                  role: roleFilter === "admin" ? t("stats.administrators") : t("stats.users"),
                  count: filteredAndSortedUsers.length
                })
            }
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            disabled={loading}
            className="cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              {t("list.loading")}
            </div>
          ) : filteredAndSortedUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || roleFilter !== "all"
                ? t("list.noResultsFiltered")
                : t("list.noResults")
              }
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAndSortedUsers.map((user) => {
                const email = user.emailAddresses[0]?.emailAddress || user.username || t("user.emailNotDefined");
                const displayName = user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : email;
                const role = user.publicMetadata.role || "user";

                return (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                      role === "admin" ? "border-l-4 border-l-blue-500 bg-blue-50/50" : ""
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <div className="flex items-center gap-2">
                          {isRecentlyActive(user.lastSignInAt) && (
                            <div className="w-2 h-2 bg-green-500 rounded-full" title={t("user.recentlyActive")} />
                          )}
                          <span className="font-medium">{displayName}</span>
                        </div>
                        <Badge
                          variant={role === "admin" ? "default" : "secondary"}
                          className="flex items-center gap-1"
                        >
                          {role === "admin" ? (
                            <ShieldCheck className="h-3 w-3" />
                          ) : (
                            <Shield className="h-3 w-3" />
                          )}
                          {role === "admin" ? t("user.admin") : t("user.user")}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        {email !== displayName && <div>{email}</div>}
                        <div>
                          {t("user.registeredOn", { date: formatDate(user.createdAt) })}
                          {user.lastSignInAt && (
                            <> • {t("user.lastSignIn", { date: formatDate(user.lastSignInAt) })}</>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserActivityModal
                        userId={user.id}
                        userName={displayName}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleUserRole(user.id, role)}
                        className="cursor-pointer"
                      >
                        {role === "admin" ? t("user.demote") : t("user.promote")}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteUser(user.id, email)}
                        className="cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};