export type Category = {
  id: string;
  name: string;
  slug: string;
};

const categories: readonly Category[] = [
  { id: 'cat_home', name: 'Home services', slug: 'home-services' },
  { id: 'cat_food', name: 'Food and drinks', slug: 'food-and-drinks' },
];

export function listCategories(): readonly Category[] {
  return categories;
}

export function findCategoryBySlug(slug: string): Category | undefined {
  return categories.find((category) => category.slug === slug);
}
