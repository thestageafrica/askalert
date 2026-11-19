import { listCategories } from '@askalert/category-engine';
import { Button } from '@askalert/ui';

export default function AdminHomePage() {
  const categories = listCategories();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <p className="text-sm uppercase tracking-wide">AskAlert Admin</p>
      <h1 className="text-4xl font-semibold">Admin shell</h1>
      <p className="text-lg">Manage categories and marketplace operations.</p>
      <ul className="list-disc pl-5">
        {categories.map((category) => (
          <li key={category.id}>{category.name}</li>
        ))}
      </ul>
      <Button className="min-h-11 min-w-11 rounded-md px-4 py-2 font-medium">Open queue</Button>
    </main>
  );
}
