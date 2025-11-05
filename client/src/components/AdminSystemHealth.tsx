import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Activity, 
  RefreshCw, 
  Pause, 
  Play, 
  AlertCircle, 
  CheckCircle2,
  Clock,
  HardDrive,
  Cpu
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface SystemStatus {
  status: string;
  healthScore: number;
  system: {
    uptime: string;
    memoryUsage: string;
    timestamp: string;
  };
  aiReport: string;
}

interface SchedulerStatus {
  running: boolean;
  hasInterval: boolean;
}

interface SyncLog {
  id: string;
  supplierId: string;
  action: string;
  status: string;
  itemsProcessed: number;
  itemsFailed: number;
  errorMessage: string | null;
  createdAt: string;
}

export default function AdminSystemHealth() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: systemStatus, isLoading: loadingSystem } = useQuery<SystemStatus>({
    queryKey: ["/api/empire/status"],
    refetchInterval: 120000, // 2 minutes
  });

  const { data: schedulerStatus, isLoading: loadingScheduler } = useQuery<SchedulerStatus>({
    queryKey: ["/api/admin/scheduler-status"],
    refetchInterval: 30000, // 30 seconds
  });

  const { data: syncLogs, isLoading: loadingLogs } = useQuery<SyncLog[]>({
    queryKey: ["/api/admin/sync-logs"],
    refetchInterval: 60000, // 1 minute
  });

  const forceSyncMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/force-sync", {});
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/sync-logs"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Synchronisation terminée",
        description: "Produits CJ mis à jour avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de synchronisation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleSchedulerMutation = useMutation({
    mutationFn: async (action: "start" | "stop") => {
      return apiRequest("POST", "/api/admin/scheduler-toggle", { action });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/scheduler-status"] });
      toast({
        title: "Scheduler mis à jour",
        description: schedulerStatus?.running ? "Arrêté" : "Démarré",
      });
    },
  });

  const healthScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 70) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-2xl mb-2">Surveillance Système</h2>
        <p className="text-muted-foreground">Monitoring IA en temps réel et contrôles manuels</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingSystem ? (
              <Skeleton className="h-12 w-20" />
            ) : (
              <>
                <div className={`text-3xl font-bold ${healthScoreColor(systemStatus?.healthScore || 0)}`}>
                  {systemStatus?.healthScore || 0}/100
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {systemStatus?.status}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingSystem ? (
              <Skeleton className="h-12 w-24" />
            ) : (
              <>
                <div className="text-3xl font-bold">
                  {systemStatus?.system.uptime}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Serveur actif
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mémoire</CardTitle>
            <HardDrive className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingSystem ? (
              <Skeleton className="h-12 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold">
                  {systemStatus?.system.memoryUsage}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Utilisation RAM
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-ikabay-orange/5 to-ikabay-green/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="w-5 h-5" />
            Analyse IA
          </CardTitle>
          <CardDescription>Recommandations de l'intelligence artificielle</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingSystem ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <p className="text-sm leading-relaxed">{systemStatus?.aiReport}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Scheduler CJ Dropshipping
            </span>
            {loadingScheduler ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <Badge variant={schedulerStatus?.running ? "default" : "secondary"}>
                {schedulerStatus?.running ? "Actif" : "Arrêté"}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>Synchronisation automatique toutes les 12h</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => forceSyncMutation.mutate()}
              disabled={forceSyncMutation.isPending}
              data-testid="button-force-sync"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${forceSyncMutation.isPending ? "animate-spin" : ""}`} />
              {forceSyncMutation.isPending ? "Synchronisation..." : "Sync Manuel"}
            </Button>

            <Button
              variant="outline"
              onClick={() => toggleSchedulerMutation.mutate(schedulerStatus?.running ? "stop" : "start")}
              disabled={toggleSchedulerMutation.isPending || loadingScheduler}
              data-testid="button-toggle-scheduler"
            >
              {schedulerStatus?.running ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause Auto-Sync
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Activer Auto-Sync
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logs de Synchronisation</CardTitle>
          <CardDescription>Historique des 50 dernières opérations</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingLogs ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : syncLogs && syncLogs.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {syncLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover-elevate"
                  data-testid={`sync-log-${log.id}`}
                >
                  <div className="flex items-center gap-3">
                    {log.status === "success" ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <div className="font-medium text-sm">
                        {log.action === "manual_sync" ? "Sync Manuel" : "Sync Auto"}
                        {" · "}
                        <span className="text-muted-foreground">
                          {log.supplierId === "cj" ? "CJ Dropshipping" : log.supplierId.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: fr })}
                        {log.errorMessage && (
                          <span className="text-red-600 ml-2">· {log.errorMessage}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-right">
                    <div className="text-green-600 font-medium">+{log.itemsProcessed}</div>
                    {log.itemsFailed > 0 && (
                      <div className="text-red-600 text-xs">-{log.itemsFailed}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Aucun log disponible</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
