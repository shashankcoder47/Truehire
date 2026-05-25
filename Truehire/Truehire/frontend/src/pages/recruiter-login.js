import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function RecruiterLoginPage() {
  const router = useRouter()

  useEffect(() => {
    if (!router.isReady) return

    const query = new URLSearchParams()

    if (router.query?.next) {
      query.set('next', Array.isArray(router.query.next) ? router.query.next[0] : router.query.next)
    }

    router.replace(`/login${query.toString() ? `?${query.toString()}` : ''}`)
  }, [router])

  return null
}
