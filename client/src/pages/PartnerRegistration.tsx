import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MapPin, Phone, Mail, Building, Truck, Package, User, Check } from "lucide-react";
import { motion } from "framer-motion";

// GPS location picker component
function LocationPicker({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  const [position, setPosition] = useState<[number, number] | null>(null);

  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
        onLocationSelect(lat, lng);
      },
    });
    return position ? <Marker position={position} /> : null;
  };

  return (
    <MapContainer
      center={[14.6415, -61.0242]} // Martinique center
      zoom={10}
      style={{ height: "400px", width: "100%", borderRadius: "8px" }}
      data-testid="map-location-picker"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler />
    </MapContainer>
  );
}

// Signature canvas component
function SignaturePad({ onSignatureChange }: { onSignatureChange: (signature: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onSignatureChange(canvas.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onSignatureChange("");
  };

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={600}
        height={200}
        className="border rounded-md cursor-crosshair w-full bg-white"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        data-testid="canvas-signature"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={clearSignature}
        data-testid="button-clear-signature"
      >
        Effacer la signature
      </Button>
    </div>
  );
}

// Registration form schema
const registrationSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, "Numéro de téléphone invalide"),
  whatsappNumber: z.string().optional().or(z.literal("")),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  type: z.enum(["delivery_driver", "relay_operator", "food_partner", "storage"]),
  zone: z.string().min(1, "La zone est requise"),
  address: z.string().min(5, "L'adresse doit contenir au moins 5 caractères"),
  coords: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  vehicleType: z.string().optional().or(z.literal("")),
  storageCapacity: z.coerce.number().optional().or(z.literal("")).transform(val => val === "" ? undefined : val),
  cgvAccepted: z.boolean().refine(val => val === true, {
    message: "Vous devez accepter les CGV",
  }),
  signatureData: z.string().optional().or(z.literal("")),
});

type RegistrationForm = z.infer<typeof registrationSchema>;

