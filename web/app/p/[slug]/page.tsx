import { PublicBusinessProfile } from '@/components/profile/PublicBusinessProfile';
import { fetchBusinessBookingParams } from '@/lib/buildParams';

export async function generateStaticParams() {
  const params = await fetchBusinessBookingParams();
  return params.map((r) => ({ slug: r.businessId }));
}

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function PublicProfilePage({ params }: Props) {
  const { slug } = await params;
  return <PublicBusinessProfile slug={slug} />;
}
