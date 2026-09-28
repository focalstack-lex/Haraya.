# Sanctuary Passport, Focus Sessions & Cup Clinks ("Strava for Sanctuaries")

Date: 2026-09-29.
Status: Designed and brainstormed with Lex; ready for implementation by Claude.
Target: Haraya (`haraya.space`).

---

## 1. Executive Summary & Goal

Haraya is pivoting into a Sanctuary Finder for the Davao Region. This subsystem turns individual study and coffee visits into a personal, tactile exploration ledger—reminiscent of Strava, but tailored for focus, reading, quiet spaces, and Davao specialty coffee culture:
1. **GPS-Verified Arrivals**: Visits require physical presence within a 120-meter geofence of the venue.
2. **Two Check-In Modes**:
   - **Deep Focus Session**: Background focus timer with a floating mobile banner; auto-saves when the user leaves the cafe radius so focus time is never lost.
   - **Quick Stamp**: Instant 30-minute drop-in check-in to collect the cafe's passport stamp.
3. **The Davao Passport**: Unlocked digital woodblock ink stamps vs faint ghost outlines for unvisited spots across Davao City, Tagum, Digos, Panabo, Mati, and Samal.
4. **Cup Clinks**: Quiet community kudos on public study sessions.
5. **Granular Privacy**: Global profile privacy toggle (`Public` vs `Private`) plus per-visit privacy override (`Public` vs `Only Me`).

---

## 2. Database Architecture (Supabase Migration)

Create migration file: `supabase/migrations/20260929030000_sanctuary_visits.sql`

```sql
-- 1. Profiles extension for passport privacy
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_public_passport BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS total_focus_minutes INTEGER DEFAULT 0;

-- 2. Sanctuary Visits Table
CREATE TABLE IF NOT EXISTS public.sanctuary_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cafe_id TEXT NOT NULL,
  cafe_name TEXT NOT NULL,
  city TEXT NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('focus', 'stamp')),
  duration_minutes INTEGER NOT NULL DEFAULT 30 CHECK (duration_minutes >= 5 AND duration_minutes <= 1440),
  drink_ordered TEXT,
  noise_level TEXT CHECK (noise_level IN ('quiet', 'hum', 'buzzing')),
  outlets_status TEXT CHECK (outlets_status IN ('plenty', 'crowded', 'none')),
  notes TEXT CHECK (length(notes) <= 500),
  is_public BOOLEAN NOT NULL DEFAULT true,
  user_lat NUMERIC(9,6) NOT NULL,
  user_lng NUMERIC(9,6) NOT NULL,
  verified_distance_meters NUMERIC(7,2) NOT NULL CHECK (verified_distance_meters <= 150),
  clinks_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for user profiles and cafe activity
CREATE INDEX IF NOT EXISTS idx_sanctuary_visits_user_id ON public.sanctuary_visits(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sanctuary_visits_cafe_id ON public.sanctuary_visits(cafe_id, created_at DESC);

-- 3. Cup Clinks Table (Kudos)
CREATE TABLE IF NOT EXISTS public.cup_clinks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES public.sanctuary_visits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(visit_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_cup_clinks_visit_id ON public.cup_clinks(visit_id);

-- 4. Triggers: Update Clinks Count & User Focus Minutes
CREATE OR REPLACE FUNCTION public.handle_cup_clink_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.sanctuary_visits
    SET clinks_count = clinks_count + 1
    WHERE id = NEW.visit_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.sanctuary_visits
    SET clinks_count = GREATEST(0, clinks_count - 1)
    WHERE id = OLD.visit_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_cup_clink_change
AFTER INSERT OR DELETE ON public.cup_clinks
FOR EACH ROW EXECUTE FUNCTION public.handle_cup_clink_change();

CREATE OR REPLACE FUNCTION public.handle_new_visit_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET total_focus_minutes = total_focus_minutes + NEW.duration_minutes
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_visit_stats
AFTER INSERT ON public.sanctuary_visits
FOR EACH ROW EXECUTE FUNCTION public.handle_new_visit_stats();

-- 5. Rate Limit Trigger: Max 6 visits per user per day
CREATE OR REPLACE FUNCTION public.check_visit_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  today_count INTEGER;
BEGIN
  SELECT count(*) INTO today_count
  FROM public.sanctuary_visits
  WHERE user_id = NEW.user_id
    AND created_at >= (now() - interval '1 day');

  IF today_count >= 6 THEN
    RAISE EXCEPTION 'Daily sanctuary visit limit reached (max 6 per day).';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_visit_rate_limit
BEFORE INSERT ON public.sanctuary_visits
FOR EACH ROW EXECUTE FUNCTION public.check_visit_rate_limit();

-- 6. Row Level Security (RLS)
ALTER TABLE public.sanctuary_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cup_clinks ENABLE ROW LEVEL SECURITY;

-- sanctuary_visits RLS
CREATE POLICY "Public visits or own visits are viewable"
ON public.sanctuary_visits FOR SELECT
USING (
  is_public = true 
  OR auth.uid() = user_id 
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

CREATE POLICY "Authenticated users can insert own visit"
ON public.sanctuary_visits FOR INSERT
WITH CHECK (
  auth.uid() = user_id
);

-- cup_clinks RLS
CREATE POLICY "Clinks are viewable by everyone"
ON public.cup_clinks FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can clink once (not own visit)"
ON public.cup_clinks FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND NOT EXISTS (
    SELECT 1 FROM public.sanctuary_visits
    WHERE id = visit_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can remove their own clink"
ON public.cup_clinks FOR DELETE
USING (auth.uid() = user_id);
```

