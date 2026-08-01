import Link from "next/link";

import { AnimatedSection } from "@/components/common/animated-section";
import { AnimatedText } from "@/components/common/animated-text";
import { Icons } from "@/components/common/icons";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <AnimatedSection
      direction="up"
      className="mx-auto w-full max-w-7xl space-y-6 px-4 py-16 md:px-6 md:py-24"
      id="cta"
    >
      <div className="flex max-w-[42rem] flex-col items-start space-y-4 text-left">
        <AnimatedText
          as="h2"
          className="font-heading text-3xl leading-[1.1] md:text-5xl"
        >
          Let&apos;s build something together
        </AnimatedText>
        <AnimatedText
          as="p"
          delay={0.2}
          className="leading-normal text-muted-foreground sm:text-lg sm:leading-7"
        >
          Have a project in mind or looking for a software engineer? I&apos;d
          love to hear from you.
        </AnimatedText>
      </div>
      <AnimatedText delay={0.4} className="flex justify-start">
        <Link href="/contact" prefetch={false}>
          <Button className="rounded-xl">
            <Icons.send className="mr-2 h-4 w-4" /> Get in Touch
          </Button>
        </Link>
      </AnimatedText>
    </AnimatedSection>
  );
}
