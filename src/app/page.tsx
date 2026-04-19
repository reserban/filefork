import Optimizer from '@/components/optimizer/Optimizer'
import { SiteHeader } from '@/components/site/SiteHeader'
import { SiteFooter } from '@/components/site/SiteFooter'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 w-full">
        <Optimizer />
      </main>
      <SiteFooter />
    </div>
  )
}
