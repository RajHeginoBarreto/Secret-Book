import { usePageTitle } from '../../hooks/usePageTitle'
import { BenefitsSection } from './sections/BenefitsSection'
import { CluesSection } from './sections/CluesSection'
import { ContactSection } from './sections/ContactSection'
import { DiscoverySection } from './sections/DiscoverySection'
import { FaqSection } from './sections/FaqSection'
import { HeroSection } from './sections/HeroSection'
import { HowItWorksSection } from './sections/HowItWorksSection'
import { PlansSection } from './sections/PlansSection'
import { QuizCtaSection } from './sections/QuizCtaSection'
import { SurpriseBoxSection } from './sections/SurpriseBoxSection'
import { TestimonialsSection } from './sections/TestimonialsSection'

export function LandingPage() {
  usePageTitle()
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <CluesSection />
      <SurpriseBoxSection />
      <DiscoverySection />
      <BenefitsSection />
      <PlansSection />
      <TestimonialsSection />
      <FaqSection />
      <QuizCtaSection />
      <ContactSection />
    </>
  )
}
