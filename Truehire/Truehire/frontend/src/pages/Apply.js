import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function LegacyApplyPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/jobs');
  }, [router]);

  return null;
}
