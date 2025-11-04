import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Package, RefreshCw, Search, Upload, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import type { DropshippingSupplier, ProductSyncLog } from "@shared/schema";

export default function DropshippingAdmin() {
  const { toast } = useToast();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<"cj" | "autods" | "zendrop">("cj");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Fetch suppliers
  const { data: suppliers = [], isLoading: suppliersLoading } = useQuery<DropshippingSupplier[]>({
    queryKey: ["/api/dropshipping/suppliers"],
  });

  // Fetch sync logs
  const { data: logs = [], isLoading: logsLoading } = useQuery<ProductSyncLog[]>({
    queryKey: ["/api/dropshipping/logs"],
  });

  // Initialize suppliers mutation
  const initSuppliersMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/dropshipping/suppliers/init", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to initialize suppliers");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dropshipping/suppliers"] });
      toast({
        title: "Fournisseurs initialisés",
        description: "Configurez vos clés API pour activer l'import automatique",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Échec de l'initialisation",
        variant: "destructive",
      });
    },
  });

  // Update supplier mutation
  const updateSupplierMutation = useMutation({
    mutationFn: async ({
      id,
      apiKey,
      apiEmail,
      active,
    }: {
      id: string;
      apiKey?: string;
      apiEmail?: string;
      active?: boolean;
    }) => {
      const response = await fetch(`/api/dropshipping/suppliers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ apiKey, apiEmail, active }),
      });
      if (!response.ok) throw new Error("Failed to update supplier");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dropshipping/suppliers"] });
      toast({
        title: "Fournisseur mis à jour",
        description: "Configuration enregistrée avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Search products mutation
  const searchMutation = useMutation({
    mutationFn: async ({ source, keyword }: { source: string; keyword: string }) => {
      const params = new URLSearchParams({ source, keyword });
      const response = await fetch(`/api/dropshipping/search?${params}`, {
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: (data) => {
      setSearchResults(data.list || data || []);
      toast({
        title: "Recherche réussie",
        description: `${data.list?.length || data.length || 0} produits trouvés`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de recherche",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Import product mutation
  const importMutation = useMutation({
    mutationFn: async ({ source, externalId }: { source: string; externalId: string }) => {
      const response = await fetch("/api/dropshipping/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ source, externalId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dropshipping/logs"] });
      toast({
        title: "Produit importé",
        description: "Le produit est maintenant disponible dans votre catalogue",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Échec de l'import",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Bulk sync mutation
  const bulkSyncMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/dropshipping/sync-all", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to sync products");
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dropshipping/logs"] });
      toast({
        title: "Synchronisation terminée",
        description: `${data.synced} produits synchronisés, ${data.failed} échecs`,
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

  const handleSearch = () => {
    if (!searchKeyword.trim()) {
      toast({
        title: "Mot-clé requis",
        description: "Entrez un mot-clé pour rechercher des produits",
        variant: "destructive",
      });
      return;
    }

    searchMutation.mutate({
      source: selectedSupplier,
      keyword: searchKeyword,
    });
  };

  const handleImport = (externalId: string) => {
    importMutation.mutate({
      source: selectedSupplier,
      externalId,
    });
  };

  const getStatusBadge = (status: string) => {
    if (status === "success") return <Badge data-testid={`badge-status-success`} className="bg-ikabay-green"><CheckCircle className="w-3 h-3 mr-1" />Succès</Badge>;
    if (status === "failed") return <Badge data-testid={`badge-status-failed`} variant="destructive"><XCircle className="w-3 h-3 mr-1" />Échec</Badge>;
    return <Badge data-testid={`badge-status-pending`} variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />En attente</Badge>;
  };

  if (suppliersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-ikabay-orange" />
      </div>
    );
  }

  // Initialize suppliers if none exist
  if (!suppliers || suppliers.length === 0) {
    return (
      <div className="container max-w-4xl mx-auto p-8">
        <Card>
          <CardHeader>
            <CardTitle>Configuration Dropshipping</CardTitle>
            <CardDescription>
              Initialisez les fournisseurs dropshipping pour commencer l'import automatique
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => initSuppliersMutation.mutate()}
              disabled={initSuppliersMutation.isPending}
              data-testid="button-init-suppliers"
            >
              {initSuppliersMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Initialiser les fournisseurs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cjSupplier = suppliers.find(s => s.code === "cj");
  const autodsSupplier = suppliers.find(s => s.code === "autods");
  const zendropSupplier = suppliers.find(s => s.code === "zendrop");

  return (
    <div className="container max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dropshipping Manager</h1>
          <p className="text-muted-foreground mt-1">
            Import automatique depuis CJ, AutoDS, et Zendrop
          </p>
        </div>
        <Button
          onClick={() => bulkSyncMutation.mutate()}
          disabled={bulkSyncMutation.isPending}
          data-testid="button-bulk-sync"
        >
          {bulkSyncMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Tout synchroniser
        </Button>
      </div>

      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search" data-testid="tab-search">
            <Search className="w-4 h-4 mr-2" />
            Rechercher & Importer
          </TabsTrigger>
          <TabsTrigger value="suppliers" data-testid="tab-suppliers">
            <Package className="w-4 h-4 mr-2" />
            Fournisseurs
          </TabsTrigger>
          <TabsTrigger value="logs" data-testid="tab-logs">
            <Upload className="w-4 h-4 mr-2" />
            Logs de Sync
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rechercher des produits</CardTitle>
              <CardDescription>
                Trouvez des produits à importer depuis vos fournisseurs dropshipping
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="search-keyword">Mot-clé</Label>
                  <Input
                    id="search-keyword"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="Ex: montre connectée, vêtements..."
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    data-testid="input-search-keyword"
                  />
                </div>
                <div>
                  <Label htmlFor="search-supplier">Fournisseur</Label>
                  <select
                    id="search-supplier"
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value as any)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                    data-testid="select-supplier"
                  >
                    <option value="cj">CJ Dropshipping</option>
                    <option value="autods">AutoDS (stub)</option>
                    <option value="zendrop">Zendrop (stub)</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleSearch}
                    disabled={searchMutation.isPending}
                    data-testid="button-search"
                  >
                    {searchMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4 mr-2" />
                    )}
                    Rechercher
                  </Button>
                </div>
              </div>

              {searchResults.length > 0 && (
                <div className="grid gap-4 mt-6">
                  {searchResults.slice(0, 10).map((product: any, index: number) => (
                    <Card key={product.pid || index} data-testid={`card-product-${index}`}>
                      <CardContent className="flex items-center gap-4 p-4">
                        <img
                          src={product.productImage || product.image}
                          alt={product.productNameEn || product.name}
                          className="w-20 h-20 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold" data-testid={`text-product-name-${index}`}>
                            {product.productNameEn || product.productName || product.name}
                          </h3>
                          <p className="text-sm text-muted-foreground" data-testid={`text-product-price-${index}`}>
                            Prix: ${product.sellPrice || product.price || "N/A"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            SKU: {product.productSku || product.sku || product.pid}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleImport(product.pid || product.id)}
                          disabled={importMutation.isPending}
                          data-testid={`button-import-${index}`}
                        >
                          {importMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4 mr-2" />
                          )}
                          Importer
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          {cjSupplier && (
            <SupplierCard
              supplier={cjSupplier}
              onUpdate={updateSupplierMutation.mutate}
              isPending={updateSupplierMutation.isPending}
            />
          )}
          {autodsSupplier && (
            <SupplierCard
              supplier={autodsSupplier}
              onUpdate={updateSupplierMutation.mutate}
              isPending={updateSupplierMutation.isPending}
              isStub
            />
          )}
          {zendropSupplier && (
            <SupplierCard
              supplier={zendropSupplier}
              onUpdate={updateSupplierMutation.mutate}
              isPending={updateSupplierMutation.isPending}
              isStub
            />
          )}
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique de synchronisation</CardTitle>
              <CardDescription>
                Dernières opérations d'import et de mise à jour
              </CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : logs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucun log de synchronisation
                </p>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 border rounded-md"
                      data-testid={`log-entry-${log.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(log.status)}
                          <span className="font-medium">{log.action.toUpperCase()}</span>
                          <span className="text-sm text-muted-foreground">
                            {log.externalId && `ID: ${log.externalId}`}
                          </span>
                        </div>
                        {log.errorMessage && (
                          <p className="text-sm text-destructive mt-1">{log.errorMessage}</p>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(log.createdAt!).toLocaleString("fr-FR")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SupplierCard({
  supplier,
  onUpdate,
  isPending,
  isStub = false,
}: {
  supplier: DropshippingSupplier;
  onUpdate: (data: any) => void;
  isPending: boolean;
  isStub?: boolean;
}) {
  const [apiKey, setApiKey] = useState("");
  const [apiEmail, setApiEmail] = useState("");

  const handleSave = () => {
    onUpdate({
      id: supplier.id,
      apiKey: apiKey || undefined,
      apiEmail: apiEmail || undefined,
      active: true,
    });
    setApiKey("");
    setApiEmail("");
  };

  return (
    <Card data-testid={`card-supplier-${supplier.code}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{supplier.name}</CardTitle>
            <CardDescription>{supplier.baseUrl}</CardDescription>
          </div>
          <Badge variant={supplier.active ? "default" : "secondary"} data-testid={`badge-supplier-status-${supplier.code}`}>
            {supplier.active ? "Actif" : "Inactif"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isStub && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              {supplier.code === "autods"
                ? "AutoDS nécessite une approbation API. Contactez support@autods.com"
                : "Zendrop n'a pas d'API publique. Utilisez l'intégration Shopify/WooCommerce"}
            </p>
          </div>
        )}

        {supplier.code === "cj" && (
          <>
            <div>
              <Label htmlFor={`apiEmail-${supplier.id}`}>Email CJ Dropshipping</Label>
              <Input
                id={`apiEmail-${supplier.id}`}
                type="email"
                value={apiEmail}
                onChange={(e) => setApiEmail(e.target.value)}
                placeholder="votre-email@example.com"
                data-testid={`input-api-email-${supplier.code}`}
              />
            </div>

            <div>
              <Label htmlFor={`apiKey-${supplier.id}`}>API Key</Label>
              <Input
                id={`apiKey-${supplier.id}`}
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Votre clé API CJ"
                data-testid={`input-api-key-${supplier.code}`}
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={isPending || !apiKey || !apiEmail}
              data-testid={`button-save-supplier-${supplier.code}`}
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Activer {supplier.name}
            </Button>
          </>
        )}

        {supplier.syncStatus === "error" && supplier.errorMessage && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
            <p className="text-sm text-destructive">{supplier.errorMessage}</p>
          </div>
        )}

        {supplier.lastSyncAt && (
          <p className="text-sm text-muted-foreground">
            Dernière sync: {new Date(supplier.lastSyncAt).toLocaleString("fr-FR")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
