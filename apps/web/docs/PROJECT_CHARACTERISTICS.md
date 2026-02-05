# Project Characteristics & Tech Stack Analysis

**Last Updated:** February 2026
**Purpose:** To provide a comprehensive technical overview for decision-making regarding cross-platform adaptation and iOS integration.

## 1. Core Identity & Philosophy
*   **Product:** Privacy-first, AI-powered visual knowledge manager.
*   **Aesthetic:** "Anti-tool," "Visual First" (Masonry Grid), Minimalist.
*   **Key UX:** Optimistic UI (<200ms save), high-speed interaction, no folder hierarchy.
*   **Design System:** Golden Ratio (φ ≈ 1.618) based spacing and proportions.

## 2. UI/UX Features

### Platform-Based Filtering
*   **Priority Platforms:** X/Twitter, Reddit, YouTube, Instagram always visible in filter bar
*   **Dynamic Pills:** Additional platforms appear when 3+ items exist
*   **Fallback Categories:** Websites, Images, Notes for non-platform content
*   **Mobile Scrolling:** Touch-enabled horizontal scroll with momentum

### Card Size Control
*   **Slider Range:** 0.7 (compact) to 1.5 (expanded)
*   **Responsive Columns:** Adjusts column count based on viewport and slider value
*   **Persistence:** User preference saved to localStorage
*   **Mobile Support:** Slider accessible on all screen sizes

### Design System
*   **Golden Ratio Variables:** CSS custom properties based on φ ≈ 1.618
*   **Spacing Scale:** `--space-phi-xs` (4px) through `--space-phi-3xl` (68px)
*   **O(1) Performance:** All filtering done with `useMemo` for instant response

## 3. Current Tech Stack
The project is a modern **Next.js 16** web application.

| Layer | Technology | Status | Key Implications for Mobile |
| :--- | :--- | :--- | :--- |
| **Framework** | **Next.js 16 (App Router)** | Production | Excellent for web, but requires specific handling for mobile wrappers (Capacitor) due to SSR. |
| **UI Library** | **React 19** | Production | Robust component ecosystem. |
| **Styling** | **Tailwind CSS 4** | Production | Zero-runtime, highly performant on mobile web views. |
| **Database** | **Supabase (PostgreSQL)** | Production | Live updates/subscriptions work well on mobile. |
| **Auth** | **Supabase Auth** | Production | Secure, supports OAuth; easy to bridge to native login. |
| **AI** | **Zhipu GLM-4.7** | Production | Server-side processing; specific client device doesn't matter. |

## 4. Cross-Platform Analysis (iOS Share Sheet Focus)

### The Constraint: iOS Share Sheet
The user has a critical requirement: **"Show in iOS share sheet so I can add links like an app."**

*   **PWA (Progressive Web App):**
    *   **Pros:** Zero install friction, pure web.
    *   **Cons:** **iOS DOES NOT support the Web Share Target API**. A PWA added to the home screen *cannot* appear in the native iOS system share sheet to receive URLs from other apps (like Safari, Twitter, etc.).
    *   **Verdict:** **Insufficient** for the specific goal of "Add links like an app".

### Recommended Solution: Hybrid App (Capacitor)
To achieve native share sheet integration while preserving the existing Next.js codebase.

*   **Stack Change:** Add **Capacitor** to the existing Next.js repo.
*   **How it works:**
    *   The web app runs in a native WebView.
    *   **Share Extension:** You build a small native iOS "Share Extension" target (in Swift/Xcode) that receives the shared URL.
    *   **Data Flow:** The Share Extension can either:
        1.  **Direct API:** POST the URL directly to your `POST /api/save` endpoint (via Supabase function or Next.js API). *Recommended for speed.*
        2.  **Deep Link:** Open the main app with the URL as a parameter (slower, interrupts user flow).
*   **Effort:** Moderate. Requires maintaining an `ios/` folder and basic Swift knowledge for the extension, but keeps 95% of code in JS/TS.

## 5. Execution Roadmap

### Step 1: Prepare Web App for Mobile
1.  **Viewport & Touch:** Ensure tap targets are 44px+, remove hover states for mobile.
2.  **PWA Manifest:** Create `manifest.json` (still useful for Android and browser metadata).
3.  **Service Worker:** Implement offline fallback (optional but good).

### Step 2: Capacitor Integration
```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap init
npx cap add ios
```

### Step 3: The iOS Share Extension (Crucial Step)
This is the specific solution for the user's request.
1.  Open `ios/App/App.xcworkspace`.
2.  Add a new target: **Share Extension**.
3.  Write Swift code in the extension to:
    *   Extract the URL from the shared content.
    *   Authenticate (share Keychain group with main app or use a dedicated API key/App specific password).
    *   Send POST request to `https://your-domain.com/api/save`.
4.  *Result:* Providing a native "Save to MyMind" button in Safari/Twitter/etc. that uploads in the background without even opening the app.

## 6. Alternatives Considered

*   **React Native / Expo:**
    *   *Pros:* "Real" native feel, better gesture support.
    *   *Cons:* **Complete rewrite** of the UI. Losing the Masonry layout implementation (unless ported). Losing Next.js SSR benefits.
    *   *Verdict:* Too high effort for the current stage unless performance is blocked.

*   **Native iOS App (SwiftUI):**
    *   *Pros:* Best performance.
    *   *Cons:* Two codebases to maintain.
    *   *Verdict:* Not efficient for a solo dev/small team.

## 7. Diagnosis & Decision
**Recommended Path:** **Next.js + Capacitor**.
This allows you to "use it as a cross-platform app" immediately while solving the specific "iOS Share Sheet" requirement via a native Share Extension.
