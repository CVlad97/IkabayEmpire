import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, DollarSign, Coins, TrendingUp, ArrowLeft, Sparkles, Activity, BarChart3 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import AdminSystemHealth from "@/components/AdminSystemHealth";

interface AdminAnalytics {
  totalSales: number;
  totalUsers: number;
  totalIKBDistributed: number;
  activeUsers: number;
  salesByRegion: { region: string; sales: number }[];
  aiInsights: string;
}

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

export default function Admin() {
  const { data: analytics, isLoading } = useQuery<AdminAnalytics>({
    queryKey: ["/api/admin/analytics"],
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="button-back-home">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
            </Link>
            <h1 className="font-display font-bold text-2xl md:text-3xl mt-2" data-testid="text-admin-title">
              Dashboard Admin
            </h1>
            <p className="text-muted-foreground">Vue d'ensemble de l'écosystème IKABAY</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="analytics" className="flex items-center gap-2" data-testid="tab-analytics">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2" data-testid="tab-system">
              <Activity className="w-4 h-4" />
              System Health
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventes Totales</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="text-total-sales">
                    {analytics?.totalSales.toFixed(2)} €
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    +20% ce mois
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilisateurs Actifs</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="text-active-users">
                    {analytics?.activeUsers || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sur {analytics?.totalUsers || 0} total
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">IKB Distribués</CardTitle>
              <Coins className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="text-ikb-distributed">
                    {analytics?.totalIKBDistributed.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    IKB tokens
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-ikabay-orange/10 to-ikabay-green/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              <TrendingUp className="w-4 h-4 text-ikabay-green" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-ikabay-green">+32%</div>
              <p className="text-xs text-muted-foreground mt-1">
                vs. mois dernier
              </p>
            </CardContent>
          </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Ventes par Région</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : analytics?.salesByRegion && analytics.salesByRegion.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.salesByRegion}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="region" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="sales" fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Pas encore de données
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribution des Catégories</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : analytics?.salesByRegion && analytics.salesByRegion.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.salesByRegion}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ region, sales }) => `${region}: ${sales}€`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="sales"
                    >
                      {analytics.salesByRegion.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Pas encore de données
                </div>
              )}
            </CardContent>
          </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-ikabay-orange" />
                  Insights IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none" data-testid="text-ai-insights">
                    <p className="text-foreground whitespace-pre-wrap">
                      {analytics?.aiInsights || "L'IA analyse vos données pour générer des insights personnalisés..."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system">
            <AdminSystemHealth />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
