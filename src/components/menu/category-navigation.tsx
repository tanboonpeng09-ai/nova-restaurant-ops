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
    <div className="sticky top-[8.75rem] z-20 -mx-4 mt-5 flex max-w-none gap-2 overflow-x-auto border-y border-white/[0.07] bg-ink/92 px-4 py-2.5 shadow-[0_10px_28px_rgba(0,0,0,0.18)] backdrop-blur-xl scrollbar-none light:border-black/[0.06] light:bg-cream/94 lg:top-16 lg:mx-0 lg:mt-6 lg:max-w-full lg:rounded-full lg:border lg:p-1.5 lg:shadow-[0_12px_30px_rgba(0,0,0,0.14)]">
      {categories.map((category) => (
        <button
          type="button"
          key={category.id}
          onClick={() => onSelectCategory(category.id)}
          className={`pressable min-h-11 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition duration-200 lg:px-5 ${
            selectedCategory === category.id
              ? "bg-ember text-white shadow-[0_10px_24px_rgb(var(--color-primary)_/_0.22)]"
              : "bg-white/[0.035] text-white/58 md:hover:-translate-y-0.5 md:hover:bg-white/[0.08] light:bg-black/[0.035] light:text-black/62 light:md:hover:bg-black/[0.06]"
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
