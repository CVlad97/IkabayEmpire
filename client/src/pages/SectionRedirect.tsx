import { useEffect } from "react";
import { useLocation } from "wouter";

interface SectionRedirectProps {
  sectionId: string;
}

export default function SectionRedirect({ sectionId }: SectionRedirectProps) {
  const [, navigate] = useLocation();

  useEffect(() => {
    navigate("/");
    
    setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const element = document.getElementById(sectionId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      });
    }, 300);
  }, [sectionId, navigate]);

  return null;
}
