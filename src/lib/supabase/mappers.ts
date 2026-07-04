import type {
  Category,
  MenuItem,
  Order,
  OrderItem,
  RestaurantSettings,
  StaffRequest,
  Table
} from "@/types";
import { restaurantConfig } from "@/config/restaurant";

type OrderItemRow = {
  id: string;
  menu_item_id: string | null;
  item_name: string;
  unit_price: string | number;
  quantity: number;
  line_total: string | number;
};

export function mapSettings(row: Record<string, unknown>): RestaurantSettings {
  return {
    name: String(row.restaurant_name ?? restaurantConfig.name),
    tagline: String(row.tagline ?? restaurantConfig.tagline),
    description: String(row.description ?? restaurantConfig.description),
    phone: String(row.phone ?? restaurantConfig.contact.phone),
    address: String(row.address ?? restaurantConfig.contact.address),
    brandColor: String(row.brand_color ?? restaurantConfig.theme.colors.primary),
    heroImage: String(row.hero_image_url ?? restaurantConfig.heroImage),
    orderingEnabled: Boolean(row.ordering_enabled),
    closedMessage: String(row.closed_message ?? "Restaurant is currently closed."),
    kitchenPin: ""
  };
}

export function mapCategory(row: Record<string, unknown>): Category {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: String(row.description ?? ""),
    sortOrder: Number(row.sort_order ?? 0),
    isActive: Boolean(row.is_active)
  };
}

export function mapMenuItem(row: Record<string, unknown>): MenuItem {
  return {
    id: String(row.id),
    categoryId: String(row.category_id ?? ""),
    name: String(row.name),
    description: String(row.description ?? ""),
    price: Number(row.price ?? 0),
    imageUrl: String(row.image_url ?? ""),
    isAvailable: Boolean(row.is_available),
    isFeatured: Boolean(row.is_featured),
    sortOrder: Number(row.sort_order ?? 0)
  };
}

export function mapTable(row: Record<string, unknown>): Table {
  return {
    id: String(row.id),
    label: String(row.label),
    number: String(row.table_number),
    status: row.status as Table["status"],
    qrUrl: String(row.qr_url ?? `/menu?table=${row.table_number}`),
    isActive: Boolean(row.is_active)
  };
}

export function mapOrderItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    menuItemId: row.menu_item_id ?? "",
    itemName: row.item_name,
    unitPrice: Number(row.unit_price),
    quantity: row.quantity,
    lineTotal: Number(row.line_total)
  };
}

export function mapOrder(row: Record<string, unknown> & { order_items?: OrderItemRow[] }): Order {
  return {
    id: String(row.id),
    orderNumber: String(row.order_number),
    tableNumber: String(row.table_number),
    status: row.status as Order["status"],
    subtotal: Number(row.subtotal ?? 0),
    notes: String(row.notes ?? ""),
    items: (row.order_items ?? []).map(mapOrderItem),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at ?? row.created_at)
  };
}

export function mapStaffRequest(row: Record<string, unknown>): StaffRequest {
  return {
    id: String(row.id),
    tableNumber: String(row.table_number),
    type: row.type as StaffRequest["type"],
    status: row.status as StaffRequest["status"],
    createdAt: String(row.created_at)
  };
}
