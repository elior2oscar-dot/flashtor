import { CustomerBookingPage } from '../../../src/components/CustomerBookingPage';
import { fetchBusinessBookingParams } from '../../../src/lib/buildParams';

export async function generateStaticParams() {
  return fetchBusinessBookingParams();
}

type Props = {
  params: Promise<{
    businessId: string;
  }>;
};

export default async function BookByIdentifierPage({ params }: Props) {
  const { businessId } = await params;
  return <CustomerBookingPage businessIdentifier={businessId} />;
}
