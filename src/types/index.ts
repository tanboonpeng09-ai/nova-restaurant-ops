export type OrderStatus = "new" | "preparing" | "ready" | "completed";
export type TableStatus = "available" | "occupied" | "needs_bill" | "cleaning";
export type StaffRequestType = "bill" | "water" | "assistance";

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
