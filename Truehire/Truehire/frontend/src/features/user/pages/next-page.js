import Head from 'next/head'
import Link from 'next/link'

export default function NextPage() {
  return (
    <>
      <Head>
        <title>Next Page - TrueHire</title>
      </Head>
      <main className="container">
        <h1>Welcome to the Next Page</h1>
        <p>This page demonstrates a full redirect target for the Home nav item.</p>
        <p>
          <Link href="/">Back to Home</Link>
        </p>
      </main>
    </>
  )
}



