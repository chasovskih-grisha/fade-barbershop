import { FadeEmblem } from './FadeEmblem';

/** Cinematic atmospheric lighting with optimized blur and a soft emblem depth layer. */
export function HeroAtmosphere() {
  return (
    <>
      <div className="absolute -top-32 -right-32 w-[580px] h-[580px] rounded-full bg-accent-blue/25 blur-[140px] pointer-events-none animate-fade-glow will-change-transform" />
      <div className="absolute -bottom-28 -left-20 w-[620px] h-[620px] rounded-full bg-accent-blue/15 blur-[160px] pointer-events-none will-change-transform" />
      <div className="absolute top-1/4 right-12 opacity-60 hidden lg:block pointer-events-none group-hover:scale-105 group-hover:rotate-3 transition-transform duration-700 ease-out">
        <FadeEmblem className="w-80 h-80 text-accent-blue drop-shadow-[0_0_50px_rgba(59,130,246,0.5)]" />
      </div>
    </>
  );
}
