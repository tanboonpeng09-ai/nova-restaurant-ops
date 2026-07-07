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
    <div className="sticky top-[4.05rem] z-20 -mx-4 mt-0 flex max-w-none gap-5 overflow-x-auto border-b border-slate-200/80 bg-white/95 px-4 py-2.5 shadow-[0_8px_18px_rgba(15,23,42,0.045)] backdrop-blur-xl scrollbar-none lg:hidden">
      {categories.map((category) => (
        <button
          type="button"
          key={category.id}
          onClick={() => onSelectCategory(category.id)}
          className={`pressable min-h-10 whitespace-nowrap border-b-2 px-0 text-[13px] font-bold transition duration-200 ${
            selectedCategory === category.id
              ? "border-slate-950 text-slate-950"
              : "border-transparent text-slate-500 hover:text-slate-950"
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
