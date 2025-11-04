import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, TrendingDown, Calculator } from "lucide-react";

interface PriceBreakdown {
  basePrice: number;
  shippingCost: number;
  importFees: number;
  relayFees: number;
  subtotal: number;
  margin: number;
  finalPrice: number;
  breakdown: string;
}

const REGIONS = [
  { value: "martinique", label: "🇲🇶 Martinique", shipping: "15€", import: "8%", relay: "3.50€" },
  { value: "guadeloupe", label: "🇬🇵 Guadeloupe", shipping: "15€", import: "8%", relay: "3.50€" },
  { value: "guyane", label: "🇬🇫 Guyane", shipping: "22€", import: "10%", relay: "4€" },
  { value: "reunion", label: "🇷🇪 Réunion", shipping: "25€", import: "8%", relay: "4.50€" },
  { value: "mayotte", label: "🇾🇹 Mayotte", shipping: "28€", import: "10%", relay: "5€" },
];

export default function PriceCalculator({ productPrice }: { productPrice?: number }) {
  const [selectedRegion, setSelectedRegion] = useState("martinique");
  const [basePrice, setBasePrice] = useState(productPrice?.toString() || "29.99");

  const { data: priceData, isLoading } = useQuery<PriceBreakdown>({
    queryKey: ["/api/pricing/calculate", basePrice, selectedRegion],
    enabled: parseFloat(basePrice) > 0,
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/pricing/calculate", {
        basePrice: parseFloat(basePrice),
        region: selectedRegion,
      });
      return res.json();
    },
  });

  const selectedRegionInfo = REGIONS.find((r) => r.value === selectedRegion);

  return (
    <Card className="w-full" data-testid="card-price-calculator">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-ikabay-orange" />
          <CardTitle>Calculateur Prix Tout-Inclus</CardTitle>
        </div>
        <CardDescription>
          Prix transparent avec frais DOM-TOM détaillés
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Region Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Région de livraison</label>
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger data-testid="select-region">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REGIONS.map((region) => (
                <SelectItem key={region.value} value={region.value} data-testid={`option-region-${region.value}`}>
                  {region.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Base Price Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Prix de base</label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            placeholder="29.99"
            data-testid="input-base-price"
          />
        </div>

        {/* Selected Region Info */}
        {selectedRegionInfo && (
          <div className="grid grid-cols-3 gap-2 p-3 bg-muted/50 rounded-lg">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      Livraison <Info className="w-3 h-3" />
                    </div>
                    <div className="text-sm font-semibold">{selectedRegionInfo.shipping}</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Frais de transport maritime vers {selectedRegionInfo.label}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      Import <Info className="w-3 h-3" />
                    </div>
                    <div className="text-sm font-semibold">{selectedRegionInfo.import}</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Taxes douanières et frais d'importation</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      Point Relais <Info className="w-3 h-3" />
                    </div>
                    <div className="text-sm font-semibold">{selectedRegionInfo.relay}</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Frais de gestion point relais Ikabay</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Price Breakdown */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ikabay-orange" data-testid="loader-calculation"></div>
          </div>
        ) : priceData ? (
          <div className="space-y-3">
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Prix produit</span>
                <span data-testid="text-base-price">{(priceData.basePrice || 0).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Livraison DOM-TOM</span>
                <span data-testid="text-shipping-cost">{(priceData.shippingCost || 0).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Frais d'import</span>
                <span data-testid="text-import-fees">{(priceData.importFees || 0).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Point relais</span>
                <span data-testid="text-relay-fees">{(priceData.relayFees || 0).toFixed(2)} €</span>
              </div>
              {priceData.subtotal !== undefined && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span>{(priceData.subtotal || 0).toFixed(2)} €</span>
                </div>
              )}
              {priceData.margin !== undefined && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Marge Ikabay (15%)</span>
                  <span data-testid="text-margin">{(priceData.margin || 0).toFixed(2)} €</span>
                </div>
              )}
            </div>

            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">Prix final TTC</span>
                <span className="text-2xl font-bold text-ikabay-orange" data-testid="text-final-price">
                  {(priceData.finalPrice || 0).toFixed(2)} €
                </span>
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-start gap-2">
              <TrendingDown className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  Prix transparent garanti
                </p>
                <p className="text-xs text-muted-foreground">
                  Tous les frais inclus • Aucun frais caché • Livraison assurée
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
