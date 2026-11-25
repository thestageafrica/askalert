import { PlaceholderPageView } from '../../../components/app/placeholder-page-view';

export default function SavedVendorsPage() {
  return (
    <PlaceholderPageView
      title="Saved vendors"
      subtitle="Keep favourites for the next ask."
      emptyTitle="No saved vendors yet"
      emptyDescription="When you find a vendor you like, save them here for faster booking next time."
      actionHref="/app/"
      actionLabel="Browse categories"
    />
  );
}