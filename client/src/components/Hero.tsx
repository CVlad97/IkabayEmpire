import { useQuery } from "@tanstack/react-query";
import { MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Hero() {
  const { data: story, isLoading: storyLoading } = useQuery<{ text: string; generatedAt: string }>({
    queryKey: ["/api/story"],
  });

  const { data: location, isLoading: locationLoading } = useQuery<{
    city: string;
    region: string;
    country: string;
    countryCode: string;
  }>({
    queryKey: ["/api/geolocation"],
  });

  return (
    <div className="relative w-full h-[80vh] md:h-[85vh] overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=2940&auto=format&fit=crop')`,
        }}
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-ikabay-dark/80 via-ikabay-dark/40 to-transparent" />
      
      <div className="relative h-full flex flex-col items-center justify-center px-4 text-center max-w-5xl mx-auto">
        {locationLoading ? (
          <div className="mb-6">
            <Loader2 className="w-5 h-5 animate-spin text-white/70" data-testid="loader-location" />
          </div>
        ) : location ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6"
            data-testid="location-badge"
          >
            <MapPin className="w-4 h-4 text-ikabay-orange" />
            <span className="text-sm font-medium text-white">
              {location.city}, {location.countryCode}
            </span>
          </motion.div>
        ) : null}

        {storyLoading ? (
          <div className="h-32 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-white" data-testid="loader-story" />
          </div>
        ) : (
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-display font-bold text-4xl md:text-5xl lg:text-6xl leading-tight text-white mb-6"
            data-testid="text-hero-title"
          >
            {story?.text || "Bienvenue à IKABAY EMPIRE"}
          </motion.h1>
        )}

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl"
          data-testid="text-hero-subtitle"
        >
          Découvrez, achetez, gagnez et partagez dans notre écosystème caribéen unique
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Button
            size="lg"
            className="px-8 py-6 text-lg font-semibold rounded-full bg-ikabay-orange hover:bg-ikabay-orange/90 text-white border-2 border-ikabay-orange shadow-xl"
            data-testid="button-explore-market"
            onClick={() => window.scrollTo({ top: document.getElementById('marketplace')?.offsetTop || 0, behavior: 'smooth' })}
          >
            Explorer le marché
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="px-8 py-6 text-lg font-semibold rounded-full bg-white/10 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white/20"
            data-testid="button-crypto-dashboard"
            onClick={() => window.scrollTo({ top: document.getElementById('crypto')?.offsetTop || 0, behavior: 'smooth' })}
          >
            Dashboard Crypto
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
