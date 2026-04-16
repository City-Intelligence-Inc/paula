export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-8">
      <h1
        className="text-3xl sm:text-4xl font-semibold text-neutral-900 tracking-tight"
        style={{ fontFamily: "var(--font-original-surfer)" }}
      >
        {title}
      </h1>
      {description && (
        <p className="mt-2 text-neutral-600">{description}</p>
      )}
    </div>
  );
}
