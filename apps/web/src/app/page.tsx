import { listCategories } from '@askalert/category-engine';
import { createMoney, formatNaira } from '@askalert/payments';
import { Button } from '@askalert/ui';

export default function HomePage() {
  const categories = listCategories();
  const samplePrice = formatNaira(createMoney(250000));

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <p className="text-sm uppercase tracking-wide">Ask. Alert. Delivered.</p>
      <h1 className="text-4xl font-semibold">AskAlert</h1>
      <p className="text-lg">
        An AI agent finds vendors or buyers, negotiates, and recommends the best options in Lekki.
      </p>
      <p>Sample price: {samplePrice}</p>
      <ul className="list-disc pl-5">
        {categories.map((category) => (
          <li key={category.id}>{category.name}</li>
        ))}
      </ul>
      <Button className="min-h-11 min-w-11 rounded-md px-4 py-2 font-medium">Get started</Button>
    </main>
  );
}
