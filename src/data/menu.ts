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
    id: "dry-aged-strip",
    categoryId: "cat-steaks",
    name: "Dry-Aged Strip",
    description: "14oz New York strip, beef tallow glaze, cracked pepper.",
    price: 58,
    imageUrl: foodImage(
      "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=900&q=85"
    ),
    isAvailable: true,
    isFeatured: false,
    sortOrder: 3
  },
  {
    id: "bone-in-ribeye",
    categoryId: "cat-steaks",
    name: "Bone-In Ribeye",
    description: "22oz prime ribeye, roasted garlic, rosemary jus.",
    price: 74,
    imageUrl: foodImage(
      "https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?auto=format&fit=crop&w=900&q=85"
    ),
    isAvailable: true,
    isFeatured: false,
    sortOrder: 4
  },
  {
    id: "peppercorn-sirloin",
    categoryId: "cat-steaks",
    name: "Peppercorn Sirloin",
    description: "10oz sirloin, green peppercorn cream, watercress.",
    price: 38,
    imageUrl: foodImage(
      "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=900&q=85"
    ),
    isAvailable: true,
    isFeatured: false,
    sortOrder: 5
  },
  {
    id: "tomahawk-for-two",
    categoryId: "cat-steaks",
    name: "Tomahawk for Two",
    description: "36oz carved tableside, marrow butter, charred lemon.",
    price: 126,
    imageUrl: foodImage(
      "https://images.unsplash.com/photo-1579366948929-444eb79881eb?auto=format&fit=crop&w=900&q=85"
    ),
    isAvailable: true,
    isFeatured: false,
    sortOrder: 6
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
    sortOrder: 7
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
    sortOrder: 8
  },
  {
    id: "short-rib-risotto",
    categoryId: "cat-signatures",
    name: "Short Rib Risotto",
    description: "Braised short rib, porcini, parmesan, red wine jus.",
    price: 36,
    imageUrl: foodImage(
      "https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=900&q=85"
    ),
    isAvailable: true,
    isFeatured: false,
    sortOrder: 9
  },
  {
    id: "seared-salmon",
    categoryId: "cat-signatures",
    name: "Seared Salmon",
    description: "Crisp skin salmon, fennel salad, citrus beurre blanc.",
    price: 32,
    imageUrl: foodImage(
      "https://images.unsplash.com/photo-1485921325833-c519f76c4927?auto=format&fit=crop&w=900&q=85"
    ),
    isAvailable: true,
    isFeatured: false,
    sortOrder: 10
  },
  {
    id: "roasted-chicken",
    categoryId: "cat-signatures",
    name: "Roasted Chicken",
    description: "Half chicken, herb pan sauce, whipped potatoes.",
    price: 29,
    imageUrl: foodImage(
      "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=900&q=85"
    ),
    isAvailable: true,
    isFeatured: false,
    sortOrder: 11
  },
  {
    id: "mushroom-wellington",
    categoryId: "cat-signatures",
    name: "Mushroom Wellington",
    description: "Wild mushrooms, spinach, puff pastry, madeira sauce.",
    price: 28,
    imageUrl: foodImage(
      "https://images.unsplash.com/photo-1604909052743-94e838986d24?auto=format&fit=crop&w=900&q=85"
    ),
    isAvailable: true,
    isFeatured: false,
    sortOrder: 12
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
    sortOrder: 13
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
    sortOrder: 14
  },
  {
    id: "creamed-spinach",
    categoryId: "cat-sides",
    name: "Creamed Spinach",
    description: "Baby spinach, nutmeg cream, parmesan crust.",
    price: 13,
    imageUrl: foodImage(
      "https://images.unsplash.com/photo-1572449043416-55f4685c9bb7?auto=format&fit=crop&w=900&q=85"
    ),
    isAvailable: true,
    isFeatured: false,
    sortOrder: 15
  },
  {
    id: "mac-and-cheese",
    categoryId: "cat-sides",
    name: "Mac & Cheese",
    description: "Aged cheddar, gruyere, toasted sourdough crumb.",
    price: 16,
    imageUrl: foodImage(
      "https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?auto=format&fit=crop&w=900&q=85"
    ),
    isAvailable: true,
    isFeatured: false,
    sortOrder: 16
  },
  {
    id: "loaded-baked-potato",
    categoryId: "cat-sides",
    name: "Loaded Baked Potato",
    description: "Sea salt potato, sour cream, chives, smoked bacon.",
    price: 12,
    imageUrl: foodImage(
      "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=900&q=85"
    ),
    isAvailable: true,
    isFeatured: false,
    sortOrder: 17
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
    sortOrder: 18
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
    sortOrder: 19
  },
  {
    id: "black-manhattan",
    categoryId: "cat-cocktails",
    name: "Black Manhattan",
    description: "Rye, amaro, cherry bitters, orange oil.",
    price: 19,
    imageUrl: foodImage(
      "https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=900&q=85"
    ),
    isAvailable: true,
    isFeatured: false,
    sortOrder: 20
  },
  {
    id: "cucumber-gimlet",
    categoryId: "cat-cocktails",
    name: "Cucumber Gimlet",
    description: "Gin, cucumber, lime, basil, cracked sea salt.",
    price: 17,
    imageUrl: foodImage(
      "https://images.unsplash.com/photo-1606765962248-7ff407b51667?auto=format&fit=crop&w=900&q=85"
    ),
    isAvailable: true,
    isFeatured: false,
    sortOrder: 21
  },
  {
    id: "espresso-martini",
    categoryId: "cat-cocktails",
    name: "Espresso Martini",
    description: "Vodka, cold brew, coffee liqueur, cacao bitters.",
    price: 18,
    imageUrl: foodImage(
      "https://images.unsplash.com/photo-1611564494260-6f21b80af7ea?auto=format&fit=crop&w=900&q=85"
    ),
    isAvailable: true,
    isFeatured: false,
    sortOrder: 22
  }
];
