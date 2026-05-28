/**
 * TopoBackground — premium dark slate radial gradient + subtle grid SVG.
 *
 * Drop inside a `relative` parent with defined height. Renders two absolutely
 * positioned layers behind any sibling content. Pure CSS/SVG — no images.
 */

const GRID_SVG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><g fill='none' stroke='%231e3a8a' stroke-width='0.5' stroke-opacity='0.35'><path d='M0 .5H40M.5 0V40'/></g></svg>";

export function TopoBackground({ className = "" }: { className?: string }) {
  return (
    <>
      <div
        aria-hidden
        className={`absolute inset-0 z-0 bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(30,58,138,0.35),rgba(255,255,255,0))] ${className}`}
      />
      <div
        aria-hidden
        className="absolute inset-0 z-[1] opacity-40"
        style={{ backgroundImage: `url("${GRID_SVG}")` }}
      />
      <div
        aria-hidden
        className="absolute inset-0 z-[2] bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent"
      />
    </>
  );
}

export default TopoBackground;
