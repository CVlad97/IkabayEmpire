import PriceCalculator from "@/components/PriceCalculator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, Sparkles, Shield, MapPin } from "lucide-react";

export default function PriceCalculatorPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-ikabay-orange/10 via-background to-ikabay-green/10 border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <Badge variant="secondary" className="mb-2">
              <Sparkles className="w-3 h-3 mr-1" />
              Prix IA-Optimisé
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight">
              Calculateur Prix DOM-TOM
            </h1>
            <p className="text-lg text-muted-foreground">
              Découvrez le prix exact de votre produit avec tous les frais inclus.
              Transparence totale, zéro surprise.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
          {/* Calculator */}
          <div>
            <PriceCalculator />
          </div>

          {/* Info Cards */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-green-600" />
                  <CardTitle className="text-lg">Prix Transparents</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Notre IA analyse en temps réel les prix sur Temu, AliExpress et Amazon
                  pour vous garantir le meilleur tarif.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Temu</Badge>
                  <Badge variant="outline">AliExpress</Badge>
                  <Badge variant="outline">Amazon FR</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-ikabay-orange" />
                  <CardTitle className="text-lg">5 Régions DOM-TOM</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">🇲🇶 Martinique</span>
                    <span className="font-medium">15€ + 8%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">🇬🇵 Guadeloupe</span>
                    <span className="font-medium">15€ + 8%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">🇬🇫 Guyane</span>
                    <span className="font-medium">22€ + 10%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">🇷🇪 Réunion</span>
                    <span className="font-medium">25€ + 8%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">🇾🇹 Mayotte</span>
                    <span className="font-medium">28€ + 10%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-ikabay-green" />
                  <CardTitle className="text-lg">Garantie Ikabay</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-ikabay-green mt-0.5">✓</span>
                    <span>Tous les frais inclus dans le prix affiché</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-ikabay-green mt-0.5">✓</span>
                    <span>Livraison assurée jusqu'au point relais</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-ikabay-green mt-0.5">✓</span>
                    <span>Suivi en temps réel de votre commande</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-ikabay-green mt-0.5">✓</span>
                    <span>Service client 7j/7 via WhatsApp</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="max-w-4xl mx-auto mt-8 p-6 bg-muted/30 rounded-lg">
          <h3 className="font-semibold mb-2">Comment ça marche ?</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-medium mb-1">1. Sélectionnez votre région</div>
              <p className="text-muted-foreground">
                Choisissez parmi Martinique, Guadeloupe, Guyane, Réunion ou Mayotte
              </p>
            </div>
            <div>
              <div className="font-medium mb-1">2. Entrez le prix produit</div>
              <p className="text-muted-foreground">
                Notre IA calcule automatiquement tous les frais DOM-TOM
              </p>
            </div>
            <div>
              <div className="font-medium mb-1">3. Prix final affiché</div>
              <p className="text-muted-foreground">
                Breakdown complet : livraison + import + relay + marge (15%)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
