import { supabase } from './supabase';

export type OwnerBusiness = {
  id: string;
  name: string;
  slug: string | null;
};

const fallbackBusinessId = process.env.EXPO_PUBLIC_BUSINESS_ID;

export async function loadOwnerBusinesses(): Promise<OwnerBusiness[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return [];
  }

  const { data: memberships, error: membershipError } = await supabase
    .from('business_members')
    .select('business_id')
    .eq('user_id', session.user.id);

  if (membershipError) {
    throw membershipError;
  }

  const businessIds = memberships?.map((row) => row.business_id) ?? [];

  if (businessIds.length === 0) {
    const { data: legacyProfile } = await supabase
      .from('owner_profiles')
      .select('business_id')
      .eq('id', session.user.id)
      .maybeSingle();

    if (legacyProfile?.business_id) {
      businessIds.push(legacyProfile.business_id);
    }
  }

  if (businessIds.length === 0 && fallbackBusinessId) {
    businessIds.push(fallbackBusinessId);
  }

  if (businessIds.length === 0) {
    return [];
  }

  const { data: businesses, error: businessesError } = await supabase
    .from('businesses')
    .select('id, name, slug')
    .in('id', businessIds)
    .order('name', { ascending: true });

  if (businessesError) {
    throw businessesError;
  }

  return businesses ?? [];
}
