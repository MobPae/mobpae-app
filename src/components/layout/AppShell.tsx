import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Bell, Camera, ChevronLeft, ChevronRight, RefreshCw, User } from "lucide-react";
import { TabBar } from "./TabBar";
import type { EmployeeProfile, View } from "../../types/app";
import { useSignedUrl } from "../../hooks/useSignedUrl";

type AppShellProps = {
  activeView: View;
  children: ReactNode;
  profile: EmployeeProfile;
  unreadCount: number;
  refreshing?: boolean;
  onRefresh: () => void;
  onNavigate: (view: View) => void;
  onBack?: () => void;
  uploadProfilePhoto?: (file: File) => void;
};

const TAB_VIEWS: View[] = ["home", "advance", "repayments", "activity", "profile"];
const ONBOARDING_VIEWS: View[] = ["onboarding-kyc", "onboarding-bank", "onboarding-done"];
const FULLSCREEN_DARK_VIEWS: View[] = [
  "profile-bank",
  "profile-kyc",
  "change-password",
  "help",
  "legal",
];
const HEADER_VIEWS: View[] = [...TAB_VIEWS, ...ONBOARDING_VIEWS];
const LIGHT_SURFACE = "#FFFFFF";

const palette = {
  bg: LIGHT_SURFACE,
  text: "#17151F",
  muted: "#6B6878",
  dim: "#9A97A8",
  border: "#E9E6F1",
  iconBg: LIGHT_SURFACE,
  avatarBorder: "#E2DEEE",
  unread: "#B4591F",
};

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]?.toUpperCase() ?? "").join("");
}

function getHeaderTitle(view: View) {
  const titles: Partial<Record<View, string>> = {
    advance: "Advance",
    repayments: "Repay",
    activity: "Activity",
    profile: "Profile",
    "onboarding-kyc": "KYC",
    "onboarding-bank": "Bank Account",
    "onboarding-done": "Setup",
    notifications: "Alerts",
    "change-password": "Security",
    help: "Help",
  };
  return titles[view] ?? "MobPae";
}

// Bare icon button — no background, no border pill.
// Matches the ChangePasswordScreen icon button style for consistency.
function iconButtonStyle(palette: { text: string }): CSSProperties {
  return {
    background: "transparent",
    border: 0,
    color: palette.text,
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    padding: 4,
    cursor: "pointer",
  };
}

