import { HeroCanvas } from "@/components/home/hero-canvas";
import { HeroInteractive } from "@/components/home/hero-interactive";
import { PhotoCollage } from "@/components/home/photo-collage";
import { ScrollToExplore } from "@/components/home/scroll-to-explore";

export const Hero = () => {
  return (
    <section className="relative min-h-screen overflow-hidden">
      <HeroCanvas />
      <HeroInteractive />
      <PhotoCollage />
      <ScrollToExplore />
    </section>
  );
};
