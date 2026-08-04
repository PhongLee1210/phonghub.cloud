import { BottomTabBar } from "@/components/common/bottom-tab-bar";
import { MainNav } from "@/components/common/main-nav";
import { ModeToggle } from "@/components/common/mode-toggle";
import { ScrollProgress } from "@/components/common/scroll-progress";
import { SiteFooter } from "@/components/common/site-footer";
import { HeroCanvas } from "@/components/home/hero-canvas";
import { routesConfig } from "@/config/routes";

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <HeroCanvas />
      <MainNav items={routesConfig.mainNav}>
        <ModeToggle />
      </MainNav>
      <main className="relative z-10 flex-1 pb-[calc(var(--safe-bottom,0px)+4rem)] md:pb-0">
        {children}
      </main>
      <BottomTabBar />
      <ScrollProgress />
      <SiteFooter />
    </div>
  );
}
