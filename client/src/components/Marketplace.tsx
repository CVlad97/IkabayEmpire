import { useQuery } from "@tanstack/react-query";
import { type Product } from "@shared/schema";
import ProductCard from "./ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Sparkles } from "lucide-react";

export default function Marketplace() {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: recommendations } = useQuery<{ productId: string; reason: string }[]>({
    queryKey: ["/api/recommend"],
  });

  const recommendedProductIds = recommendations?.map(r => r.productId) || [];

  return (
    <section id="marketplace" className="py-16 md:py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display font-bold text-3xl md:text-4xl mb-4" data-testid="text-marketplace-title">
            Marketplace Caribéenne
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-marketplace-subtitle">
            Découvrez nos produits sélectionnés et gagnez 5% de cashback en IKB tokens
          </p>
        </div>

        {recommendations && recommendations.length > 0 && (
          <div className="mb-12">
            <h3 className="font-display font-semibold text-xl mb-6 flex items-center gap-2" data-testid="text-recommended-title">
              <Sparkles className="w-5 h-5 text-ikabay-orange" />
              Recommandés pour vous
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products?.filter(p => recommendedProductIds.includes(p.id)).map((product, idx) => (
                <ProductCard key={product.id} product={product} index={idx} />
              ))}
            </div>
          </div>
        )}

        <h3 className="font-display font-semibold text-xl mb-6" data-testid="text-all-products-title">
          Tous les produits
        </h3>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, idx) => (
              <ProductCard key={product.id} product={product} index={idx} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground" data-testid="text-no-products">
              Aucun produit disponible pour le moment
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
