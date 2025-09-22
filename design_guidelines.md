# Client Sentiment & Churn Reduction Dashboard Design Guidelines

## Design Approach: Enterprise Analytics Dashboard
**Selected Approach**: Design System (Utility-Focused)
- **Primary System**: Material Design with enterprise customizations
- **Justification**: Data-heavy analytics application requiring consistent, professional UI patterns with strong visual hierarchy for complex information display

## Core Design Elements

### A. Color Palette
**Primary Colors (Dark Mode Default)**:
- Background: 220 15% 8% (deep navy-charcoal)
- Surface: 220 20% 12% (elevated surfaces)
- Primary Brand: 210 100% 55% (bright blue for key actions)
- Text Primary: 0 0% 95% (near white)
- Text Secondary: 0 0% 70% (muted text)

**Status & Data Colors**:
- Success/Positive: 142 76% 36% (green for positive sentiment)
- Warning/Neutral: 45 93% 58% (amber for neutral sentiment)
- Danger/Negative: 0 84% 60% (red for negative sentiment, high risk)
- Info/Metrics: 217 91% 60% (blue for general data points)

### B. Typography
- **Primary Font**: Inter (Google Fonts)
- **Hierarchy**: 
  - Dashboard Title: text-2xl font-semibold
  - Section Headers: text-lg font-medium
  - Card Titles: text-base font-medium
  - Body Text: text-sm font-normal
  - Data Labels: text-xs font-medium uppercase tracking-wide

### C. Layout System
**Tailwind Spacing Primitives**: Primary units of 2, 4, 6, 8, 12
- Component padding: p-4, p-6
- Section margins: m-8, m-12
- Grid gaps: gap-4, gap-6
- Icon sizing: w-4 h-4, w-6 h-6

### D. Component Library

**Navigation**:
- Left sidebar with company logo and main sections
- Breadcrumb navigation for drill-down views
- User profile dropdown in top-right

**Data Display Components**:
- **Metric Cards**: Dark surfaces with large numbers, trend indicators, and sparkline charts
- **At-Risk Client List**: Table with risk score badges, client names, and action buttons
- **Sentiment Donut Charts**: Interactive charts with hover states and percentage callouts
- **Client 360° Views**: Tabbed interface combining profile, metrics, and conversation history

**Dashboard Sections**:
1. **Overview Metrics**: Key performance indicators in card grid
2. **Sentiment Distribution**: Donut charts showing positive/neutral/negative breakdown
3. **At-Risk Clients**: Sortable table with risk scores and quick actions
4. **Root Causes Analysis**: Word cloud or categorized list of common issues
5. **Client Benchmarking**: Horizontal bar charts comparing NPS and retention
6. **What-If Simulation**: Slider controls with real-time outcome projections

**Interactive Elements**:
- Hover states reveal additional data points
- Click-through navigation to detailed client views
- Filter dropdowns for time ranges and client segments
- Export buttons for reports and data

### E. Visual Treatments
**Professional Enterprise Aesthetic**:
- Clean lines and generous whitespace
- Subtle shadows and borders for depth
- Consistent rounded corners (rounded-lg)
- Status indicators using color-coded badges
- Loading states with skeleton placeholders

**Data Visualization Standards**:
- Charts use consistent brand colors
- Tooltips appear on hover with detailed information
- Legend placement follows accessibility guidelines
- Responsive breakpoints maintain readability on all devices

## Images
No hero images required. This is a data-focused dashboard application. Any imagery will be:
- Company logos (small, in navigation)
- Client avatars (circular, 32x32px in lists)
- Status icons (16x16px indicators)
- Chart legends and data visualization elements

The focus remains entirely on data presentation and actionable insights rather than marketing imagery.