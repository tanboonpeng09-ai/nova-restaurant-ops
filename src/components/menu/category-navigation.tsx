import type { Category } from "@/types";

export function CategoryNavigation({
  categories,
  selectedCategory,
  onSelectCategory
}: {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}) {
  return (
    <div className="sticky top-16 z-20 mt-6 flex max-w-full gap-2 overflow-x-auto rounded-full border border-white/[0.08] bg-ink/90 p-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.14)] backdrop-blur-xl scrollbar-none light:border-black/[0.06] light:bg-cream/94">
      {categories.map((category) => (
        <button
          type="button"
          key={category.id}
          onClick={() => onSelectCategory(category.id)}
          className={`pressable min-h-11 whitespace-nowrap rounded-full px-5 text-sm font-semibold transition duration-200 ${
            selectedCategory === category.id
              ? "bg-ember text-white shadow-[0_10px_24px_rgb(var(--color-primary)_/_0.22)]"
              : "bg-white/[0.045] text-white/62 md:hover:-translate-y-0.5 md:hover:bg-white/[0.08] light:bg-black/[0.035] light:text-black/62 light:md:hover:bg-black/[0.06]"
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
