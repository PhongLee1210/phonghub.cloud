import { HeroCanvas } from "@/components/home/hero-canvas";
import { HeroInteractive } from "@/components/home/hero-interactive";
import { PhotoCollage } from "@/components/home/photo-collage";
import { ScrollToExplore } from "@/components/home/scroll-to-explore";
import { getDeviceHint } from "@/lib/device";

export const Hero = async () => {
  const { isMobile } = await getDeviceHint();

  return (
    <section className="relative min-h-screen overflow-hidden">
      <HeroCanvas />
      <HeroInteractive isMobile={isMobile} />
      <PhotoCollage />
      <ScrollToExplore />
    </section>
  );
};
