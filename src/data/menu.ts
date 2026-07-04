import type { Category, MenuItem } from "@/types";

const foodImage = (url: string) => url;

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
    imageUrl: foodImage(
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=85"
    ),
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
    imageUrl: foodImage(
      "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=900&q=85"
    ),
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
    imageUrl: foodImage(
      "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=900&q=85"
    ),
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
    imageUrl: foodImage(
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85"
    ),
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
    imageUrl: foodImage(
      "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=900&q=85"
    ),
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
    imageUrl: foodImage(
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=85"
    ),
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
    imageUrl: foodImage(
      "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=900&q=85"
    ),
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
    imageUrl: foodImage(
      "https://images.unsplash.com/photo-1563223771-375783ee91ad?auto=format&fit=crop&w=900&q=85"
    ),
    isAvailable: true,
    isFeatured: false,
    sortOrder: 8
  }
];
