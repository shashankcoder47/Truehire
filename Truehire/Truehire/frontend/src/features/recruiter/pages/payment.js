import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Header from '../../../Portal/Header'
import Footer from '../../../Portal/Footer'

export default function PaymentPage() {
  const router = useRouter()
  const [message, setMessage] = useState('Preparing your payment session...')

  useEffect(() => {
    if (!router.isReady) return

    if (router.query.success === 'true') {
      setMessage('Payment completed successfully.')
      return
    }

    if (router.query.cancelled === 'true') {
      setMessage('Payment was cancelled.')
      return
    }

    setMessage('Secure payment flow will continue from this page.')
  }, [router.isReady, router.query.cancelled, router.query.success])

  return (
    <>
      <Head>
        <title>Payment | TrueHire</title>
      </Head>

      <div className="min-h-screen bg-white text-slate-900">
        <Header />
        <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16">
          <h1 className="text-3xl font-bold">Payment</h1>
          <p className="text-base text-slate-600">{message}</p>
        </main>
        <Footer />
      </div>
    </>
  )
}