export function AppShell({
  activeView, children, profile, unreadCount, refreshing, onRefresh, onNavigate, onBack, uploadProfilePhoto,
}: AppShellProps) {
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const profilePhotoUrl = useSignedUrl(profile.profilePhotoUrl);

  // ── Pull-to-refresh ──────────────────────────────────────────────────────
  const PULL_THRESHOLD = 64;
  const PULL_MAX = 90;
  const [pullDistance, setPullDistance] = useState(0);
  const [pullActive, setPullActive] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const pullDistanceRef = useRef(0);
  const pullActiveRef = useRef(false);

  useEffect(() => {
    pullActiveRef.current = pullActive;
  }, [pullActive]);

  useEffect(() => {
    if (!refreshing && pullActive) {
      setPullActive(false);
      setPullDistance(0);
      pullDistanceRef.current = 0;
    }
  }, [refreshing, pullActive]);

  // ── Edge-swipe to go back (iOS-style: drag in from the left edge) ──────────
  const SWIPE_EDGE_ZONE = 28;
  const SWIPE_THRESHOLD = 70;
  const SWIPE_MAX = 110;
  const [swipeX, setSwipeX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const gestureDir = useRef<"none" | "vertical" | "horizontal">("none");
  // Tracks live values independent of React's state batching, so the native
  // (non-passive) listeners below always read up-to-the-moment numbers
  // instead of a stale value captured in an earlier render's closure.
  const swipeXRef = useRef(0);

  const goBack = () => (onBack ?? (() => onNavigate("home")))();

  // Attached as native, non-passive listeners (not React's onTouch* props,
  // which React marks passive by default) so preventDefault() actually stops
  // the browser's own vertical rubber-band/scroll from fighting the drag —
  // that fight is what made the gesture feel diagonal/jumpy instead of a
  // clean, straight horizontal slide.
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const canSwipeBack = activeView !== "home";

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      gestureDir.current = "none";
      touchStartY.current = body.scrollTop === 0 && !pullActiveRef.current ? touch.clientY : null;
      touchStartX.current = canSwipeBack && touch.clientX <= SWIPE_EDGE_ZONE ? touch.clientX : null;
    };

    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];

      if (gestureDir.current === "none") {
        const dx = touchStartX.current != null ? touch.clientX - touchStartX.current : 0;
        const dy = touchStartY.current != null ? touch.clientY - touchStartY.current : 0;
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
          gestureDir.current =
            touchStartX.current != null && Math.abs(dx) > Math.abs(dy) && dx > 0 ? "horizontal" : "vertical";
        }
      }

      if (gestureDir.current === "horizontal" && touchStartX.current != null) {
        e.preventDefault();
        const dx = touch.clientX - touchStartX.current;
        if (dx > 0) {
          const next = Math.min(SWIPE_MAX, dx);
          swipeXRef.current = next;
          setSwiping(true);
          setSwipeX(next);
        }
        return;
      }

      if (touchStartY.current == null || pullActiveRef.current) return;
      if (body.scrollTop > 0) {
        touchStartY.current = null;
        pullDistanceRef.current = 0;
        setPullDistance(0);
        return;
      }
      const delta = touch.clientY - touchStartY.current;
      if (delta <= 0) {
        pullDistanceRef.current = 0;
        setPullDistance(0);
        return;
      }
      e.preventDefault();
      const next = Math.min(PULL_MAX, delta * 0.5);
      pullDistanceRef.current = next;
      setPullDistance(next);
    };

    const onTouchEnd = () => {
      if (gestureDir.current === "horizontal") {
        const committed = swipeXRef.current >= SWIPE_THRESHOLD;
        swipeXRef.current = 0;
        touchStartX.current = null;
        gestureDir.current = "none";
        setSwiping(false);
        setSwipeX(0);
        if (committed) goBack();
        return;
      }

      if (touchStartY.current == null) return;
      touchStartY.current = null;
      if (pullDistanceRef.current >= PULL_THRESHOLD) {
        setPullActive(true);
        setPullDistance(PULL_THRESHOLD);
        onRefresh();
      } else {
        setPullDistance(0);
      }
    };

    body.addEventListener("touchstart", onTouchStart, { passive: true });
    body.addEventListener("touchmove", onTouchMove, { passive: false });
    body.addEventListener("touchend", onTouchEnd, { passive: true });
    body.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      body.removeEventListener("touchstart", onTouchStart);
      body.removeEventListener("touchmove", onTouchMove);
      body.removeEventListener("touchend", onTouchEnd);
      body.removeEventListener("touchcancel", onTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView]);

  const isOnboarding = ONBOARDING_VIEWS.includes(activeView);
  const isFullscreenDark = FULLSCREEN_DARK_VIEWS.includes(activeView);
  const isTabView = HEADER_VIEWS.includes(activeView);
  const isHome = activeView === "home";
  const themedIconButton = iconButtonStyle(palette);
  const rootClassName = "app-root app-root--light";
  const shellClassName = "phone-shell phone-shell--light";

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    body.scrollTo({ top: 0, left: 0, behavior: "auto" });
    body.querySelectorAll<HTMLElement>(".screen-body, .screen-body-onboarding").forEach((node) => {
      node.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  }, [activeView]);

  // Close sheet whenever the view changes
  useEffect(() => { setSheetOpen(false); }, [activeView]);

  const openSheet = () => setSheetOpen(true);
  const closeSheet = () => setSheetOpen(false);

  const handlePhotoChange = () => {
    closeSheet();
    setTimeout(() => photoInputRef.current?.click(), 200);
  };

  const handleViewProfile = () => {
    closeSheet();
    onNavigate("profile");
  };

  return (
    <div
      className={rootClassName}
      style={{
        background: palette.bg,
      }}
    >
      <div
        className={shellClassName}
        style={{
          background: palette.bg,
        }}
      >

        {/* ── Swipe layer: header + screen body slide together as one screen ── */}
        <div
          className={swiping ? "shell-swipe-layer shell-swipe-layer--dragging" : "shell-swipe-layer"}
          style={{ transform: swipeX ? `translateX(${swipeX}px)` : undefined }}
        >
        {/* ── Shared app header ── */}
        {isTabView && (
          <div
            style={{
              background: palette.bg,
              padding: "max(14px, calc(env(safe-area-inset-top, 0px) + 14px)) 20px 12px",
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexShrink: 0,
              color: palette.text,
              position: "relative",
              zIndex: 25,
            }}
          >
            {isHome ? (
              // Avatar: blue-tinted initials circle until user uploads a photo.
              <button
                type="button"
                onClick={openSheet}
                aria-label="Open profile"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  border: 0,
                  background: profilePhotoUrl ? "transparent" : "#315eff",
                  overflow: "hidden",
                  flexShrink: 0,
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {profilePhotoUrl ? (
                  <img
                    src={profilePhotoUrl}
                    alt={profile.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ color: "#FFFFFF", fontSize: 13, fontWeight: 500, letterSpacing: "-0.02em" }}>
                    {getInitials(profile.name || "M")}
                  </span>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={onBack ?? (() => onNavigate("home"))}
                aria-label="Back"
                style={themedIconButton}
              >
                <ChevronLeft size={20} strokeWidth={2.2} />
              </button>
            )}

            {/* Screen title — only shown on non-home tab views */}
            {!isHome && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: palette.muted,
                    fontSize: 13,
                    lineHeight: 1,
                    fontWeight: 500,
                    letterSpacing: "0.32em",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {getHeaderTitle(activeView)}
                </div>
              </div>
            )}
            {/* Spacer — pushes action icons to the right on home view */}
            {isHome && <div style={{ flex: 1 }} />}

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <button
                type="button"
                style={{ ...themedIconButton, position: "relative" }}
                onClick={() => onNavigate("notifications")}
                aria-label="Notifications"
              >
                <Bell size={18} strokeWidth={1.95} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: -5,
                      right: -5,
                      minWidth: 17,
                      height: 17,
                      padding: "0 4px",
                      borderRadius: 99,
                      background: "#E53935",
                      border: `2px solid ${palette.bg}`,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 600,
                      color: "#fff",
                      lineHeight: 1,
                      letterSpacing: 0,
                    }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                style={themedIconButton}
                onClick={onRefresh}
                aria-label="Refresh"
              >
                <RefreshCw
                  size={18}
                  color={palette.text}
                  className={refreshing ? "spin" : ""}
                  strokeWidth={2.05}
                />
              </button>
            </div>
          </div>
        )}

        {/* ── Screen body ── */}
        <div
          ref={bodyRef}
          key={activeView}
          className={isOnboarding ? "screen-body-onboarding" : `screen-body${isFullscreenDark ? " screen-body--fullscreen" : ""}`}
          style={{
            background: palette.bg,
            overscrollBehaviorY: "contain",
          }}
        >
          <div
            className="ptr-indicator"
            style={{
              height: pullDistance,
              opacity: Math.min(1, pullDistance / PULL_THRESHOLD),
            }}
          >
            <RefreshCw
              size={18}
              color={palette.text}
              className={pullActive ? "spin" : ""}
              strokeWidth={2}
              style={pullActive ? undefined : { transform: `rotate(${pullDistance * 3}deg)` }}
            />
          </div>
          {children}
        </div>
        </div>

        {!isOnboarding && !isFullscreenDark && (
          <TabBar activeView={activeView} onChange={onNavigate} />
        )}

        {/* ── Profile bottom sheet ── */}
        {sheetOpen && (
          <>
            <div className="psheet-backdrop" onClick={closeSheet} />
            <div className="psheet">
              <div className="psheet-handle" />

              {/* Avatar — tap to change photo */}
              <div className="psheet-avatar-area">
                <button
                  type="button"
                  className="psheet-avatar"
                  onClick={uploadProfilePhoto ? handlePhotoChange : undefined}
                  aria-label="Change profile photo"
                  disabled={!uploadProfilePhoto}
                >
                  {profilePhotoUrl ? (
                    <img src={profilePhotoUrl} alt={profile.name} />
                  ) : (
                    <span className="psheet-avatar-initials">{getInitials(profile.name || "M")}</span>
                  )}
                  {uploadProfilePhoto && (
                    <span className="psheet-avatar-cam"><Camera size={13} /></span>
                  )}
                </button>
                {uploadProfilePhoto && (
                  <p className="psheet-avatar-hint">Tap photo to change</p>
                )}
              </div>

              {/* Name + meta */}
              <div className="psheet-name">{profile.name || "Employee"}</div>
              {(profile.employeeCode || profile.employer) && (
                <div className="psheet-meta">
                  {[profile.employeeCode, profile.employer].filter(Boolean).join(" · ")}
                </div>
              )}

              {/* Action rows */}
              <div className="psheet-actions">
                <button type="button" className="psheet-action-row" onClick={handleViewProfile}>
                  <span className="psheet-action-icon"><User size={16} /></span>
                  <span className="psheet-action-label">View Full Profile</span>
                  <ChevronRight size={15} className="psheet-action-chevron" />
                </button>
                {uploadProfilePhoto && (
                  <button type="button" className="psheet-action-row" onClick={handlePhotoChange}>
                    <span className="psheet-action-icon"><Camera size={16} /></span>
                    <span className="psheet-action-label">Change Profile Photo</span>
                    <ChevronRight size={15} className="psheet-action-chevron" />
                  </button>
                )}
              </div>

              <button type="button" className="psheet-dismiss" onClick={closeSheet}>
                Dismiss
              </button>
            </div>
          </>
        )}

        {/* Hidden file input */}
        {uploadProfilePhoto && (
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files?.[0]) uploadProfilePhoto(e.target.files[0]);
              e.target.value = "";
            }}
          />
        )}
      </div>
    </div>
  );
}
