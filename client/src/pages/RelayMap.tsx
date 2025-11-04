import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { Icon, divIcon, point } from "leaflet";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Phone, Clock, Package, User, Navigation } from "lucide-react";
import { motion } from "framer-motion";
import "leaflet/dist/leaflet.css";

// Fix Leaflet icon issue with Vite
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Relay {
  id: string;
  name: string;
  operatorId: string | null;
  address: string;
  coords: { lat: number; lng: number } | null;
  zone: string;
  phone: string;
  whatsappNumber: string | null;
  capacity: number;
  currentLoad: number;
  status: string;
  hoursOpen: string | null;
  partner?: {
    id: string;
    phone: string;
    type: string;
    rating: number;
    totalDeliveries: number;
  } | null;
}

// Custom marker icons based on status
const createCustomIcon = (status: string) => {
  const color = status === 'active' ? '#2ECC71' : status === 'full' ? '#FF914D' : '#94A3B8';
  return divIcon({
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
    className: "custom-marker",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Component to recenter map when user location changes
function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 12);
  }, [center, map]);
  return null;
}

export default function RelayMap() {
  const [filterZone, setFilterZone] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedRelay, setSelectedRelay] = useState<Relay | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number]>([14.6415, -61.0242]); // Default: Fort-de-France

  // Fetch user's geolocation
  const { data: geoData } = useQuery<{ latitude: number; longitude: number }>({
    queryKey: ["/api/geolocation"],
  });

  // Update user location when geolocation data arrives
  useEffect(() => {
    if (geoData) {
      setUserLocation([geoData.latitude, geoData.longitude]);
    }
  }, [geoData]);

  // Fetch relay points with optional filters
  const buildQueryUrl = () => {
    const params = new URLSearchParams();
    if (filterZone !== "all") params.append("zone", filterZone);
    if (filterStatus !== "all") params.append("status", filterStatus);
    const queryString = params.toString();
    return `/api/relay-points${queryString ? `?${queryString}` : ''}`;
  };

  const { data: relays = [], isLoading } = useQuery<Relay[]>({
    queryKey: ["/api/relay-points", filterZone, filterStatus],
    queryFn: async () => {
      const response = await fetch(buildQueryUrl());
      if (!response.ok) throw new Error('Failed to fetch relay points');
      return response.json();
    },
  });

  // Get unique zones for filter
  const zones = Array.from(new Set(relays.map(r => r.zone))).sort();

  // Filter relays based on selected filters
  const filteredRelays = relays.filter(relay => {
    if (!relay.coords) return false;
    if (filterZone !== "all" && relay.zone !== filterZone) return false;
    if (filterStatus !== "all" && relay.status !== filterStatus) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      active: { variant: "default", label: "Actif" },
      full: { variant: "secondary", label: "Complet" },
      inactive: { variant: "outline", label: "Inactif" },
    };
    const config = variants[status] || variants.inactive;
    return (
      <Badge variant={config.variant} data-testid={`badge-status-${status}`}>
        {config.label}
      </Badge>
    );
  };

  const getLoadPercentage = (relay: Relay) => {
    return Math.round((relay.currentLoad / relay.capacity) * 100);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border-b"
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2" data-testid="title-relay-map">
                <MapPin className="w-8 h-8 text-ikabay-orange" />
                Carte des Relais IKABAY
              </h1>
              <p className="text-muted-foreground mt-1" data-testid="text-relay-count">
                {filteredRelays.length} point{filteredRelays.length !== 1 ? 's' : ''} relais disponible{filteredRelays.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={filterZone} onValueChange={setFilterZone}>
                <SelectTrigger className="w-[180px]" data-testid="select-zone-filter">
                  <SelectValue placeholder="Filtrer par zone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les zones</SelectItem>
                  {zones.map(zone => (
                    <SelectItem key={zone} value={zone} data-testid={`option-zone-${zone}`}>
                      {zone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="full">Complets</SelectItem>
                  <SelectItem value="inactive">Inactifs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Map Container */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-2"
          >
            <Card className="overflow-hidden" data-testid="card-map-container">
              <CardContent className="p-0">
                {isLoading ? (
                  <Skeleton className="w-full h-[600px]" data-testid="skeleton-map" />
                ) : (
                  <MapContainer
                    center={userLocation}
                    zoom={12}
                    style={{ height: "600px", width: "100%" }}
                    className="z-0"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <RecenterMap center={userLocation} />
                    
                    <MarkerClusterGroup
                      chunkedLoading
                      iconCreateFunction={(cluster: any) => {
                        return divIcon({
                          html: `<div style="background-color: #FF914D; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${cluster.getChildCount()}</div>`,
                          className: "custom-cluster",
                          iconSize: point(40, 40, true),
                        });
                      }}
                    >
                      {filteredRelays.map((relay) => (
                        relay.coords && (
                          <Marker
                            key={relay.id}
                            position={[relay.coords.lat, relay.coords.lng]}
                            icon={createCustomIcon(relay.status)}
                            eventHandlers={{
                              click: () => setSelectedRelay(relay),
                            }}
                          >
                            <Popup>
                              <div className="p-2" data-testid={`popup-relay-${relay.id}`}>
                                <h3 className="font-bold text-lg mb-2">{relay.name}</h3>
                                <p className="text-sm text-muted-foreground mb-2">{relay.address}</p>
                                <div className="flex items-center gap-2 mb-2">
                                  {getStatusBadge(relay.status)}
                                  <Badge variant="outline">
                                    {relay.currentLoad}/{relay.capacity}
                                  </Badge>
                                </div>
                                <Button
                                  size="sm"
                                  className="w-full"
                                  onClick={() => setSelectedRelay(relay)}
                                  data-testid={`button-view-details-${relay.id}`}
                                >
                                  Voir détails
                                </Button>
                              </div>
                            </Popup>
                          </Marker>
                        )
                      ))}
                    </MarkerClusterGroup>

                    {/* User location marker */}
                    <Marker position={userLocation}>
                      <Popup>
                        <div className="p-2">
                          <p className="font-semibold">Votre position</p>
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Details Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <Card data-testid="card-relay-details">
              <CardHeader>
                <CardTitle>
                  {selectedRelay ? "Détails du Relais" : "Sélectionnez un relais"}
                </CardTitle>
                <CardDescription>
                  {selectedRelay
                    ? "Informations complètes sur le point relais"
                    : "Cliquez sur un marqueur pour voir les détails"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedRelay ? (
                  <div className="space-y-4" data-testid={`details-relay-${selectedRelay.id}`}>
                    {/* Name & Status */}
                    <div>
                      <h3 className="font-bold text-xl mb-2" data-testid="text-relay-name">
                        {selectedRelay.name}
                      </h3>
                      {getStatusBadge(selectedRelay.status)}
                    </div>

                    {/* Address */}
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Adresse</p>
                        <p className="text-sm text-muted-foreground" data-testid="text-relay-address">
                          {selectedRelay.address}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Zone: {selectedRelay.zone}
                        </p>
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Contact</p>
                        <p className="text-sm text-muted-foreground" data-testid="text-relay-phone">
                          {selectedRelay.phone}
                        </p>
                        {selectedRelay.whatsappNumber && (
                          <p className="text-sm text-ikabay-green">
                            WhatsApp: {selectedRelay.whatsappNumber}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Hours */}
                    {selectedRelay.hoursOpen && (
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Horaires</p>
                          <p className="text-sm text-muted-foreground" data-testid="text-relay-hours">
                            {selectedRelay.hoursOpen}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Capacity */}
                    <div className="flex items-start gap-3">
                      <Package className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div className="w-full">
                        <p className="text-sm font-medium mb-2">Capacité</p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span data-testid="text-relay-load">
                              {selectedRelay.currentLoad} / {selectedRelay.capacity} colis
                            </span>
                            <span className="font-medium" data-testid="text-relay-percentage">
                              {getLoadPercentage(selectedRelay)}%
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                getLoadPercentage(selectedRelay) >= 90
                                  ? "bg-red-500"
                                  : getLoadPercentage(selectedRelay) >= 70
                                  ? "bg-ikabay-orange"
                                  : "bg-ikabay-green"
                              }`}
                              style={{ width: `${getLoadPercentage(selectedRelay)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Operator Info */}
                    {selectedRelay.partner && (
                      <div className="flex items-start gap-3 pt-4 border-t">
                        <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Opérateur</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" data-testid="badge-partner-type">
                              {selectedRelay.partner.type === "relay_operator"
                                ? "Opérateur Relais"
                                : "Livreur"}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              ⭐ {selectedRelay.partner.rating.toFixed(1)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {selectedRelay.partner.totalDeliveries} livraisons effectuées
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pt-4 space-y-2">
                      <Button className="w-full" data-testid="button-navigate">
                        <Navigation className="w-4 h-4 mr-2" />
                        Itinéraire
                      </Button>
                      {selectedRelay.whatsappNumber && (
                        <Button variant="outline" className="w-full" data-testid="button-whatsapp">
                          <Phone className="w-4 h-4 mr-2" />
                          Contacter via WhatsApp
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MapPin className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      Aucun relais sélectionné
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Cliquez sur un marqueur sur la carte pour voir les informations
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
