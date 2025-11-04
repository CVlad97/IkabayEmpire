import { useEffect } from "react";
import { useLocation } from "wouter";

export default function FoodPage() {
  const [, navigate] = useLocation();

  useEffect(() => {
    navigate("/");
    
    setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const element = document.getElementById("delikreol");
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      });
    }, 300);
  }, [navigate]);

  return null;
}