export default function PartnerRegistration() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [signature, setSignature] = useState("");

  const form = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: "",
      phone: "",
      whatsappNumber: "",
      email: "",
      type: "delivery_driver",
      zone: "",
      address: "",
      cgvAccepted: false,
    },
  });

  const partnerType = form.watch("type");

  const registerMutation = useMutation({
    mutationFn: async (data: RegistrationForm) => {
      const res = await apiRequest("POST", "/api/partners/register", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Inscription réussie!",
        description: "Votre demande a été soumise. Vous serez notifié par WhatsApp une fois approuvé.",
      });
      form.reset();
      setStep(1);
      setGpsCoords(null);
      setSignature("");
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erreur d'inscription",
        description: error.message || "Une erreur est survenue lors de l'inscription",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegistrationForm) => {
    console.log("Form submission started", { data, gpsCoords, signature: signature ? 'present' : 'missing' });
    
    if (!gpsCoords) {
      console.warn("GPS coords missing");
      toast({
        title: "GPS recommandé",
        description: "La localisation GPS améliorera votre inscription",
      });
    }

    if (!signature) {
      console.warn("Signature missing");
      toast({
        title: "Signature recommandée",
        description: "La signature renforce votre demande",
      });
    }

    console.log("Calling mutation with data:", {
      ...data,
      coords: gpsCoords || undefined,
      signatureData: signature || undefined,
    });

    registerMutation.mutate({
      ...data,
      coords: gpsCoords || undefined,
      signatureData: signature || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ikabay-orange/5 via-background to-ikabay-green/5 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="mb-6">
            <CardHeader className="text-center">
              <CardTitle className="font-display text-3xl md:text-4xl text-ikabay-orange flex items-center justify-center gap-2" data-testid="title-partner-registration">
                <Building className="w-8 h-8" />
                Devenir Partenaire IKABAY
              </CardTitle>
              <CardDescription className="text-base">
                Rejoignez notre réseau caribéen et gagnez des IKB tokens
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Progress indicator */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className={`flex items-center gap-2 ${step >= 1 ? 'text-ikabay-orange' : 'text-muted-foreground'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-ikabay-orange text-white' : 'bg-muted'}`}>
                    {step > 1 ? <Check className="w-4 h-4" /> : '1'}
                  </div>
                  <span className="text-sm font-medium hidden md:inline">Informations</span>
                </div>
                <div className="h-0.5 w-16 bg-border"></div>
                <div className={`flex items-center gap-2 ${step >= 2 ? 'text-ikabay-orange' : 'text-muted-foreground'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-ikabay-orange text-white' : 'bg-muted'}`}>
                    {step > 2 ? <Check className="w-4 h-4" /> : '2'}
                  </div>
                  <span className="text-sm font-medium hidden md:inline">Localisation</span>
                </div>
                <div className="h-0.5 w-16 bg-border"></div>
                <div className={`flex items-center gap-2 ${step >= 3 ? 'text-ikabay-orange' : 'text-muted-foreground'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-ikabay-orange text-white' : 'bg-muted'}`}>
                    3
                  </div>
                  <span className="text-sm font-medium hidden md:inline">Validation</span>
                </div>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Step 1: Basic Information */}
                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="type">Type de partenaire</Label>
                      <Select
                        value={form.watch("type")}
                        onValueChange={(value) => form.setValue("type", value as any)}
                      >
                        <SelectTrigger data-testid="select-partner-type">
                          <SelectValue placeholder="Choisissez votre rôle" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="delivery_driver" data-testid="option-type-delivery">
                            <div className="flex items-center gap-2">
                              <Truck className="w-4 h-4" />
                              Livreur
                            </div>
                          </SelectItem>
                          <SelectItem value="relay_operator" data-testid="option-type-relay">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              Opérateur de Point Relais
                            </div>
                          </SelectItem>
                          <SelectItem value="food_partner" data-testid="option-type-food">
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4" />
                              Restaurant Partenaire
                            </div>
                          </SelectItem>
                          <SelectItem value="storage" data-testid="option-type-storage">
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4" />
                              Entrepôt de Stockage
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {form.formState.errors.type && (
                        <p className="text-sm text-destructive">{form.formState.errors.type.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">Nom complet / Raison sociale</Label>
                      <Input
                        id="name"
                        {...form.register("name")}
                        placeholder="Jean Dupont ou SARL Mon Entreprise"
                        data-testid="input-name"
                      />
                      {form.formState.errors.name && (
                        <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Téléphone</Label>
                        <Input
                          id="phone"
                          {...form.register("phone")}
                          placeholder="+596 696 12 34 56"
                          data-testid="input-phone"
                        />
                        {form.formState.errors.phone && (
                          <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="whatsappNumber">WhatsApp (optionnel)</Label>
                        <Input
                          id="whatsappNumber"
                          {...form.register("whatsappNumber")}
                          placeholder="+596 696 12 34 56"
                          data-testid="input-whatsapp"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email (optionnel)</Label>
                      <Input
                        id="email"
                        type="email"
                        {...form.register("email")}
                        placeholder="contact@exemple.com"
                        data-testid="input-email"
                      />
                      {form.formState.errors.email && (
                        <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zone">Zone d'intervention</Label>
                      <Select
                        value={form.watch("zone")}
                        onValueChange={(value) => form.setValue("zone", value)}
                      >
                        <SelectTrigger data-testid="select-zone">
                          <SelectValue placeholder="Sélectionnez une zone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Martinique">Martinique</SelectItem>
                          <SelectItem value="Guadeloupe">Guadeloupe</SelectItem>
                          <SelectItem value="Saint-Martin">Saint-Martin</SelectItem>
                          <SelectItem value="Saint-Barthélemy">Saint-Barthélemy</SelectItem>
                          <SelectItem value="La Réunion">La Réunion</SelectItem>
                          <SelectItem value="Guyane">Guyane</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.formState.errors.zone && (
                        <p className="text-sm text-destructive">{form.formState.errors.zone.message}</p>
                      )}
                    </div>

                    {partnerType === "delivery_driver" && (
                      <div className="space-y-2">
                        <Label htmlFor="vehicleType">Type de véhicule</Label>
                        <Select
                          value={form.watch("vehicleType") || ""}
                          onValueChange={(value) => form.setValue("vehicleType", value)}
                        >
                          <SelectTrigger data-testid="select-vehicle">
                            <SelectValue placeholder="Sélectionnez un véhicule" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="scooter">Scooter</SelectItem>
                            <SelectItem value="bike">Vélo</SelectItem>
                            <SelectItem value="car">Voiture</SelectItem>
                            <SelectItem value="truck">Camionnette</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {(partnerType === "relay_operator" || partnerType === "storage") && (
                      <div className="space-y-2">
                        <Label htmlFor="storageCapacity">Capacité de stockage (nombre de colis)</Label>
                        <Input
                          id="storageCapacity"
                          type="number"
                          {...form.register("storageCapacity", { valueAsNumber: true })}
                          placeholder="50"
                          data-testid="input-capacity"
                        />
                      </div>
                    )}

                    <Button
                      type="button"
                      className="w-full"
                      onClick={() => setStep(2)}
                      data-testid="button-next-step1"
                    >
                      Suivant: Localisation
                    </Button>
                  </motion.div>
                )}

                {/* Step 2: Location Picker */}
                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="address">Adresse complète</Label>
                      <Textarea
                        id="address"
                        {...form.register("address")}
                        placeholder="12 Rue de la République, 97200 Fort-de-France"
                        rows={3}
                        data-testid="textarea-address"
                      />
                      {form.formState.errors.address && (
                        <p className="text-sm text-destructive">{form.formState.errors.address.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Localisation GPS (cliquez sur la carte)</Label>
                      <p className="text-sm text-muted-foreground">
                        Cliquez sur la carte pour indiquer votre position exacte
                      </p>
                      <LocationPicker
                        onLocationSelect={(lat, lng) => {
                          setGpsCoords({ lat, lng });
                          form.setValue("coords", { lat, lng });
                        }}
                      />
                      {gpsCoords && (
                        <p className="text-sm text-green-600 flex items-center gap-2" data-testid="text-gps-coords">
                          <MapPin className="w-4 h-4" />
                          Position enregistrée: {gpsCoords.lat.toFixed(4)}, {gpsCoords.lng.toFixed(4)}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep(1)}
                        data-testid="button-back-step2"
                      >
                        Retour
                      </Button>
                      <Button
                        type="button"
                        className="flex-1"
                        onClick={() => {
                          if (!gpsCoords) {
                            toast({
                              title: "GPS requis",
                              description: "Veuillez sélectionner votre localisation sur la carte",
                              variant: "destructive",
                            });
                            return;
                          }
                          setStep(3);
                        }}
                        data-testid="button-next-step2"
                      >
                        Suivant: Validation
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: CGV & Signature */}
                {step === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div className="border rounded-lg p-4 bg-muted/50 max-h-60 overflow-y-auto">
                      <h3 className="font-semibold mb-2">Conditions Générales de Vente (CGV)</h3>
                      <div className="text-sm space-y-2 text-muted-foreground">
                        <p>En vous inscrivant comme partenaire IKABAY EMPIRE, vous acceptez:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>De fournir un service de qualité aux clients IKABAY</li>
                          <li>De respecter les délais de livraison convenus</li>
                          <li>De maintenir votre profil et vos informations à jour</li>
                          <li>D'accepter les paiements en IKB tokens selon le barème établi</li>
                          <li>De respecter la charte de qualité IKABAY</li>
                          <li>De ne pas sous-traiter vos missions sans autorisation</li>
                          <li>De maintenir une note de satisfaction minimum de 4/5</li>
                        </ul>
                        <p className="mt-4">
                          IKABAY se réserve le droit de suspendre ou résilier votre compte en cas de non-respect des CGV.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="cgvAccepted"
                        checked={form.watch("cgvAccepted")}
                        onCheckedChange={(checked) => form.setValue("cgvAccepted", checked as boolean)}
                        data-testid="checkbox-cgv"
                      />
                      <Label htmlFor="cgvAccepted" className="text-sm font-normal cursor-pointer">
                        J'accepte les Conditions Générales de Vente
                      </Label>
                    </div>
                    {form.formState.errors.cgvAccepted && (
                      <p className="text-sm text-destructive">{form.formState.errors.cgvAccepted.message}</p>
                    )}

                    <div className="space-y-2">
                      <Label>Signature électronique</Label>
                      <p className="text-sm text-muted-foreground">
                        Signez ci-dessous pour valider votre inscription
                      </p>
                      <SignaturePad onSignatureChange={setSignature} />
                      {signature && (
                        <p className="text-sm text-green-600 flex items-center gap-2" data-testid="text-signature-saved">
                          <Check className="w-4 h-4" />
                          Signature enregistrée
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep(2)}
                        data-testid="button-back-step3"
                      >
                        Retour
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={registerMutation.isPending}
                        data-testid="button-submit-registration"
                      >
                        {registerMutation.isPending ? "Inscription en cours..." : "Valider mon inscription"}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
