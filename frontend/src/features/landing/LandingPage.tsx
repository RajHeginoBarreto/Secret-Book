import { usePageTitle } from '../../hooks/usePageTitle'
import { ContactSection } from './sections/ContactSection'
import { FaqSection } from './sections/FaqSection'
import { HeroSection } from './sections/HeroSection'
import { HowItWorksSection } from './sections/HowItWorksSection'
import { PlansSection } from './sections/PlansSection'
import { ProductsSection } from './sections/ProductsSection'
import { QuizSection } from './sections/QuizSection'
import { ReaderProfileSection } from './sections/ReaderProfileSection'

export function LandingPage() {
  usePageTitle()
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <ProductsSection />
      <QuizSection />
      <PlansSection />
      <ReaderProfileSection />
      <FaqSection />
      <ContactSection />
    </>
  )
}
