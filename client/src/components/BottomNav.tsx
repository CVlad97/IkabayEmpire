import { Home, ShoppingBag, UtensilsCrossed, Wallet, Calculator } from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Accueil", path: "/", testId: "nav-home" },
  { icon: ShoppingBag, label: "Produits", path: "/produits-locaux", testId: "nav-products" },
  { icon: UtensilsCrossed, label: "Food", path: "#delikreol", testId: "nav-food", isAnchor: true },
  { icon: Wallet, label: "Wallet", path: "#crypto", testId: "nav-wallet", isAnchor: true },
  { icon: Calculator, label: "Prix", path: "/calculateur-prix", testId: "nav-calculator" },
];

export default function BottomNav() {
  const [location, navigate] = useLocation();

  const handleAnchorClick = (anchor: string) => {
    if (location !== "/") {
      navigate("/");
      setTimeout(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const element = document.getElementById(anchor);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          });
        });
      }, 300);
    } else {
      const element = document.getElementById(anchor);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t md:hidden shadow-lg"
      data-testid="bottom-nav"
    >
      <div className="flex items-center justify-around h-16 px-2 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.isAnchor ? false : location === item.path;

          if (item.isAnchor) {
            return (
              <button
                key={item.path}
                onClick={() => handleAnchorClick(item.path.replace('#', ''))}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-lg transition-all",
                  "hover-elevate active-elevate-2 touch-manipulation min-w-[64px]"
                )}
                data-testid={item.testId}
              >
                <Icon className="w-5 h-5 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <Link key={item.path} href={item.path}>
              <button
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-lg transition-all relative",
                  "touch-manipulation min-w-[64px]",
                  isActive
                    ? "text-ikabay-orange"
                    : "hover-elevate active-elevate-2"
                )}
                data-testid={item.testId}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-ikabay-orange/10 rounded-lg"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon className={cn(
                  "w-5 h-5 relative z-10",
                  isActive ? "text-ikabay-orange" : "text-muted-foreground"
                )} />
                <span className={cn(
                  "text-[10px] font-medium relative z-10",
                  isActive ? "text-ikabay-orange" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </button>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
