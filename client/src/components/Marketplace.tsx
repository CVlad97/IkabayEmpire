import { useQuery } from "@tanstack/react-query";
import { type Product } from "@shared/schema";
import ProductCard from "./ProductCard";
import LoadingAnimation from "./animations/LoadingAnimation";
import EmptyStateAnimation from "./animations/EmptyStateAnimation";
import { Sparkles, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";

export default function Marketplace() {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: recommendations } = useQuery<{ productId: string; reason: string }[]>({
    queryKey: ["/api/recommend"],
  });

  const recommendedProductIds = recommendations?.map(r => r.productId) || [];
  const recommendedProducts = products?.filter(p => recommendedProductIds.includes(p.id)) || [];

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <section id="marketplace" className="py-12 md:py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="font-display font-bold text-3xl md:text-4xl mb-3" data-testid="text-marketplace-title">
            Marketplace Caribéenne
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-marketplace-subtitle">
            Découvrez nos produits sélectionnés et gagnez 5% de cashback en IKB tokens
          </p>
        </motion.div>

        {recommendedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-10"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-lg md:text-xl flex items-center gap-2" data-testid="text-recommended-title">
                <Sparkles className="w-5 h-5 text-ikabay-orange" />
                Recommandés pour vous
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={scrollRight}
                className="hidden md:flex items-center gap-1 text-ikabay-orange hover:text-ikabay-orange/80"
                data-testid="button-scroll-right"
              >
                Voir plus
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {recommendedProducts.map((product, idx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="flex-shrink-0 w-[280px] md:w-[320px] snap-start"
                >
                  <ProductCard product={product} index={idx} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        <h3 className="font-display font-semibold text-lg md:text-xl mb-5" data-testid="text-all-products-title">
          Tous les produits
        </h3>
        
        {isLoading ? (
          <LoadingAnimation size={100} className="py-16" />
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {products.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: idx * 0.03 }}
              >
                <ProductCard product={product} index={idx} />
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyStateAnimation 
            size={140} 
            message="Aucun produit disponible pour le moment"
          />
        )}
      </div>
    </section>
  );
}
