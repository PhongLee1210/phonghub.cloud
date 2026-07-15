import { HeroAssistant } from "@/components/chat/hero-assistant";
import { HeroInteractive } from "@/components/home/hero-interactive";
import { PhotoCollage } from "@/components/home/photo-collage";
import { ScrollToExplore } from "@/components/home/scroll-to-explore";
import { getDeviceHint } from "@/lib/device";

export const Hero = async () => {
  const { isMobile } = await getDeviceHint();

  return (
    <section className="relative min-h-screen overflow-hidden">
      <HeroInteractive isMobile={isMobile} />
      <PhotoCollage />
      <HeroAssistant isMobile={isMobile} />
      <ScrollToExplore />
    </section>
  );
};
