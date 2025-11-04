import { useQuery } from "@tanstack/react-query";
import { MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import caribbeanMarketImg from "@assets/stock_images/caribbean_marketplac_97e8d2f1.jpg?w=1200&format=webp&quality=80";

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
      <svg className="absolute bottom-0 w-full h-32 md:h-48 z-10 pointer-events-none" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <motion.path
          initial={{ d: "M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,154.7C672,160,768,224,864,229.3C960,235,1056,181,1152,165.3C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" }}
          animate={{
            d: [
              "M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,154.7C672,160,768,224,864,229.3C960,235,1056,181,1152,165.3C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
              "M0,192L48,197.3C96,203,192,213,288,192C384,171,480,117,576,117.3C672,117,768,171,864,181.3C960,192,1056,160,1152,154.7C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
              "M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,154.7C672,160,768,224,864,229.3C960,235,1056,181,1152,165.3C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            ]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          fill="hsl(var(--background))"
          opacity="0.95"
        />
      </svg>
      
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${caribbeanMarketImg})`,
        }}
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-ikabay-dark/85 via-ikabay-dark/50 to-ikabay-dark/20" />
      
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
