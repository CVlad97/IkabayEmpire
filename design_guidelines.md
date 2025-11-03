# IKABAY EMPIRE Design Guidelines

## Design Approach

**Reference-Based Strategy**: Draw inspiration from Shopify's clean product displays, Deliveroo's food imagery, and Coinbase's dashboard clarity, infused with bold Caribbean energy and tropical vibrancy. The design should feel festive yet professional, accessible yet premium.

**Core Principle**: Create an immersive Caribbean marketplace that feels alive, trustworthy, and rewarding. Every interaction should reinforce the ecosystem's value proposition: discover, purchase, earn, and engage.

---

## Typography System

**Font Families**:
- **Primary**: Inter (Google Fonts) - Clean, modern, excellent readability for UI and body text
- **Display**: Poppins (Google Fonts) - Bold, friendly headers with Caribbean warmth

**Hierarchy**:
- **Hero Headlines**: Poppins Bold, 3xl-5xl (mobile-desktop), leading-tight
- **Section Titles**: Poppins SemiBold, 2xl-3xl, leading-snug
- **Card Titles**: Poppins Medium, lg-xl, leading-normal
- **Body Text**: Inter Regular, base-lg, leading-relaxed
- **Labels/Meta**: Inter Medium, sm-base, tracking-wide, uppercase where appropriate
- **Numbers/Stats**: Poppins SemiBold for emphasis, Inter Regular for context

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8, 12, 16** for consistency
- Component padding: p-4, p-6, p-8
- Section spacing: py-12 (mobile), py-16 or py-20 (desktop)
- Card gaps: gap-4, gap-6
- Element margins: mb-2, mb-4, mb-8

**Container Strategy**:
- Full-width sections with max-w-7xl inner containers
- Content areas: max-w-6xl
- Card grids: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Dashboards: Two-column layouts (sidebar + main content)

---

## Component Library

### Navigation
- **Sticky header** with subtle shadow on scroll
- Logo left, main navigation center, user/wallet right
- Mobile: Hamburger menu with slide-in drawer
- Active state: Underline accent in ikabay-orange
- Cart/wallet badge: Small circular indicators with counts

### Hero Section
- **Full-width hero** (80vh on desktop, 60vh mobile)
- Large hero background image: Vibrant Caribbean scene (beach, marketplace, tropical setting)
- Overlay gradient: Dark gradient from bottom (rgba(30,30,30,0.7) to transparent)
- Centered content with blurred-background buttons
- AI-generated daily tagline in Poppins Bold (2xl-4xl)
- Geolocation indicator: Small pill below headline showing "📍 Fort-de-France, Martinique"
- Primary CTA: Large button with blur backdrop
- Secondary CTA: Ghost/outline button with blur backdrop

### Product Cards
- Clean white background with subtle shadow (shadow-md)
- Product image: 4:3 aspect ratio, rounded-t-xl
- Hover: Slight scale (1.02) with deeper shadow (shadow-lg)
- Badge overlay: "5% IKB Cashback" in top-right corner
- Price display: Large, bold in ikabay-dark
- IKB rewards: Smaller, accent color below price
- Add to cart: Full-width button at bottom, rounded-b-xl

### Food/Delivery Cards (Delikreol)
- Horizontal layout on desktop, vertical on mobile
- Food image: Rounded-xl, appetizing close-ups
- Delivery time: Icon + text badge in top-left
- Restaurant name: Subtle above dish name
- Pricing + estimated delivery in footer

### Crypto Dashboard
- Card-based layout with glass-morphism effect (backdrop-blur)
- Balance display: Extra large numbers (4xl-6xl) in Poppins
- Mining animation: Pulsing icon with "+0.05 IKB" ticker
- Charts: Recharts with ikabay-green for positive trends
- Transaction history: Clean table with alternating row backgrounds

### Buttons
- **Primary**: Rounded-full or rounded-xl, px-6 py-3, ikabay-orange background
- **Secondary**: Outline style with ikabay-green border
- **Ghost**: Transparent with subtle hover background
- All buttons: Semi-bold text, slight letter-spacing, transition-all
- Blur backgrounds for buttons over images

### Input Fields
- Rounded-lg borders with focus ring in ikabay-orange
- Generous padding (px-4 py-3)
- Placeholder text in muted gray
- Icons positioned inside left edge

### Cards & Containers
- Rounded corners: rounded-xl for cards, rounded-2xl for major sections
- Shadows: shadow-sm (default), shadow-md (hover), shadow-xl (modals)
- Glass-morphism for overlays: backdrop-blur-md with semi-transparent backgrounds

---

## Animations (Minimal & Purposeful)

- **Page transitions**: Smooth fade-in on load
- **Product cards**: Hover scale (1.02) with 200ms transition
- **Mining ticker**: Gentle pulse every 2 seconds when IKB is added
- **Mobile menu**: Slide-in from right with backdrop fade
- **NO scroll-triggered animations** to maintain performance
- **Button states**: Built-in hover/active transitions

---

## Page-Specific Layouts

### Homepage
1. **Hero**: Full-width with image, AI-generated tagline, geolocation, dual CTAs
2. **Featured Products**: 3-column grid (1 on mobile) showcasing top items
3. **Delikreol Preview**: 2-column split (image left, content right) introducing food delivery
4. **Crypto Teaser**: Card highlighting IKB rewards with animated balance
5. **Trust Indicators**: Icons + text showing secure payments, fast delivery, cashback
6. **Footer**: Multi-column with quick links, social media, newsletter signup

### Market Page
- Filter sidebar (collapsible on mobile)
- Product grid: 3-4 columns with consistent card heights
- Share button on each card with "+10 IKB" indicator
- AI recommendations section: "Picked for you" with 3 cards

### Delikreol Page
- Interactive Leaflet map at top (40vh height)
- Restaurant/dish grid below
- Location selector with current zone highlighted
- Estimated delivery times based on geolocation

### Crypto Dashboard
- Summary cards row: Total Balance, Today's Mining, Total Earned
- Interactive mining section with start/stop toggle
- Transaction history table with filters
- Recharts line graph showing balance over time

### Admin Dashboard
- Sidebar navigation
- KPI cards: Sales, Active Users, Total IKB Distributed
- Regional sales map visualization
- AI-generated insights card with daily business report

---

## Images

**Hero Image**: Full-width vibrant Caribbean marketplace scene or tropical beach with local vendors, colorful produce, and festive atmosphere. Should feel warm, inviting, and authentic to Caribbean culture.

**Product Images**: High-quality product photography on white backgrounds or in natural Caribbean settings. 4:3 aspect ratio for consistency.

**Food Images**: Appetizing close-ups of Caribbean dishes (rice and peas, jerk chicken, accras, etc.). Ensure good lighting and vibrant colors.

**Dashboard Graphics**: Use chart images or illustrations for empty states, showing positive trends and growth.

**Trust/Feature Icons**: Simple line icons or illustrations representing security, speed, rewards throughout the site.

---

## Special Features

- **Confetti animation** on successful purchase (brief, celebratory)
- **IKB token icon**: Custom SVG that appears throughout (can be a simple coin with "IKB")
- **Geolocation indicator**: Animated pin icon that updates based on detected location
- **Mobile-first approach**: All designs prioritize mobile experience, then scale up
- **Accessibility**: Maintain WCAG AA contrast ratios, keyboard navigation, clear focus states