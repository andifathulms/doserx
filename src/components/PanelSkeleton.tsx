/**
 * Route-chunk Suspense fallback. Routes are prefetched on idle (see App.tsx),
 * so this rarely shows past a first cold visit — but "rarely" isn't "never",
 * and a blank rectangle where a page is about to appear reads as a stall,
 * not a page loading. Shape approximates every page's actual head (title +
 * lede) so there's no layout jump once the real content lands.
 */
export function PanelSkeleton() {
  return (
    <div className="panel-loading" aria-hidden="true">
      <div className="skeleton-bar skeleton-bar--title" />
      <div className="skeleton-bar skeleton-bar--lede" />
      <div className="skeleton-bar skeleton-bar--block" />
    </div>
  )
}
