import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import apiService from '../../../utils/api';

const PREMIUM_PLAN = {
  id: 'premium',
  name: 'Premium Recruiter',
  amount: 999,
  amountLabel: 'Rs. 999',
  description: 'Highlight your company, unlock premium visibility, and move faster with higher-intent candidates.',
  features: [
    'Priority listing for your jobs',
    'Premium recruiter badge',
    'Higher reach across candidate feeds',
    'Premium support for hiring workflows',
  ],
};

const loadRazorpayCheckout = () =>
  new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Razorpay checkout is only available in the browser.'));
      return;
    }

    if (window.Razorpay) {
      resolve(window.Razorpay);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout.'));
    document.body.appendChild(script);
  });

export default function PremiumServices() {
  const router = useRouter();
  const [recruiter, setRecruiter] = useState(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const profileResponse = await apiService.getRecruiterProfile();

        if (profileResponse?.error) {
          throw new Error(profileResponse.error);
        }

        const profile = profileResponse?.recruiter || profileResponse?.data || null;

        if (!profile && typeof window !== 'undefined') {
          router.replace('/login');
          return;
        }

        if (isMounted) {
          setRecruiter(profile);
        }
      } catch (error) {
        if (isMounted) {
          setStatus({
            type: 'error',
            message: error.message || 'Please log in as a recruiter to continue.',
          });
        }
      } finally {
        if (isMounted) {
          setIsPageLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleUpgrade = async () => {
    if (isPaying) {
      return;
    }

    try {
      setIsPaying(true);
      setStatus({ type: '', message: '' });

      const orderResponse = await apiService.request('/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({
          amount: PREMIUM_PLAN.amount,
          planId: PREMIUM_PLAN.id,
        }),
      });

      console.log('Razorpay key from backend:', orderResponse?.key);

      if (!orderResponse?.key) {
        throw new Error('Razorpay key was not returned from the backend.');
      }

      const RazorpayCheckout = await loadRazorpayCheckout();

      const razorpay = new RazorpayCheckout({
        key: orderResponse.key,
        amount: orderResponse.amount,
        currency: 'INR',
        name: 'TrueHire Premium',
        description: `${PREMIUM_PLAN.name} upgrade`,
        order_id: orderResponse.orderId,
        prefill: {
          name: recruiter?.company_name || recruiter?.company || recruiter?.name || '',
          email: recruiter?.email || recruiter?.official_email || '',
        },
        notes: {
          planId: PREMIUM_PLAN.id,
          portal: 'truehire',
        },
        handler: async (response) => {
          try {
            const verificationResponse = await apiService.request('/payments/verify-payment', {
              method: 'POST',
              body: JSON.stringify({
                amount: PREMIUM_PLAN.amount,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (!verificationResponse?.success) {
              throw new Error('Payment verification failed.');
            }

            setRecruiter((current) =>
              current
                ? {
                    ...current,
                    is_premium: true,
                    premium_expiry_at: verificationResponse.premiumExpiryAt,
                  }
                : current,
            );

            setStatus({
              type: 'success',
              message: 'Payment Successful. Your recruiter account has been upgraded to premium.',
            });
          } catch (error) {
            setStatus({
              type: 'error',
              message: error.message || 'Payment succeeded, but server verification failed.',
            });
          } finally {
            setIsPaying(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsPaying(false);
            setStatus({
              type: 'error',
              message: 'Payment window was closed before completion.',
            });
          },
        },
        theme: {
          color: '#0f766e',
        },
      });

      razorpay.on('payment.failed', () => {
        setIsPaying(false);
        setStatus({
          type: 'error',
          message: 'Payment Failed. Please try again with Razorpay test mode details.',
        });
      });

      razorpay.open();
    } catch (error) {
      setIsPaying(false);
      setStatus({
        type: 'error',
        message: error.message || 'Unable to start premium checkout.',
      });
    }
  };

  if (isPageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-950 text-stone-100">
        <p className="text-sm uppercase tracking-[0.3em] text-stone-400">Loading premium checkout...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Upgrade to Premium | TrueHire</title>
      </Head>

      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.2),_transparent_35%),linear-gradient(180deg,_#0f172a,_#020617)] px-4 py-12 text-stone-100 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Link href="/recruiter-dashboard" className="inline-flex items-center text-sm text-teal-300 transition hover:text-teal-200">
            Back to recruiter dashboard
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.25fr_0.9fr]">
            <section className="rounded-[28px] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-teal-950/40 backdrop-blur">
              <p className="text-sm uppercase tracking-[0.35em] text-teal-300">Premium hiring</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">Upgrade to Premium</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-stone-300">{PREMIUM_PLAN.description}</p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {PREMIUM_PLAN.features.map((feature) => (
                  <div key={feature} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-stone-200">
                    {feature}
                  </div>
                ))}
              </div>

              {status.message ? (
                <div
                  className={`mt-8 rounded-2xl border px-4 py-3 text-sm ${
                    status.type === 'success'
                      ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
                      : 'border-rose-400/40 bg-rose-500/10 text-rose-100'
                  }`}
                >
                  {status.message}
                </div>
              ) : null}

              {recruiter?.is_premium ? (
                <div className="mt-8 rounded-2xl border border-teal-400/30 bg-teal-500/10 px-4 py-3 text-sm text-teal-100">
                  Premium is active{recruiter?.premium_expiry_at ? ` until ${new Date(recruiter.premium_expiry_at).toLocaleDateString()}` : '.'}
                </div>
              ) : null}
            </section>

            <aside className="rounded-[28px] border border-white/10 bg-stone-50 p-8 text-stone-900 shadow-2xl shadow-black/30">
              <p className="text-sm uppercase tracking-[0.3em] text-teal-700">Checkout</p>
              <h2 className="mt-4 text-3xl font-semibold">{PREMIUM_PLAN.name}</h2>
              <p className="mt-2 text-sm text-stone-600">One-time test-mode payment processed securely through Razorpay.</p>

              <div className="mt-8 rounded-3xl bg-stone-900 px-5 py-6 text-stone-100">
                <p className="text-sm text-stone-400">Amount</p>
                <p className="mt-2 text-4xl font-semibold">{PREMIUM_PLAN.amountLabel}</p>
                <p className="mt-2 text-sm text-stone-400">Charged in paise on the backend before order creation.</p>
              </div>

              <button
                type="button"
                onClick={handleUpgrade}
                disabled={isPaying}
                className="mt-8 w-full rounded-full bg-teal-600 px-6 py-4 text-base font-semibold text-white transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:bg-teal-300"
              >
                {isPaying ? 'Opening Razorpay...' : 'Upgrade to Premium'}
              </button>

              <div className="mt-6 space-y-3 rounded-2xl border border-stone-200 bg-white px-4 py-4 text-sm text-stone-600">
                <p>Use backend order creation only. The frontend never creates a Razorpay order directly.</p>
                <p>Use test UPI `success@razorpay` or test card `4111 1111 1111 1111` with any future expiry and CVV `123`.</p>
                <p>Payment success is trusted only after server-side signature verification.</p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
