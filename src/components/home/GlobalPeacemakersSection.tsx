import Image from "next/image";
import PixelTransition from "@/components/ui/PixelTransition";

export default function GlobalPeacemakersSection() {
  return (
    <section className="w-full bg-white text-[#0c0c0c] py-20 sm:py-28 lg:py-32 px-6 sm:px-10 lg:px-12 overflow-hidden">
      <div className="max-w-[1400px] mx-auto w-full flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
        {/* Left Column: Heading, Description & Action Pill Button */}
        <div className="w-full lg:w-[46%] flex flex-col items-start">
          <h2 className="font-open-sauce text-4xl sm:text-5xl md:text-6xl lg:text-[64px] font-medium tracking-tight leading-[1.06] text-[#0c0c0c] mb-6">
            Building a world of
            <br />
            peace, compassion
            <br />
            &amp; hope
          </h2>

          <p className="font-open-sauce text-base sm:text-lg text-[#0c0c0c]/60 font-normal leading-relaxed max-w-[540px] mb-10">
            The Global Peace Makers is our registered UK charity initiative in
            Birmingham dedicated to empowering communities—providing essential
            hot meals, shelter support, poverty relief, and educational
            opportunities for a brighter future.
          </p>

          {/* Cloned Pill Action Component -> Navigates to The Global Peacemakers */}
          <a
            href="https://theglobalpeacemakers.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full max-w-[430px] bg-[#f4f4f5] hover:bg-[#ededf0] p-2 flex items-center justify-between gap-4 transition-colors duration-300 group"
          >
            <span className="font-open-sauce text-sm sm:text-base text-[#0c0c0c]/55 pl-4 truncate">
              theglobalpeacemakers.org
            </span>
            <span className="bg-[#141414] group-hover:bg-[#0048ff] text-white font-open-sauce text-sm font-semibold px-7 py-3.5 sm:py-4 transition-colors duration-300 shrink-0">
              Visit Website
            </span>
          </a>
        </div>

        {/* Right Column: Image Card with PixelTransition */}
        <div className="w-full lg:w-[50%]">
          <a
            href="https://theglobalpeacemakers.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="relative w-full aspect-[4/3] sm:aspect-[16/11] overflow-hidden bg-[#ecebe6] block group cursor-pointer"
          >
            <PixelTransition
              gridSize={10}
              pixelColor="#0048FF"
              animationStepDuration={0.4}
              aspectRatio="0"
              className="w-full h-full"
              firstContent={
                <div className="relative w-full h-full">
                  <Image
                    src="/global-peacemakers.jpg"
                    alt="The Global Peace Makers community outreach in Birmingham"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-105"
                  />
                </div>
              }
              secondContent={
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#0048FF] p-8 sm:p-12 text-center">
                  <span className="font-open-sauce text-[10px] font-bold uppercase tracking-[0.25em] text-white/80 mb-3 border border-white/30 px-3 py-1 rounded-full">
                    Registered UK Charity • Birmingham
                  </span>
                  <h3 className="text-white font-ancola text-3xl sm:text-4xl lowercase tracking-tight mb-4">
                    The Global Peace Makers
                  </h3>
                  <p className="text-white/85 font-open-sauce text-sm sm:text-base leading-relaxed max-w-md">
                    Restoring dignity, ending hunger, and spreading peace
                    through compassionate support across Birmingham and beyond.
                  </p>
                  <span className="text-white font-open-sauce text-xs font-bold uppercase tracking-widest mt-6 underline underline-offset-4">
                    Explore theglobalpeacemakers.org →
                  </span>
                </div>
              }
            />
          </a>
        </div>
      </div>
    </section>
  );
}