---

## 3. Client State & Geofencing Architecture

### Geofence Calculation (`src/utils/geo.ts`)
- Use Haversine distance formula in meters between device `(lat, lng)` and cafe coordinates `(cafe.coordinates[0], cafe.coordinates[1])`.
- Verification threshold: `<= 120` meters.
- Distance calculation helper:
  ```typescript
  export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number;
  ```

### Active Session Storage (`localStorage['haraya_active_focus']`)
- When a focus session starts:
  ```typescript
  interface ActiveFocusSession {
    cafeId: string;
    cafeName: string;
    city: string;
    cafeCoordinates: [number, number];
    startedAt: string; // ISO string
    userStartCoordinates: [number, number];
  }
  ```
- Persisting in `localStorage` ensures that page refreshes, tab changes, or navigation around Haraya do not destroy the running session.

### The Auto-Save Boundary Exit Protocol
- In `src/hooks/useFocusSession.ts`:
  - Starts a background position listener using `navigator.geolocation.watchPosition` (`enableHighAccuracy: true`, maximumAge: 10000).
  - Every time position updates:
    - Compute distance to `cafeCoordinates`.
    - If distance exceeds `150` meters:
      - Trigger boundary exit countdown (wait 30s or 2 consecutive position fixes outside the boundary to avoid transient GPS jitter).
      - Automatically calculate `duration_minutes = Math.round((Date.now() - startedAt) / 60000)`.
      - Call `visitService.recordVisit(...)` with default mood/vibe.
      - Clear `haraya_active_focus` from `localStorage`.
      - Trigger notification: *"Focus session auto-saved: X hrs at [Cafe Name]"*.

---

## 4. UI Components & File Locations

### 1. The Floating Focus Banner (`src/components/session/FloatingFocusBanner.tsx`)
- Appears floating right above `BottomTabBar` when `activeFocusSession` exists.
- Style:
  - Height: `44px`, `rounded-full`, `bg-[#13191F] text-[#FFFDF9]`, shadow `0 4px 16px rgba(0,0,0,0.2)`.
  - Left: Pulsing amber dot or coffee bean icon + Cafe Name.
  - Center: Live elapsed timer `HH:MM:SS` (monospace font).
  - Right: "Finish" / "End" pill button (`bg-[#906D4B] hover:bg-[#7D5C3D]`).
- Tapping the banner opens `FocusSessionModal.tsx`.

### 2. The Check-In & Arrival Sheet (`src/components/session/CheckInModal.tsx`)
- Opened from:
  1. The Cafe Detail Sheet (`#/cafe/<id>`) via a prominent "Check In & Focus" button.
  2. The Live Walking Navigation arrival card when arriving within 120m.
- Geofence UI check:
  - If `<= 120m`:
    - Shows: *"You are at [Cafe Name]"* (green beacon indicator).
    - Mode 1 button: **Start Focus Session** (starts timer + floating banner).
    - Mode 2 button: **Quick Stamp** (logs 30m drop-in, grants stamp immediately).
  - If `> 120m`:
    - Shows: *"You are X.X km away. Visit in person to stamp your passport and log focus time."*
    - Check-in buttons are disabled; offers directions via Haraya walking navigation or external maps.

