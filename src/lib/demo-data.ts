import type {
  Category,
  MenuItem,
  Order,
  RestaurantSettings,
  StaffRequest,
  Table
} from "@/types";

export const restaurantSettings: RestaurantSettings = {
  name: "NOVA STEAKHOUSE",
  tagline: "Premium American Grill",
  description:
    "A polished QR ordering and restaurant operations demo built for premium dining rooms, fast kitchen workflows, and owner-grade visibility.",
  phone: "(212) 555-0198",
  address: "184 Madison Avenue, New York, NY",
  brandColor: "#FF6B2C",
  heroImage:
    "https://images.unsplash.com/photo-1559329007-40df8a9345d8?auto=format&fit=crop&w=1800&q=85",
  orderingEnabled: true,
  closedMessage: "Restaurant is currently closed. Ordering will reopen at 5:00 PM.",
  kitchenPin: "123456"
};

export const categories: Category[] = [
  {
    id: "cat-steaks",
    name: "Steaks",
    slug: "steaks",
    description: "Prime cuts finished over open flame.",
    sortOrder: 1,
    isActive: true
  },
  {
    id: "cat-signatures",
    name: "Signatures",
    slug: "signatures",
    description: "House favorites built for tables that share.",
    sortOrder: 2,
    isActive: true
  },
  {
    id: "cat-sides",
    name: "Sides",
    slug: "sides",
    description: "Crisp, rich, and made for the center of the table.",
    sortOrder: 3,
    isActive: true
  },
  {
    id: "cat-cocktails",
    name: "Cocktails",
    slug: "cocktails",
    description: "Balanced pours with smoke, citrus, and spice.",
    sortOrder: 4,
    isActive: true
  }
];

export const menuItems: MenuItem[] = [
  {
    id: "wagyu-ribeye",
    categoryId: "cat-steaks",
    name: "Wagyu Ribeye",
    description: "12oz American wagyu, ember butter, smoked sea salt.",
    price: 68,
    imageUrl:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=85",
    isAvailable: true,
    isFeatured: true,
    sortOrder: 1
  },
  {
    id: "filet-mignon",
    categoryId: "cat-steaks",
    name: "Filet Mignon",
    description: "Center cut filet, black garlic jus, potato pave.",
    price: 54,
    imageUrl:
      "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=900&q=85",
    isAvailable: true,
    isFeatured: false,
    sortOrder: 2
  },
  {
    id: "lobster-pasta",
    categoryId: "cat-signatures",
    name: "Lobster Pasta",
    description: "Maine lobster, Calabrian chili, saffron cream.",
    price: 42,
    imageUrl:
      "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=900&q=85",
    isAvailable: true,
    isFeatured: true,
    sortOrder: 3
  },
  {
    id: "signature-burger",
    categoryId: "cat-signatures",
    name: "Signature Burger",
    description: "Dry-aged blend, smoked cheddar, onion jam, brioche.",
    price: 26,
    imageUrl:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85",
    isAvailable: true,
    isFeatured: false,
    sortOrder: 4
  },
  {
    id: "truffle-fries",
    categoryId: "cat-sides",
    name: "Truffle Fries",
    description: "Parmesan, black truffle, chive aioli.",
    price: 15,
    imageUrl:
      "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=900&q=85",
    isAvailable: true,
    isFeatured: true,
    sortOrder: 5
  },
  {
    id: "charred-broccolini",
    categoryId: "cat-sides",
    name: "Charred Broccolini",
    description: "Lemon, chili crunch, toasted almond.",
    price: 14,
    imageUrl:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=85",
    isAvailable: false,
    isFeatured: false,
    sortOrder: 6
  },
  {
    id: "smoked-old-fashioned",
    categoryId: "cat-cocktails",
    name: "Smoked Old Fashioned",
    description: "Bourbon, demerara, bitters, orange smoke.",
    price: 18,
    imageUrl:
      "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=900&q=85",
    isAvailable: true,
    isFeatured: true,
    sortOrder: 7
  },
  {
    id: "ember-spritz",
    categoryId: "cat-cocktails",
    name: "Ember Spritz",
    description: "Aperol, blood orange, prosecco, rosemary.",
    price: 16,
    imageUrl:
      "https://images.unsplash.com/photo-1563223771-375783ee91ad?auto=format&fit=crop&w=900&q=85",
    isAvailable: true,
    isFeatured: false,
    sortOrder: 8
  }
];

export const tables: Table[] = Array.from({ length: 12 }, (_, index) => {
  const number = String(index + 1);
  const statuses: Table["status"][] = ["available", "occupied", "needs_bill", "cleaning"];
  return {
    id: `table-${number}`,
    label: `Table ${number}`,
    number,
    status: statuses[index % statuses.length],
    qrUrl: `/menu?table=${number}`,
    isActive: true
  };
});

export const orders: Order[] = [
  {
    id: "order-1001",
    orderNumber: "ORD-20260703-1001",
    tableNumber: "2",
    status: "new",
    subtotal: 109,
    notes: "Medium rare ribeye, no onions on burger.",
    createdAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    items: [
      {
        id: "oi-1",
        menuItemId: "wagyu-ribeye",
        itemName: "Wagyu Ribeye",
        unitPrice: 68,
        quantity: 1,
        lineTotal: 68
      },
      {
        id: "oi-2",
        menuItemId: "signature-burger",
        itemName: "Signature Burger",
        unitPrice: 26,
        quantity: 1,
        lineTotal: 26
      },
      {
        id: "oi-3",
        menuItemId: "truffle-fries",
        itemName: "Truffle Fries",
        unitPrice: 15,
        quantity: 1,
        lineTotal: 15
      }
    ]
  },
  {
    id: "order-1002",
    orderNumber: "ORD-20260703-1002",
    tableNumber: "7",
    status: "preparing",
    subtotal: 76,
    notes: "Pasta first, cocktail with entree.",
    createdAt: new Date(Date.now() - 1000 * 60 * 16).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
    items: [
      {
        id: "oi-4",
        menuItemId: "lobster-pasta",
        itemName: "Lobster Pasta",
        unitPrice: 42,
        quantity: 1,
        lineTotal: 42
      },
      {
        id: "oi-5",
        menuItemId: "smoked-old-fashioned",
        itemName: "Smoked Old Fashioned",
        unitPrice: 18,
        quantity: 1,
        lineTotal: 18
      },
      {
        id: "oi-6",
        menuItemId: "ember-spritz",
        itemName: "Ember Spritz",
        unitPrice: 16,
        quantity: 1,
        lineTotal: 16
      }
    ]
  }
];

export const staffRequests: StaffRequest[] = [
  {
    id: "request-1",
    tableNumber: "3",
    type: "bill",
    status: "open",
    createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString()
  }
];
