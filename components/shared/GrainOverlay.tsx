export function GrainOverlay() {
  return (
    <svg className="pointer-events-none fixed inset-0 z-[1] h-full w-full opacity-[0.025] mix-blend-overlay" aria-hidden="true">
      <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" /></filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
  );
}
