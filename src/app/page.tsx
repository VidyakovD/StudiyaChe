import HeroSection from "@/components/home/HeroSection";
import CourseGrid from "@/components/home/CourseGrid";
import NeuralNetwork from "@/components/home/NeuralNetwork";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <>
      <NeuralNetwork />
      <Header />
      <main className="flex-1 relative z-10">
        <HeroSection />
        <CourseGrid />
      </main>
      <Footer />
    </>
  );
}
