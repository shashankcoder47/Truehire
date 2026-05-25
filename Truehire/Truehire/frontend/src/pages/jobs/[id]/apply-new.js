import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ApplyNewRedirect() {
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (!router.isReady || !id) {
      return;
    }

    router.replace(`/jobs/${id}/apply`);
  }, [id, router]);

  return null;
}
