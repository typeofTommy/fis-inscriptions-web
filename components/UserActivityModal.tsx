"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Activity, 
  Calendar, 
  Users, 
  UserPlus, 
  Trophy,
  RefreshCw,
  Clock
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

type ActivityItem = {
  id: number;
  type: "inscription" | "competitor" | "coach";
  createdAt: string;
  eventData?: {
    eventName?: string;
    codexUrl?: string;
  };
  // Pour les inscriptions
  eventId?: number;
  status?: string;
  // Pour les compétiteurs
  inscriptionId?: number;
  competitorId?: number;
  codexNumber?: string;
  competitorFirstName?: string;
  competitorLastName?: string;
  competitorNation?: string;
  competitorFisCode?: string;
  // Pour les coaches
  firstName?: string;
  lastName?: string;
  team?: string;
  gender?: string;
};

type ActivityStats = {
  inscriptionsCount: number;
  competitorsCount: number;
  coachesCount: number;
  totalActivities: number;
};

type UserActivityModalProps = {
  userId: string;
  userName: string;
};

export const UserActivityModal = ({ userId, userName }: UserActivityModalProps) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const fetchActivity = useCallback(async () => {
    if (!isOpen) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${userId}/activity`);
      if (!response.ok) throw new Error("Erreur lors du chargement de l'activité");
      
      const data = await response.json();
      setActivities(data.activities);
      setStats(data.stats);
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de charger l'activité de l'utilisateur",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [isOpen, userId, toast]);

  useEffect(() => {
    if (isOpen) {
      fetchActivity();
    }
  }, [isOpen, fetchActivity]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "inscription":
        return <Calendar className="h-4 w-4" />;
      case "competitor":
        return <Users className="h-4 w-4" />;
      case "coach":
        return <UserPlus className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityDescription = (activity: ActivityItem) => {
    const eventName = activity.eventData?.eventName || 
                     (activity.eventData as any)?.eventTitle || 
                     (activity.eventData as any)?.title || 
                     `Événement #${activity.eventId || activity.inscriptionId}`;
    
    switch (activity.type) {
      case "inscription":
        return `Inscription créée pour '${eventName}'`;
      case "competitor":
        const competitorName = activity.competitorFirstName && activity.competitorLastName 
          ? `${activity.competitorFirstName} ${activity.competitorLastName}`
          : `Compétiteur #${activity.competitorId}`;
        const nation = activity.competitorNation ? ` (${activity.competitorNation})` : '';
        const codex = activity.codexNumber ? ` [${activity.codexNumber}]` : '';
        return `Compétiteur ajouté : ${competitorName}${nation}${codex} dans '${eventName}'`;
      case "coach":
        return `Coach ajouté : ${activity.firstName} ${activity.lastName}${activity.team ? ` (${activity.team})` : ""} dans '${eventName}'`;
      default:
        return "Activité inconnue";
    }
  };

  const getActivityBadgeColor = (type: string) => {
    switch (type) {
      case "inscription":
        return "bg-blue-100 text-blue-800";
      case "competitor":
        return "bg-green-100 text-green-800";
      case "coach":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer"
        >
          <Activity className="h-4 w-4 mr-1" />
          Activité
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activité de {userName}
            <Badge variant="secondary" className="ml-2">
              30 derniers jours
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto space-y-4">
          {/* Statistiques */}
          {stats && (
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Inscriptions</p>
                      <p className="text-lg font-bold">{stats.inscriptionsCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Compétiteurs</p>
                      <p className="text-lg font-bold">{stats.competitorsCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Coaches</p>
                      <p className="text-lg font-bold">{stats.coachesCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="text-lg font-bold">{stats.totalActivities}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Timeline des activités */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg">Activités récentes</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchActivity}
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
                  Chargement de l&apos;activité...
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aucune activité trouvée dans les 30 derniers jours
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {activities.map((activity) => (
                    <div
                      key={`${activity.type}-${activity.id}`}
                      className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className={`p-3 rounded-lg flex-shrink-0 ${getActivityBadgeColor(activity.type)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <p className="text-sm font-medium text-gray-900 leading-relaxed">
                          {getActivityDescription(activity)}
                        </p>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-gray-400 flex-shrink-0" />
                          <p className="text-xs text-gray-500">
                            {formatDate(activity.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Badge className={getActivityBadgeColor(activity.type)}>
                          {activity.type === "inscription" ? "Inscription" :
                           activity.type === "competitor" ? "Compétiteur" : "Coach"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};