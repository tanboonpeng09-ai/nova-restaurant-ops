export function SectionHeading({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.26em] text-ember">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white light:text-black sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-white/58 light:text-black/58">{description}</p>
    </div>
  );
}
