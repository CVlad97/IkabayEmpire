import { type FoodItem } from "@shared/schema";
import { Clock, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface FoodCardProps {
  food: FoodItem;
  index?: number;
  estimatedDelivery?: number;
}

export default function FoodCard({ food, index = 0, estimatedDelivery = 30 }: FoodCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      data-testid={`card-food-${food.id}`}
    >
      <Card className="overflow-hidden hover-elevate transition-all duration-200 group">
        <div className="flex flex-col md:flex-row">
          <div className="relative w-full md:w-48 aspect-[4/3] md:aspect-square overflow-hidden shrink-0">
            <img
              src={food.image}
              alt={food.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              data-testid={`img-food-${food.id}`}
            />
            <Badge 
              className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-ikabay-dark border-0"
              data-testid={`badge-prep-time-${food.id}`}
            >
              <Clock className="w-3 h-3 mr-1" />
              {food.prepTime} min
            </Badge>
            {!food.available && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Badge variant="destructive">Non disponible</Badge>
              </div>
            )}
          </div>
          
          <div className="p-6 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1" data-testid={`text-restaurant-${food.id}`}>
                    {food.restaurant}
                  </p>
                  <h3 className="font-display font-semibold text-lg mb-2" data-testid={`text-food-name-${food.id}`}>
                    {food.name}
                  </h3>
                  <Badge variant="secondary" className="text-xs mb-3" data-testid={`badge-food-category-${food.id}`}>
                    {food.category}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4" data-testid={`text-food-description-${food.id}`}>
                {food.description}
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display font-bold text-xl text-ikabay-dark dark:text-white" data-testid={`text-food-price-${food.id}`}>
                  {food.price.toFixed(2)} €
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1" data-testid={`text-delivery-time-${food.id}`}>
                  <MapPin className="w-3 h-3" />
                  Livraison ~{estimatedDelivery} min
                </p>
              </div>
              <Button
                disabled={!food.available}
                className="rounded-xl font-semibold"
                data-testid={`button-order-${food.id}`}
              >
                Commander
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
