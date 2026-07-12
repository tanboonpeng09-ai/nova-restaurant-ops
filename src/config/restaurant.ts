import type { RestaurantConfig } from "@/types";

const assetBasePath = "/demo/steakhouse";

export const restaurantConfig: RestaurantConfig = {
  // Public portfolio demos may use the selector. Real client deployments should use "qr-only".
  tableMode: "demo-selector",
  timeZone: "America/New_York",
  name: "NOVA STEAKHOUSE",
  shortName: "NOVA",
  productName: "Restaurant Ops",
  tagline: "Premium American Grill",
  description:
    "A polished QR ordering and restaurant operations demo built for premium dining rooms, fast kitchen workflows, and owner-grade visibility.",
  logoText: "NOVA",
  logoPath: `${assetBasePath}/logo.svg`,
  faviconPath: `${assetBasePath}/favicon.svg`,
  heroImage:
    "https://images.unsplash.com/photo-1559329007-40df8a9345d8?auto=format&fit=crop&w=1800&q=85",
  backgroundImage:
    "https://images.unsplash.com/photo-1559329007-40df8a9345d8?auto=format&fit=crop&w=1800&q=85",
  contact: {
    address: "184 Madison Avenue, New York, NY",
    phone: "(212) 555-0198",
    email: "hello@novasteakhouse.example"
  },
  businessHours: [
    { label: "Lunch", days: "Mon-Fri", hours: "11:30 AM - 2:30 PM" },
    { label: "Dinner", days: "Mon-Sun", hours: "5:00 PM - 11:00 PM" }
  ],
  socialLinks: {
    website: "https://novasteakhouse.example",
    instagram: "https://instagram.com/novasteakhouse",
    facebook: "https://facebook.com/novasteakhouse"
  },
  copyright: "Copyright 2026 NOVA STEAKHOUSE. All rights reserved.",
  seo: {
    title: "NOVA STEAKHOUSE Operations",
    description: "Premium restaurant QR ordering and operations system demo."
  },
  navigation: {
    showMenuLink: true,
    showKitchenLink: true,
    showAdminLink: true,
    showTryDemoButton: true,
    menuLabel: "Menu",
    kitchenLabel: "Kitchen",
    adminLabel: "Admin",
    tryDemoLabel: "Try Demo"
  },
  home: {
    headline: "Premium American Grill, Powered by Modern Restaurant Operations",
    description:
      "QR ordering, kitchen visibility, and owner controls in one calm operating system. Built to help premium dining rooms move faster without feeling rushed.",
    primaryCtaLabel: "Try Customer Demo",
    secondaryCtaLabel: "View Admin System",
    proofPoints: ["Table-aware QR menus", "Realtime kitchen workflow", "Owner-ready operations"],
    previewEyebrow: "Live floor preview",
    previewServiceLabel: "Dinner service in progress",
    previewStatusLabel: "Online",
    previewMetrics: [
      { label: "Orders Today", value: "42", detail: "+18% vs last week" },
      { label: "Kitchen Live", value: "06", detail: "active tickets" },
      { label: "Average Prep Time", value: "12m", detail: "current service" }
    ],
    queueTitle: "Kitchen queue",
    queueDescription: "New orders move from scan to station without refresh.",
    queueRows: [
      { table: "Table 04", status: "Preparing", items: "6 items" },
      { table: "Table 09", status: "Ready", items: "2 items" },
      { table: "Table 12", status: "New", items: "4 items" }
    ],
    averageTicketLabel: "Average ticket value",
    averageTicketDescription: "Tracked as order value, not revenue.",
    averageTicketValue: "$48.20",
    operationsEyebrow: "Restaurant operations",
    operationsTitle: "A complete service flow, presented simply.",
    operationsDescription:
      "Three connected views give guests, kitchen staff, and owners exactly what they need without adding noise to service.",
    featureCards: [
      {
        label: "Customer ordering",
        detail: "Guests scan, browse, add notes, and send orders from the table.",
        icon: "qr",
        href: "/menu"
      },
      {
        label: "Kitchen live board",
        detail: "Clear order cards, staff requests, and one-tap status flow.",
        icon: "chef",
        href: "/kitchen"
      },
      {
        label: "Owner control",
        detail: "Menu availability, table status, QR sheets, and order value metrics.",
        icon: "chart",
        href: "/admin"
      }
    ],
    featureCtaLabel: "Open view"
  },
  kitchenAccess: {
    eyebrow: "Kitchen Display",
    title: "Kitchen access",
    pinHelpText: "Enter the owner-generated kitchen PIN. Demo PIN: 123456.",
    pinPlaceholder: "123456",
    submitLabel: "Enter Kitchen",
    checkingLabel: "Checking..."
  },
  theme: {
    id: "steakhouse",
    name: "Steakhouse",
    colors: {
      primary: "#FF6B2C",
      secondary: "#1A1A1A",
      accent: "#FFD166",
      background: "#0E0E0E",
      surface: "#171717",
      foreground: "#F7F0E8",
      lightBackground: "#F7F0E8",
      lightForeground: "#171717"
    },
    radius: {
      button: "16px",
      card: "24px"
    },
    motion: {
      duration: "250ms",
      easing: "ease"
    }
  },
  demo: {
    tableCount: 12,
    sampleOrderSummary: "Table 2 ordered Wagyu Ribeye, Signature Burger, Truffle Fries.",
    assetBasePath
  }
};

export const futureThemeIds = ["japanese", "cafe", "italian", "fast_food"] as const;
