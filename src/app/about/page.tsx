import Header from "@/components/Header";
import AboutHero from "@/components/sections/AboutHero";
import Experience from "@/components/sections/Experience";
import SkillsExpertise from "@/components/sections/SkillsExpertise";
import Education from "@/components/sections/Education";

export default function About() {
  return (
    <>
      <Header />
      <main className="pt-32 min-h-screen">
        <AboutHero />
        <Experience />
        <SkillsExpertise />
        <Education />
      </main>
    </>
  );
}
