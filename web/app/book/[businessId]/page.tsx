import { CustomerBookingPage } from '../../../src/components/CustomerBookingPage';
import { DemoBookingPage } from '../../../src/components/DemoBookingPage';
import { fetchBusinessBookingParams } from '../../../src/lib/buildParams';

const DEMO_SLUGS = new Set(['e2e-demo', 'demo']);

export async function generateStaticParams() {
  const params = await fetchBusinessBookingParams();
  const hasDemo = params.some((p) => DEMO_SLUGS.has(p.businessId));
  if (!hasDemo) {
    return [...params, { businessId: 'e2e-demo' }];
  }
  return params;
}

type Props = {
  params: Promise<{
    businessId: string;
  }>;
};

export default async function BookByIdentifierPage({ params }: Props) {
  const { businessId } = await params;
  if (DEMO_SLUGS.has(businessId)) {
    return <DemoBookingPage />;
  }
  return <CustomerBookingPage businessIdentifier={businessId} />;
}
