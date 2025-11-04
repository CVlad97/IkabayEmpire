import { type Product } from "@shared/schema";
import { ShoppingCart, Share2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const purchaseMutation = useMutation({
    mutationFn: async (productId: string) => {
      return apiRequest("POST", "/api/purchase", { productId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Achat réussi!",
        description: `Vous avez reçu 5% de cashback en IKB tokens!`,
      });
    },
  });

  const shareMutation = useMutation({
    mutationFn: async (productId: string) => {
      return apiRequest("POST", "/api/share", { productId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      toast({
        title: "Partagé!",
        description: "Vous avez gagné 10 IKB tokens!",
      });
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      data-testid={`card-product-${product.id}`}
    >
      <Card className="overflow-hidden hover-elevate transition-all duration-200 group">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            data-testid={`img-product-${product.id}`}
          />
          <Badge 
            className="absolute top-3 right-3 bg-ikabay-green/90 backdrop-blur-sm text-white border-0 px-3 py-1"
            data-testid={`badge-cashback-${product.id}`}
          >
            <Sparkles className="w-3 h-3 mr-1" />
            5% IKB Cashback
          </Badge>
          {!product.inStock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Badge variant="destructive" className="text-sm">Rupture de stock</Badge>
            </div>
          )}
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs" data-testid={`badge-category-${product.id}`}>
                {product.category}
              </Badge>
              {product.source && product.source !== "local" && (
                <Badge variant="outline" className="text-xs bg-ikabay-orange/10 text-ikabay-orange border-ikabay-orange/30" data-testid={`badge-source-${product.id}`}>
                  Source: {product.source.toUpperCase()}
                </Badge>
              )}
            </div>
            <h3 className="font-display font-semibold text-xl mb-2" data-testid={`text-product-name-${product.id}`}>
              {product.name}
            </h3>
            <p className="text-muted-foreground text-sm line-clamp-2" data-testid={`text-product-description-${product.id}`}>
              {product.description}
            </p>
          </div>
          
          <div className="flex items-end justify-between">
            <div>
              <p className="font-display font-bold text-2xl text-ikabay-dark dark:text-white" data-testid={`text-product-price-${product.id}`}>
                {product.price.toFixed(2)} €
              </p>
              <p className="text-xs text-ikabay-green font-medium" data-testid={`text-product-reward-${product.id}`}>
                +{(product.price * 0.05).toFixed(2)} IKB
              </p>
            </div>
            
            <Button
              size="icon"
              variant="ghost"
              onClick={() => shareMutation.mutate(product.id)}
              disabled={shareMutation.isPending}
              className="shrink-0"
              data-testid={`button-share-${product.id}`}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
          
          <Button
            className="w-full rounded-xl font-semibold"
            onClick={() => purchaseMutation.mutate(product.id)}
            disabled={purchaseMutation.isPending || !product.inStock}
            data-testid={`button-buy-${product.id}`}
          >
            {purchaseMutation.isPending ? (
              "Traitement..."
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Acheter maintenant
              </>
            )}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
