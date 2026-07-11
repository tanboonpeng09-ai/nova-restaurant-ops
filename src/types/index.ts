export type OrderStatus = "new" | "preparing" | "ready" | "completed";
export type TableStatus = "available" | "occupied" | "needs_bill" | "cleaning";
export type StaffRequestType = "bill" | "water" | "assistance";
export type TableMode = "qr-only" | "demo-selector";

export type ThemeId = "steakhouse" | "japanese" | "cafe" | "italian" | "fast_food";

export type BusinessHours = {
  label: string;
  days: string;
  hours: string;
};

export type ContactInfo = {
  address: string;
  phone: string;
  email: string;
};

export type SocialLinks = {
  website?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
};

export type ThemeConfig = {
  id: ThemeId;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    foreground: string;
    lightBackground: string;
    lightForeground: string;
  };
  radius: {
    button: string;
    card: string;
  };
  motion: {
    duration: string;
    easing: string;
  };
};

export type RestaurantConfig = {
  tableMode: TableMode;
  name: string;
  shortName: string;
  productName: string;
  tagline: string;
  description: string;
  logoText: string;
  logoPath: string;
  faviconPath: string;
  heroImage: string;
  backgroundImage: string;
  contact: ContactInfo;
  businessHours: BusinessHours[];
  socialLinks: SocialLinks;
  copyright: string;
  seo: {
    title: string;
    description: string;
  };
  navigation: {
    showMenuLink: boolean;
    showKitchenLink: boolean;
    showAdminLink: boolean;
    showTryDemoButton: boolean;
    menuLabel: string;
    kitchenLabel: string;
    adminLabel: string;
    tryDemoLabel: string;
  };
  home: {
    headline: string;
    description: string;
    primaryCtaLabel: string;
    secondaryCtaLabel: string;
    proofPoints: string[];
    previewEyebrow: string;
    previewServiceLabel: string;
    previewStatusLabel: string;
    previewMetrics: Array<{
      label: string;
      value: string;
      detail: string;
    }>;
    queueTitle: string;
    queueDescription: string;
    queueRows: Array<{
      table: string;
      status: string;
      items: string;
    }>;
    averageTicketLabel: string;
    averageTicketDescription: string;
    averageTicketValue: string;
    operationsEyebrow: string;
    operationsTitle: string;
    operationsDescription: string;
    featureCards: Array<{
      label: string;
      detail: string;
      href: string;
      icon: "qr" | "chef" | "chart";
    }>;
    featureCtaLabel: string;
  };
  kitchenAccess: {
    eyebrow: string;
    title: string;
    pinHelpText: string;
    pinPlaceholder: string;
    submitLabel: string;
    checkingLabel: string;
  };
  theme: ThemeConfig;
  demo: {
    tableCount: number;
    sampleOrderSummary: string;
    assetBasePath: string;
  };
};

export type RestaurantSettings = {
  name: string;
  tagline: string;
  description: string;
  phone: string;
  address: string;
  brandColor: string;
  heroImage: string;
  orderingEnabled: boolean;
  closedMessage: string;
  kitchenPin: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
};

export type MenuItem = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
  isFeatured: boolean;
  sortOrder: number;
};

export type Table = {
  id: string;
  label: string;
  number: string;
  status: TableStatus;
  qrUrl: string;
  isActive: boolean;
};

export type OrderItem = {
  id: string;
  menuItemId: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type Order = {
  id: string;
  orderNumber: string;
  tableNumber: string;
  status: OrderStatus;
  subtotal: number;
  notes: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
};

export type StaffRequest = {
  id: string;
  tableNumber: string;
  type: StaffRequestType;
  status: "open" | "resolved";
  createdAt: string;
};

export type CartItem = {
  menuItem: MenuItem;
  quantity: number;
};
