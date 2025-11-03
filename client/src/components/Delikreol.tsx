import { useQuery } from "@tanstack/react-query";
import { type FoodItem } from "@shared/schema";
import FoodCard from "./FoodCard";
import { Skeleton } from "@/components/ui/skeleton";
import { UtensilsCrossed, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function Delikreol() {
  const { data: foodItems, isLoading } = useQuery<FoodItem[]>({
    queryKey: ["/api/food"],
  });

  const { data: location } = useQuery<{
    city: string;
    region: string;
    latitude: number;
    longitude: number;
  }>({
    queryKey: ["/api/geolocation"],
  });

  return (
    <section id="delikreol" className="py-16 md:py-20 px-4 bg-card">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display font-bold text-3xl md:text-4xl mb-4" data-testid="text-delikreol-title">
            Delikreol - Livraison Locale
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-delikreol-subtitle">
            Savourez les délices caribéens livrés chez vous
          </p>
        </div>

        <Card className="mb-12 overflow-hidden" data-testid="map-delivery">
          <div className="relative h-[400px] bg-gradient-to-br from-ikabay-green/20 to-ikabay-orange/20">
            {location && (
              <div className="absolute inset-0" style={{
                backgroundImage: `url('https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+FF914D(${location.longitude},${location.latitude})/${location.longitude},${location.latitude},13,0/800x400@2x?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }} />
            )}
            <div className="absolute bottom-6 left-6 right-6">
              <div className="bg-white/90 backdrop-blur-md rounded-xl p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-ikabay-orange" />
                  <div>
                    <p className="font-semibold">Zone de livraison</p>
                    <p className="text-sm text-muted-foreground">
                      {location ? `${location.city}, ${location.region}` : "Fort-de-France, Martinique"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {isLoading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="w-48 h-48 rounded-xl shrink-0" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : foodItems && foodItems.length > 0 ? (
          <div className="space-y-6">
            {foodItems.map((food, idx) => (
              <FoodCard key={food.id} food={food} index={idx} estimatedDelivery={25 + Math.floor(Math.random() * 15)} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <UtensilsCrossed className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground" data-testid="text-no-food">
              Aucun plat disponible pour le moment
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
