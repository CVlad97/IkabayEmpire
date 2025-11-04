import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import BottomNav from "@/components/BottomNav";
import LoadingAnimation from "@/components/animations/LoadingAnimation";
import Landing from "@/pages/Landing";

const Home = lazy(() => import("@/pages/Home"));
const Admin = lazy(() => import("@/pages/Admin"));
const ProduitsLocaux = lazy(() => import("@/pages/ProduitsLocaux"));
const RelayMap = lazy(() => import("@/pages/RelayMap"));
const PartnerRegistration = lazy(() => import("@/pages/PartnerRegistration"));
const DropshippingAdmin = lazy(() => import("@/pages/DropshippingAdmin"));
const PriceCalculatorPage = lazy(() => import("@/pages/PriceCalculatorPage"));
const WalletPage = lazy(() => import("@/pages/WalletPage"));
const FoodPage = lazy(() => import("@/pages/FoodPage"));
const NotFound = lazy(() => import("@/pages/not-found"));

function RouterContent() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show landing page while loading or if not authenticated
  if (isLoading || !isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route component={Landing} />
      </Switch>
    );
  }

  // Show authenticated routes with BottomNav
  return (
    <>
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><LoadingAnimation size={80} /></div>}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/produits-locaux" component={ProduitsLocaux} />
          <Route path="/relay-map" component={RelayMap} />
          <Route path="/partner-registration" component={PartnerRegistration} />
          <Route path="/calculateur-prix" component={PriceCalculatorPage} />
          <Route path="/wallet" component={WalletPage} />
          <Route path="/food" component={FoodPage} />
          <Route path="/admin" component={Admin} />
          <Route path="/dropshipping" component={DropshippingAdmin} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
      <BottomNav />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <div className="pb-16 md:pb-0">
          <RouterContent />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
