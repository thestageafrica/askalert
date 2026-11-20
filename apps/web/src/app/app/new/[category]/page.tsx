import type { Metadata } from 'next';
import { NewRequestFlow } from '../../../../components/app/new-request-flow';

type PageProps = {
  params: Promise<{ category: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  return {
    title: `New ${category} ask`,
  };
}

export default async function NewRequestPage({ params }: PageProps) {
  const { category } = await params;
  return <NewRequestFlow categorySlug={category} />;
}
