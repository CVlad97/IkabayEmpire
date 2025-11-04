import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import BottomNav from "@/components/BottomNav";
import Home from "@/pages/Home";
import Admin from "@/pages/Admin";
import Landing from "@/pages/Landing";
import ProduitsLocaux from "@/pages/ProduitsLocaux";
import RelayMap from "@/pages/RelayMap";
import PartnerRegistration from "@/pages/PartnerRegistration";
import DropshippingAdmin from "@/pages/DropshippingAdmin";
import PriceCalculatorPage from "@/pages/PriceCalculatorPage";
import SectionRedirect from "@/pages/SectionRedirect";
import NotFound from "@/pages/not-found";

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
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/produits-locaux" component={ProduitsLocaux} />
        <Route path="/relay-map" component={RelayMap} />
        <Route path="/partner-registration" component={PartnerRegistration} />
        <Route path="/calculateur-prix" component={PriceCalculatorPage} />
        <Route path="/wallet" component={() => <SectionRedirect sectionId="crypto" />} />
        <Route path="/food" component={() => <SectionRedirect sectionId="delikreol" />} />
        <Route path="/admin" component={Admin} />
        <Route path="/dropshipping" component={DropshippingAdmin} />
        <Route component={NotFound} />
      </Switch>
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