### 3. The End Session / Log Details Modal (`src/components/session/EndSessionModal.tsx`)
- Shown when user clicks "Finish" on the floating banner or concludes a session manually.
- Fields:
  - Elapsed Time display (e.g. `2h 15m`).
  - Drink ordered (input with quick shortcuts: `Latte`, `Americano`, `Pour-over`, `Cold Brew`).
  - Noise level: segmented control (`Quiet`, `Hum`, `Buzzing`).
  - Power outlets: segmented control (`Plenty`, `Crowded`, `None`).
  - Notes field: optional 500-char markdown note.
  - Visibility switch: `Public Session` vs `Only Me`.
  - Button: **Save to Passport** with tactile feedback.

### 4. The Passport Stamp Component (`src/components/passport/PassportStamp.tsx`)
- Renders an authentic, SVG-rendered circular woodblock ink stamp:
  - Outer ring with cafe name and city (e.g. `GREEN COFFEE · DIGOS CITY`).
  - Center: Handcrafted cafe monogram or coffee cup mark.
  - Date stamp: `SEP 29 2026`.
  - Stamped version: Deep roasted caramel `#906D4B` or warm espresso `#383027` with subtle canvas texture.
  - Ghost version (unvisited): Faint taupe outline (`#594C3D/20`) with a lock or dashed boundary.

### 5. Profile Redesign (`src/views/ProfileView.tsx`)
- Refactored into a Strava-style personal ledger:
  - Header:
    - User name and avatar.
    - Privacy toggle: `Public Profile` vs `Private Profile`.
    - 3 Key Metrics:
      1. `Total Focus Hours` (e.g., `38.5 hrs`).
      2. `Sanctuaries Stamped` (e.g., `6 spots`).
      3. `Cup Clinks Received` (e.g., `14 clinks`).
  - 3 Tabs:
    - **Tab 1: Diary (Activity Timeline)**: Chronological feed of past study sessions with focus duration, drink, notes, and a **Cup Clink** interaction button.
    - **Tab 2: Passport**: Grid of Davao Region stamps (unlocked ink vs ghost stamps), grouped by city.
    - **Tab 3: Saved**: The existing list of saved cafes.

### 6. Cafe Detail Integration (`src/components/cafe/CafeRecentVisitors.tsx`)
- Placed in `CafeDetailSheet.tsx` under amenities:
  - Shows community pulse: e.g., *"Reported Quiet 2 hours ago by 3 scouts"*.
  - Recent public visitors: horizontal avatar/name rail showing who studied there recently.

---

## 5. Implementation Roadmap for Claude

Claude should execute the work in 4 clean, test-driven phases:

### Phase 1: Database & Service Layer
1. Add migration `supabase/migrations/20260929030000_sanctuary_visits.sql`.
2. Create `src/services/visitService.ts`:
   - Methods: `recordVisit`, `getActiveVisit`, `getUserVisits`, `getCafeVisits`, `toggleCupClink`, `getPassportStats`.
3. Create unit tests: `src/services/visitService.test.ts`.

### Phase 2: Geofencing & Focus Session Hook
1. Create `src/utils/geo.ts` with Haversine distance calculations and unit tests.
2. Create `src/hooks/useFocusSession.ts`:
   - Background timer, localStorage sync, geofence radius watcher, and auto-save on exit (>150m).

### Phase 3: Floating Banner & Check-In Dialogs
1. Create `src/components/session/FloatingFocusBanner.tsx`.
2. Create `src/components/session/CheckInModal.tsx` (120m radius check, Start Focus vs Quick Stamp).
3. Create `src/components/session/EndSessionModal.tsx` (drink, noise, outlets, notes).
4. Wire floating banner in `src/App.tsx` directly above `BottomTabBar`.

### Phase 4: Profile Redesign & Passport Stamp Grid
1. Create `src/components/passport/PassportStamp.tsx` (ink stamp vs ghost stamp).
2. Refactor `src/views/ProfileView.tsx` with the 3 tabs (Diary, Passport, Saved), public/private privacy toggle, and Cup Clink button.
3. Add community pulse row in `src/components/cafe/CafeDetailSheet.tsx`.

---

## 6. Constraints & Anti-Slop Discipline
- **Zero Emojis**: Use vector icons (`Lucide` or custom SVG) and monospace tracked numbers. No emoji icons anywhere in stamps, toasts, or feeds.
- **Zero Em-Dashes**: Use colons, periods, or standard hyphens `-`.
- **Zero Page Overflow**: Verify all cards and stamp grids collapse gracefully on 320px and 375px mobile viewports without horizontal scrolling.
- **Verification Gate**: Drive in browser, capture UI evidence in `reports/ui-verification/`, and verify `npm test`, `npm run lint`, and `npm run build` all pass before committing.
