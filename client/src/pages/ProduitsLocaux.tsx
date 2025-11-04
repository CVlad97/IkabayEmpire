import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, MapPin, ShoppingCart, Heart } from "lucide-react";
import { useState } from "react";
import type { Artisan, ProduitLocal } from "@shared/schema";

interface ArtisanWithProduits extends Artisan {
  produits?: ProduitLocal[];
}

export default function ProduitsLocaux() {
  const [selectedLanguage, setSelectedLanguage] = useState<'fr' | 'en' | 'creole'>('fr');
  const [selectedArtisan, setSelectedArtisan] = useState<string | null>(null);

  // Fetch all artisans
  const { data: artisans, isLoading: artisansLoading } = useQuery<ArtisanWithProduits[]>({
    queryKey: ["/api/artisans"],
  });

  // Fetch all local products
  const { data: produits, isLoading: produitsLoading } = useQuery<ProduitLocal[]>({
    queryKey: ["/api/produits-locaux"],
  });

  // Filter products by selected artisan
  const filteredProduits = selectedArtisan
    ? produits?.filter(p => p.artisanId === selectedArtisan)
    : produits;

  const getStory = (produit: ProduitLocal) => {
    switch (selectedLanguage) {
      case 'en':
        return produit.storyEn || produit.storyFr || produit.description;
      case 'creole':
        return produit.storyCreole || produit.storyFr || produit.description;
      default:
        return produit.storyFr || produit.description;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Award className="h-12 w-12" />
            <h1 className="text-4xl md:text-5xl font-bold">Produits Locaux</h1>
          </div>
          <p className="text-xl text-center text-orange-100 max-w-3xl mx-auto">
            Découvrez l'authenticité caribéenne à travers nos artisans certifiés. 
            Chaque produit raconte une histoire unique de passion et de savoir-faire local.
          </p>
          
          {/* Language Selector */}
          <div className="flex justify-center gap-2 mt-6">
            <Button
              size="sm"
              variant={selectedLanguage === 'fr' ? 'default' : 'outline'}
              onClick={() => setSelectedLanguage('fr')}
              className="bg-white text-orange-600 hover:bg-orange-50 border-white"
              data-testid="button-language-fr"
            >
              Français
            </Button>
            <Button
              size="sm"
              variant={selectedLanguage === 'en' ? 'default' : 'outline'}
              onClick={() => setSelectedLanguage('en')}
              className="bg-white text-orange-600 hover:bg-orange-50 border-white"
              data-testid="button-language-en"
            >
              English
            </Button>
            <Button
              size="sm"
              variant={selectedLanguage === 'creole' ? 'default' : 'outline'}
              onClick={() => setSelectedLanguage('creole')}
              className="bg-white text-orange-600 hover:bg-orange-50 border-white"
              data-testid="button-language-creole"
            >
              Kréyòl
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Artisans Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
            <Award className="h-8 w-8 text-orange-500" />
            Nos Artisans Certifiés
          </h2>
          
          {artisansLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-48 w-full rounded-md mb-4" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : artisans && artisans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {artisans.map(artisan => (
                <Card 
                  key={artisan.id}
                  className={`cursor-pointer hover-elevate active-elevate-2 transition-all ${
                    selectedArtisan === artisan.id ? 'ring-2 ring-orange-500' : ''
                  }`}
                  onClick={() => setSelectedArtisan(selectedArtisan === artisan.id ? null : artisan.id)}
                  data-testid={`card-artisan-${artisan.id}`}
                >
                  <CardHeader className="p-0">
                    <div className="relative">
                      <img 
                        src={artisan.image} 
                        alt={artisan.name}
                        className="w-full h-48 object-cover rounded-t-md"
                        data-testid={`artisan-img-${artisan.id}`}
                      />
                      {artisan.certified && (
                        <Badge 
                          className="absolute top-3 right-3 bg-green-500 hover:bg-green-600"
                          data-testid={`artisan-badge-certified-${artisan.id}`}
                        >
                          <Award className="h-3 w-3 mr-1" />
                          Certifié
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <CardTitle className="text-xl mb-2" data-testid={`artisan-name-${artisan.id}`}>
                      {artisan.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 text-sm mb-2" data-testid={`artisan-region-${artisan.id}`}>
                      <MapPin className="h-4 w-4" />
                      {artisan.region}
                    </CardDescription>
                    <p className="text-sm text-muted-foreground mb-2" data-testid={`artisan-specialty-${artisan.id}`}>
                      {artisan.specialty}
                    </p>
                    <p className="text-sm line-clamp-2" data-testid={`artisan-bio-${artisan.id}`}>
                      {artisan.bio}
                    </p>
                    {artisan.videoUrl && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="px-0 text-orange-500 hover:text-orange-600 hover:bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (artisan.videoUrl) {
                            window.open(artisan.videoUrl, '_blank');
                          }
                        }}
                        data-testid={`artisan-button-video-${artisan.id}`}
                      >
                        Voir la vidéo →
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">
                  Aucun artisan disponible pour le moment. Les artisans caribéens arrivent bientôt!
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Products Section */}
        <div>
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
            <ShoppingCart className="h-8 w-8 text-green-500" />
            {selectedArtisan ? 'Produits de l\'Artisan' : 'Tous les Produits Locaux'}
          </h2>
          
          {produitsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i}>
                  <Skeleton className="h-64 w-full rounded-t-md" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : filteredProduits && filteredProduits.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProduits.map(produit => (
                <Card key={produit.id} className="overflow-hidden hover-elevate active-elevate-2" data-testid={`card-product-${produit.id}`}>
                  <CardHeader className="p-0">
                    <div className="relative">
                      <img 
                        src={produit.images[0]} 
                        alt={produit.name}
                        className="w-full h-64 object-cover"
                        data-testid={`product-img-${produit.id}`}
                      />
                      {produit.certifiedLocal && (
                        <Badge 
                          className="absolute top-3 left-3 bg-orange-500 hover:bg-orange-600"
                          data-testid={`product-badge-certified-${produit.id}`}
                        >
                          Made in Caribbean
                        </Badge>
                      )}
                      {!produit.inStock && (
                        <Badge 
                          className="absolute top-3 right-3 bg-red-500"
                          data-testid={`product-badge-out-of-stock-${produit.id}`}
                        >
                          Épuisé
                        </Badge>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute bottom-3 right-3 bg-white/90 hover:bg-white"
                        data-testid={`product-button-favorite-${produit.id}`}
                      >
                        <Heart className="h-5 w-5 text-red-500" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-lg" data-testid={`product-name-${produit.id}`}>
                        {produit.name}
                      </CardTitle>
                      <span className="text-xl font-bold text-green-600" data-testid={`product-price-${produit.id}`}>
                        {produit.price}€
                      </span>
                    </div>
                    
                    <CardDescription className="flex items-center gap-2 text-xs mb-3" data-testid={`product-origin-${produit.id}`}>
                      <MapPin className="h-3 w-3" />
                      {produit.origin}
                    </CardDescription>
                    
                    {/* AI-Generated Story */}
                    <div className="bg-orange-50 dark:bg-orange-950/20 border-l-4 border-orange-500 p-3 rounded-md mb-3" data-testid={`product-story-container-${produit.id}`}>
                      <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 mb-1">
                        L'histoire du produit
                      </p>
                      <p className="text-sm line-clamp-3 text-muted-foreground" data-testid={`product-story-${produit.id}`}>
                        {getStory(produit)}
                      </p>
                    </div>
                    
                    <Button 
                      className="w-full bg-green-500 hover:bg-green-600 text-white"
                      disabled={!produit.inStock}
                      data-testid={`product-button-add-cart-${produit.id}`}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {produit.inStock ? 'Ajouter au panier' : 'Épuisé'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">
                  {selectedArtisan 
                    ? 'Aucun produit disponible pour cet artisan.'
                    : 'Aucun produit local disponible pour le moment.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
