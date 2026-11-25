import { PlaceholderPageView } from '../../../components/app/placeholder-page-view';

export default function DisputesPage() {
  return (
    <PlaceholderPageView
      title="Disputes"
      subtitle="Open cases stay private until they are resolved."
      emptyTitle="No open disputes"
      emptyDescription="If something goes wrong with a booking, you can open a dispute from the request page."
      actionHref="/app/requests/"
      actionLabel="View requests"
    />
  );
}
