import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type Wallet, type Transaction } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Coins, TrendingUp, Zap, Play, Pause, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function CryptoDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showMiningReward, setShowMiningReward] = useState(false);

  const { data: wallet, isLoading: walletLoading } = useQuery<Wallet>({
    queryKey: ["/api/wallet"],
  });

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const toggleMiningMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/wallet/toggle-mining", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
    },
  });

  // Mining ticker effect
  useEffect(() => {
    if (!wallet?.miningActive) return;

    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      setShowMiningReward(true);
      setTimeout(() => setShowMiningReward(false), 1500);
    }, 2000);

    return () => clearInterval(interval);
  }, [wallet?.miningActive, queryClient]);

  // Mock chart data based on transactions
  const chartData = transactions?.slice(-7).map((t, i) => ({
    name: new Date(t.timestamp).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
    balance: wallet ? wallet.balance - (transactions.length - i - 1) * 0.5 : 0,
  })) || [];

  const euroEquivalent = wallet ? (wallet.balance * 0.10).toFixed(2) : "0.00";

  return (
    <section id="crypto" className="py-16 md:py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display font-bold text-3xl md:text-4xl mb-4" data-testid="text-crypto-title">
            Dashboard Crypto IKB
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-crypto-subtitle">
            Gérez vos tokens IKB, minez et consultez votre historique
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Solde Total IKB</CardTitle>
              <Coins className="w-4 h-4 text-ikabay-orange" />
            </CardHeader>
            <CardContent>
              {walletLoading ? (
                <Skeleton className="h-10 w-32" />
              ) : (
                <>
                  <div className="font-display text-3xl font-bold text-ikabay-dark dark:text-white" data-testid="text-balance">
                    {wallet?.balance.toFixed(2) || "0.00"} IKB
                  </div>
                  <p className="text-xs text-muted-foreground mt-1" data-testid="text-euro-equivalent">
                    ≈ {euroEquivalent} €
                  </p>
                </>
              )}
              <AnimatePresence>
                {showMiningReward && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-4 right-4 text-ikabay-green font-semibold text-sm"
                    data-testid="text-mining-reward"
                  >
                    +0.05 IKB
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Gagné</CardTitle>
              <TrendingUp className="w-4 h-4 text-ikabay-green" />
            </CardHeader>
            <CardContent>
              {walletLoading ? (
                <Skeleton className="h-10 w-32" />
              ) : (
                <div className="font-display text-3xl font-bold" data-testid="text-total-earned">
                  {wallet?.totalEarned.toFixed(2) || "0.00"}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                IKB tokens gagnés
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-ikabay-orange/10 to-ikabay-green/10 border-ikabay-orange/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mining IKB</CardTitle>
              <Zap className={`w-4 h-4 ${wallet?.miningActive ? 'text-ikabay-green animate-pulse' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium mb-1">
                    {wallet?.miningActive ? (
                      <Badge className="bg-ikabay-green text-white" data-testid="badge-mining-status">
                        Actif
                      </Badge>
                    ) : (
                      <Badge variant="secondary" data-testid="badge-mining-status">
                        Inactif
                      </Badge>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    +0.05 IKB toutes les 2s
                  </p>
                </div>
                <Button
                  size="icon"
                  variant={wallet?.miningActive ? "destructive" : "default"}
                  onClick={() => toggleMiningMutation.mutate()}
                  disabled={toggleMiningMutation.isPending}
                  data-testid="button-toggle-mining"
                >
                  {wallet?.miningActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Évolution du Solde</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--chart-1))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  Pas encore de données
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historique des Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[250px] overflow-y-auto" data-testid="list-transactions">
                {transactions && transactions.length > 0 ? (
                  transactions.slice(-10).reverse().map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover-elevate"
                      data-testid={`transaction-${tx.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          tx.amount > 0 ? 'bg-ikabay-green/10' : 'bg-muted'
                        }`}>
                          {tx.amount > 0 ? (
                            <ArrowDownLeft className="w-4 h-4 text-ikabay-green" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium" data-testid={`text-tx-description-${tx.id}`}>
                            {tx.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(tx.timestamp).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <p className={`font-semibold ${tx.amount > 0 ? 'text-ikabay-green' : 'text-muted-foreground'}`} data-testid={`text-tx-amount-${tx.id}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)} IKB
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    Aucune transaction
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
