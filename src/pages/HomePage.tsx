import { SpinnerHousing } from '../components/spinner/SpinnerHousing'
import { QuickActions } from '../components/spinner/QuickActions'
import { RecommendationCarousel } from '../components/recipe/RecommendationCarousel'
import { useSeo } from '../lib/useSeo'

export function HomePage() {
  useSeo({
    title: 'Pantry2Plate — Decide what to cook tonight',
    description:
      'A playful meal picker for couples and families. Spin three reels — cuisine, style, protein — or set your own filters for time and dietary needs. Get curated recipe suggestions with cook time and ingredients.',
    path: '/',
    type: 'website',
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col items-center gap-8">
      <div className="text-center">
        <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-gradient-warm">
          What's for dinner?
        </h1>
        <p className="text-text-secondary mt-2 text-sm sm:text-base">
          Spin the reels and let fate decide tonight's meal
        </p>
      </div>

      <SpinnerHousing />
      <QuickActions />
      <RecommendationCarousel />
    </div>
  )
}
