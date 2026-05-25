import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PricingCards from './PricingCards'

export const metadata: Metadata = {
  title: 'Pricing — PurlyRemote',
  description: 'Simple, transparent pricing for hiring remote talent. Start free, scale as you grow.',
}

export default function PricingPage() {
  return (
    <>
      <Header />
      <main className="pt-20">
        <div className="section-padding bg-neutral-bg">
          <div className="container-max">
            <div className="text-center mb-12">
              <div className="section-tag mx-auto mb-4">Pricing</div>
              <h1 className="section-title">Simple, transparent pricing</h1>
              <p className="section-subtitle mt-4 max-w-xl mx-auto">
                Start free. Upgrade when you&apos;re ready to hire at scale.
              </p>
            </div>
            <PricingCards />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
