import Hero from "@/components/Hero";
import Marketplace from "@/components/Marketplace";
import Delikreol from "@/components/Delikreol";
import CryptoDashboard from "@/components/CryptoDashboard";
import { Button } from "@/components/ui/button";
import { ShoppingBag, UtensilsCrossed, Wallet, BarChart3 } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Hero />
      <Marketplace />
      <Delikreol />
      <CryptoDashboard />
      
      <section className="py-16 px-4 bg-gradient-to-br from-ikabay-orange/10 to-ikabay-green/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display font-bold text-3xl md:text-4xl mb-6">
            Prêt à commencer votre voyage caribéen?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Rejoignez IKABAY EMPIRE et découvrez un écosystème unique où chaque action vous récompense
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="px-8 font-semibold" data-testid="button-get-started">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Commencer maintenant
            </Button>
            <Link href="/admin">
              <Button variant="outline" size="lg" className="px-8 font-semibold" data-testid="button-admin">
                <BarChart3 className="w-4 h-4 mr-2" />
                Dashboard Admin
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-display font-bold text-xl mb-4 text-ikabay-orange">
                IKABAY EMPIRE
              </h3>
              <p className="text-sm text-muted-foreground">
                L'écosystème caribéen pour découvrir, acheter, gagner et partager
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Marketplace</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-foreground cursor-pointer transition-colors">Produits</li>
                <li className="hover:text-foreground cursor-pointer transition-colors">Catégories</li>
                <li className="hover:text-foreground cursor-pointer transition-colors">Nouveautés</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Delikreol</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-foreground cursor-pointer transition-colors">Restaurants</li>
                <li className="hover:text-foreground cursor-pointer transition-colors">Menu</li>
                <li className="hover:text-foreground cursor-pointer transition-colors">Livraison</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">IKB Token</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-foreground cursor-pointer transition-colors">Wallet</li>
                <li className="hover:text-foreground cursor-pointer transition-colors">Mining</li>
                <li className="hover:text-foreground cursor-pointer transition-colors">Rewards</li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-6 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 IKABAY EMPIRE. Tous droits réservés. Créé par Vladimir CLAVEAU</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
