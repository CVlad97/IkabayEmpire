import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Coins, TrendingUp, ShoppingBag, UtensilsCrossed, MapPin } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-ikabay-orange/10 via-ikabay-green/10 to-ikabay-dark/5">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1559827260-dc66d52bef19?q=80&w=2000')] bg-cover bg-center opacity-10" />
        
        <div className="relative max-w-5xl mx-auto text-center">
          <h1 className="font-display font-bold text-5xl md:text-7xl mb-6 text-ikabay-dark dark:text-white" data-testid="text-landing-title">
            IKABAY EMPIRE
          </h1>
          <p className="text-xl md:text-2xl mb-4 text-muted-foreground max-w-3xl mx-auto" data-testid="text-landing-subtitle">
            Votre écosystème caribéen complet
          </p>
          <p className="text-lg mb-8 text-muted-foreground max-w-2xl mx-auto">
            Marketplace, livraison locale, et récompenses crypto IKB
          </p>
          
          <Button
            size="lg"
            className="bg-ikabay-orange hover:bg-ikabay-orange/90 text-white text-lg px-8 py-6 h-auto"
            onClick={() => window.location.href = "/api/login"}
            data-testid="button-login"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Se connecter / S'inscrire
          </Button>

          <p className="mt-4 text-sm text-muted-foreground">
            Connexion sécurisée via Replit Auth
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-card">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display font-bold text-3xl md:text-4xl text-center mb-12">
            Découvrez IKABAY EMPIRE
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="hover-elevate">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-ikabay-orange/10 flex items-center justify-center mb-4">
                  <ShoppingBag className="w-6 h-6 text-ikabay-orange" />
                </div>
                <h3 className="font-display font-semibold text-xl mb-2">Marketplace Caribéenne</h3>
                <p className="text-muted-foreground">
                  Découvrez des produits locaux authentiques et gagnez 5% de cashback en IKB tokens sur chaque achat
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-ikabay-green/10 flex items-center justify-center mb-4">
                  <UtensilsCrossed className="w-6 h-6 text-ikabay-green" />
                </div>
                <h3 className="font-display font-semibold text-xl mb-2">Delikreol Food Delivery</h3>
                <p className="text-muted-foreground">
                  Savourez les délices caribéens livrés chez vous avec des temps de préparation optimisés
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-ikabay-orange/10 flex items-center justify-center mb-4">
                  <Coins className="w-6 h-6 text-ikabay-orange" />
                </div>
                <h3 className="font-display font-semibold text-xl mb-2">Crypto Dashboard IKB</h3>
                <p className="text-muted-foreground">
                  Gérez vos tokens IKB, activez le mining automatique (+0.05 IKB toutes les 2s) et suivez vos gains
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-ikabay-green/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-ikabay-green" />
                </div>
                <h3 className="font-display font-semibold text-xl mb-2">IA Personnalisée</h3>
                <p className="text-muted-foreground">
                  Recommandations produits intelligentes avec OpenAI et Gemini selon vos préférences et votre zone
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-ikabay-orange/10 flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-ikabay-orange" />
                </div>
                <h3 className="font-display font-semibold text-xl mb-2">Géolocalisation</h3>
                <p className="text-muted-foreground">
                  Service adapté à votre position pour des livraisons rapides et des offres locales pertinentes
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-ikabay-green/10 flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-ikabay-green" />
                </div>
                <h3 className="font-display font-semibold text-xl mb-2">Récompenses Continue</h3>
                <p className="text-muted-foreground">
                  Gagnez des IKB tokens via cashback, mining, partages sociaux et participation communautaire
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              className="bg-ikabay-green hover:bg-ikabay-green/90 text-white"
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-get-started"
            >
              Commencer Maintenant
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
