import type { RestaurantConfig } from "@/types";

const assetBasePath = "/demo/steakhouse";

export const restaurantConfig: RestaurantConfig = {
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
