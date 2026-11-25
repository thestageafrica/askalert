import { PlaceholderPageView } from '../../../components/app/placeholder-page-view';

export default function HelpPage() {
  return (
    <PlaceholderPageView
      title="Help and support"
      subtitle="Plain answers. Human help when you need it."
      emptyTitle="Help centre coming soon"
      emptyDescription="For now, message us from Contact. We reply during business hours when we can."
      actionHref="/contact/"
      actionLabel="Contact AskAlert"
    />
  );
}
