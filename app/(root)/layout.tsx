import { MainNav } from "@/components/common/main-nav";
import { ModeToggle } from "@/components/common/mode-toggle";
import { SiteFooter } from "@/components/common/site-footer";
import { routesConfig } from "@/config/routes";

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <MainNav items={routesConfig.mainNav}>
        <ModeToggle />
      </MainNav>
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
