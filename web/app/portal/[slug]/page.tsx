import { OwnerPortal } from '@/components/owner/OwnerPortal';
import { fetchBusinessBookingParams } from '@/lib/buildParams';

export async function generateStaticParams() {
  const params = await fetchBusinessBookingParams();
  return params.map((r) => ({ slug: r.businessId }));
}

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function PortalBySlugPage({ params }: Props) {
  const { slug } = await params;
  return <OwnerPortal slug={slug} />;
}
