// Shown while the first app-state fetch is in flight (right after login).
// Mirrors the Dashboard layout so the transition into real content feels
// instant rather than a blank spinner interstitial.
export function DashboardSkeleton() {
  return (
    <div className="dash-skeleton" aria-hidden="true">
      <div className="dash-skeleton-row">
        <span className="skel-block dash-skeleton-avatar" />
        <span className="skel-block dash-skeleton-icon" />
        <span className="skel-block dash-skeleton-icon" />
      </div>

      <span className="skel-block dash-skeleton-greeting" />
      <span className="skel-block dash-skeleton-subgreeting" />

      <div className="skel-block dash-skeleton-hero">
        <span className="skel-block dash-skeleton-hero-label" />
        <span className="skel-block dash-skeleton-hero-amount" />
        <div className="dash-skeleton-hero-tiles">
          <span className="skel-block dash-skeleton-hero-tile" />
          <span className="skel-block dash-skeleton-hero-tile" />
        </div>
        <span className="skel-block dash-skeleton-hero-cta" />
      </div>

      <span className="skel-block dash-skeleton-section-label" />
      <div className="dash-skeleton-list">
        {[0, 1].map((i) => (
          <div className="dash-skeleton-list-row" key={i}>
            <span className="skel-block dash-skeleton-list-icon" />
            <div className="dash-skeleton-list-text">
              <span className="skel-block dash-skeleton-list-title" />
              <span className="skel-block dash-skeleton-list-sub" />
            </div>
            <span className="skel-block dash-skeleton-list-amount" />
          </div>
        ))}
      </div>
    </div>
  );
}
