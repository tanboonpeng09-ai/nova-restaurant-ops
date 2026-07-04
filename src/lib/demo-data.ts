import type {
  Order,
  RestaurantSettings,
  StaffRequest,
  Table
} from "@/types";
import { restaurantConfig } from "@/config/restaurant";
import { categories, menuItems } from "@/data/menu";

export const restaurantSettings: RestaurantSettings = {
  name: restaurantConfig.name,
  tagline: restaurantConfig.tagline,
  description: restaurantConfig.description,
  phone: restaurantConfig.contact.phone,
  address: restaurantConfig.contact.address,
  brandColor: restaurantConfig.theme.colors.primary,
  heroImage: restaurantConfig.heroImage,
  orderingEnabled: true,
  closedMessage: "Restaurant is currently closed. Ordering will reopen at 5:00 PM.",
  kitchenPin: "123456"
};

export { categories, menuItems };

function demoOrderItem(menuItemId: string, quantity: number) {
  const menuItem = menuItems.find((item) => item.id === menuItemId);

  if (!menuItem) {
    throw new Error(`Missing demo menu item: ${menuItemId}`);
  }

  return {
    menuItemId,
    itemName: menuItem.name,
    unitPrice: menuItem.price,
    quantity,
    lineTotal: menuItem.price * quantity
  };
}

function subtotal(items: Array<{ lineTotal: number }>) {
  return items.reduce((total, item) => total + item.lineTotal, 0);
}

const order1001Items = [
  {
    id: "oi-1",
    ...demoOrderItem("wagyu-ribeye", 1)
  },
  {
    id: "oi-2",
    ...demoOrderItem("signature-burger", 1)
  },
  {
    id: "oi-3",
    ...demoOrderItem("truffle-fries", 1)
  }
];

const order1002Items = [
  {
    id: "oi-4",
    ...demoOrderItem("lobster-pasta", 1)
  },
  {
    id: "oi-5",
    ...demoOrderItem("smoked-old-fashioned", 1)
  },
  {
    id: "oi-6",
    ...demoOrderItem("ember-spritz", 1)
  }
];

export const tables: Table[] = Array.from({ length: restaurantConfig.demo.tableCount }, (_, index) => {
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
    subtotal: subtotal(order1001Items),
    notes: "Medium rare ribeye, no onions on burger.",
    createdAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    items: order1001Items
  },
  {
    id: "order-1002",
    orderNumber: "ORD-20260703-1002",
    tableNumber: "7",
    status: "preparing",
    subtotal: subtotal(order1002Items),
    notes: "Pasta first, cocktail with entree.",
    createdAt: new Date(Date.now() - 1000 * 60 * 16).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
    items: order1002Items
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
