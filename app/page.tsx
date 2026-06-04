import { HomeAboutSection } from "@/components/site/HomeAboutSection";
import { HomeHero } from "@/components/site/HomeHero";
import { HomeJoinSection } from "@/components/site/HomeJoinSection";
import { HomeQuickActions } from "@/components/site/HomeQuickActions";
import { HomeStatsBar } from "@/components/site/HomeStatsBar";

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <HomeQuickActions />
      <HomeStatsBar />
      <HomeAboutSection />
      <HomeJoinSection />
    </>
  );
}
