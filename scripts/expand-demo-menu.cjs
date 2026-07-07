const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

function loadLocalEnv() {
  if (!fs.existsSync(".env.local")) return;

  for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) process.env[key] = value;
  }
}

const image = (url) => url;

const menuItems = {
  Steaks: [
    {
      name: "Dry-Aged Strip",
      description: "14oz New York strip, beef tallow glaze, cracked pepper.",
      price: 58,
      image_url: image("https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=900&q=85"),
      is_active: true,
      is_available: true,
      is_featured: false,
      sort_order: 3
    },
    {
      name: "Bone-In Ribeye",
      description: "22oz prime ribeye, roasted garlic, rosemary jus.",
      price: 74,
      image_url: image("https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?auto=format&fit=crop&w=900&q=85"),
      is_active: true,
      is_available: true,
      is_featured: false,
      sort_order: 4
    },
    {
      name: "Peppercorn Sirloin",
      description: "10oz sirloin, green peppercorn cream, watercress.",
      price: 38,
      image_url: image("https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=900&q=85"),
      is_active: true,
      is_available: true,
      is_featured: false,
      sort_order: 5
    },
    {
      name: "Tomahawk for Two",
      description: "36oz carved tableside, marrow butter, charred lemon.",
      price: 126,
      image_url: image("https://images.unsplash.com/photo-1579366948929-444eb79881eb?auto=format&fit=crop&w=900&q=85"),
      is_active: true,
      is_available: true,
      is_featured: false,
      sort_order: 6
    }
  ],
  Signatures: [
    {
      name: "Short Rib Risotto",
      description: "Braised short rib, porcini, parmesan, red wine jus.",
      price: 36,
      image_url: image("https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=900&q=85"),
      is_active: true,
      is_available: true,
      is_featured: false,
      sort_order: 9
    },
    {
      name: "Seared Salmon",
      description: "Crisp skin salmon, fennel salad, citrus beurre blanc.",
      price: 32,
      image_url: image("https://images.unsplash.com/photo-1485921325833-c519f76c4927?auto=format&fit=crop&w=900&q=85"),
      is_active: true,
      is_available: true,
      is_featured: false,
      sort_order: 10
    },
    {
      name: "Roasted Chicken",
      description: "Half chicken, herb pan sauce, whipped potatoes.",
      price: 29,
      image_url: image("https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=900&q=85"),
      is_active: true,
      is_available: true,
      is_featured: false,
      sort_order: 11
    },
    {
      name: "Mushroom Wellington",
      description: "Wild mushrooms, spinach, puff pastry, madeira sauce.",
      price: 28,
      image_url: image("https://images.unsplash.com/photo-1604909052743-94e838986d24?auto=format&fit=crop&w=900&q=85"),
      is_active: true,
      is_available: true,
      is_featured: false,
      sort_order: 12
    }
  ],
  Sides: [
    {
      name: "Creamed Spinach",
      description: "Baby spinach, nutmeg cream, parmesan crust.",
      price: 13,
      image_url: image("https://images.unsplash.com/photo-1572449043416-55f4685c9bb7?auto=format&fit=crop&w=900&q=85"),
      is_active: true,
      is_available: true,
      is_featured: false,
      sort_order: 15
    },
    {
      name: "Mac & Cheese",
      description: "Aged cheddar, gruyere, toasted sourdough crumb.",
      price: 16,
      image_url: image("https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?auto=format&fit=crop&w=900&q=85"),
      is_active: true,
      is_available: true,
      is_featured: false,
      sort_order: 16
    },
    {
      name: "Loaded Baked Potato",
      description: "Sea salt potato, sour cream, chives, smoked bacon.",
      price: 12,
      image_url: image("https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=900&q=85"),
      is_active: true,
      is_available: true,
      is_featured: false,
      sort_order: 17
    }
  ],
  Cocktails: [
    {
      name: "Black Manhattan",
      description: "Rye, amaro, cherry bitters, orange oil.",
      price: 19,
      image_url: image("https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=900&q=85"),
      is_active: true,
      is_available: true,
      is_featured: false,
      sort_order: 20
    },
    {
      name: "Cucumber Gimlet",
      description: "Gin, cucumber, lime, basil, cracked sea salt.",
      price: 17,
      image_url: image("https://images.unsplash.com/photo-1606765962248-7ff407b51667?auto=format&fit=crop&w=900&q=85"),
      is_active: true,
      is_available: true,
      is_featured: false,
      sort_order: 21
    },
    {
      name: "Espresso Martini",
      description: "Vodka, cold brew, coffee liqueur, cacao bitters.",
      price: 18,
      image_url: image("https://images.unsplash.com/photo-1611564494260-6f21b80af7ea?auto=format&fit=crop&w=900&q=85"),
      is_active: true,
      is_available: true,
      is_featured: false,
      sort_order: 22
    }
  ]
};

async function main() {
  loadLocalEnv();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables.");
  }

  const supabase = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const { data: categories, error: categoryError } = await supabase
    .from("menu_categories")
    .select("id,name")
    .in("name", Object.keys(menuItems));

  if (categoryError) throw categoryError;

  const categoryByName = new Map(categories.map((category) => [category.name, category.id]));
  const missingCategories = Object.keys(menuItems).filter((name) => !categoryByName.has(name));

  if (missingCategories.length > 0) {
    throw new Error(`Missing categories: ${missingCategories.join(", ")}`);
  }

  const { data: existingItems, error: existingError } = await supabase
    .from("menu_items")
    .select("name,category_id,is_active");

  if (existingError) throw existingError;

  const existingKeys = new Set(
    existingItems
      .filter((item) => item.is_active !== false)
      .map((item) => `${item.category_id}:${item.name}`)
  );

  const rows = Object.entries(menuItems).flatMap(([categoryName, items]) => {
    const categoryId = categoryByName.get(categoryName);
    return items
      .filter((item) => !existingKeys.has(`${categoryId}:${item.name}`))
      .map((item) => ({
        ...item,
        category_id: categoryId
      }));
  });

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from("menu_items").insert(rows);
    if (insertError) throw insertError;
  }

  const { data: finalItems, error: finalError } = await supabase
    .from("menu_items")
    .select("category_id,is_active");

  if (finalError) throw finalError;

  for (const [categoryName, categoryId] of categoryByName.entries()) {
    const count = finalItems.filter((item) => item.category_id === categoryId && item.is_active !== false).length;
    console.log(`${categoryName}: ${count} active items`);
  }

  console.log(`Inserted ${rows.length} missing demo menu items.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
