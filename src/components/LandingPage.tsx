// ABOUTME: Landing page component shown to logged-out users
// ABOUTME: Displays the Divine Video brand message and login prompt

import { LoginArea } from "@/components/auth/LoginArea";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";
import { MailerLiteSignup } from "@/components/MailerLiteSignup";

export function LandingPage() {
  const plugin = useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-primary/80 dark:from-primary/90 dark:to-primary/70 p-4">
      <div className="max-w-2xl w-full space-y-6">
        <Card className="w-full shadow-2xl bg-white dark:bg-gray-900">
          <CardContent className="pt-8 pb-8 px-8 text-center space-y-6">
            {/* Elevator Pitch */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-logo text-primary">
                Divine
              </h1>
              <p className="text-xl md:text-2xl font-semibold text-foreground">
                Short-form looping videos. Authentic moments. Human creativity.
              </p>
              <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
                Experience the raw, unfiltered creativity of real people sharing genuine moments in 6-second loops. Built on decentralized technology, owned by no one, controlled by everyone.{" "}
                <a
                  href="https://techcrunch.com/2025/11/12/jack-dorsey-funds-divine-a-vine-reboot-that-includes-vines-video-archive/"
                  className="text-primary hover:underline"
                >
                  Learn more
                </a>
              </p>
            </div>

            {/* Mailing List Signup */}
            <div className="pt-4">
              <MailerLiteSignup />
            </div>

            {/* Screenshot Carousel */}
            <Link to="/discovery" className="block py-6 relative cursor-pointer">
              <Carousel
                className="w-full mx-auto"
                opts={{
                  align: "center",
                  loop: true,
                  dragFree: true,
                  watchDrag: true,
                }}
                plugins={[plugin.current]}
                onMouseEnter={plugin.current.stop}
                onMouseLeave={plugin.current.reset}
              >
                <CarouselContent className="-ml-2 md:-ml-4">
                  <CarouselItem className="pl-2 md:pl-4 basis-4/5 md:basis-3/4">
                    <div className="p-1">
                      <img
                        src="/screenshots/iPad 13 inch-0.png"
                        alt="Divine Video feed screenshot"
                        className="w-full h-auto rounded-lg shadow-lg"
                      />
                    </div>
                  </CarouselItem>
                  <CarouselItem className="pl-2 md:pl-4 basis-4/5 md:basis-3/4">
                    <div className="p-1">
                      <img
                        src="/screenshots/iPad 13 inch-1.png"
                        alt="Divine Video profile screenshot"
                        className="w-full h-auto rounded-lg shadow-lg"
                      />
                    </div>
                  </CarouselItem>
                  <CarouselItem className="pl-2 md:pl-4 basis-4/5 md:basis-3/4">
                    <div className="p-1">
                      <img
                        src="/screenshots/iPad 13 inch-2.png"
                        alt="Divine Video hashtags screenshot"
                        className="w-full h-auto rounded-lg shadow-lg"
                      />
                    </div>
                  </CarouselItem>
                  <CarouselItem className="pl-2 md:pl-4 basis-4/5 md:basis-3/4">
                    <div className="p-1">
                      <img
                        src="/screenshots/iPad 13 inch-3.png"
                        alt="Divine Video discovery screenshot"
                        className="w-full h-auto rounded-lg shadow-lg"
                      />
                    </div>
                  </CarouselItem>
                  <CarouselItem className="pl-2 md:pl-4 basis-4/5 md:basis-3/4">
                    <div className="p-1">
                      <img
                        src="/screenshots/iPad 13 inch-4.png"
                        alt="Divine Video trending screenshot"
                        className="w-full h-auto rounded-lg shadow-lg"
                      />
                    </div>
                  </CarouselItem>
                  <CarouselItem className="pl-2 md:pl-4 basis-4/5 md:basis-3/4">
                    <div className="p-1">
                      <img
                        src="/screenshots/iPad 13 inch-5.png"
                        alt="Divine Video lists screenshot"
                        className="w-full h-auto rounded-lg shadow-lg"
                      />
                    </div>
                  </CarouselItem>
                  <CarouselItem className="pl-2 md:pl-4 basis-4/5 md:basis-3/4">
                    <div className="p-1">
                      <img
                        src="/screenshots/iPad 13 inch-6.png"
                        alt="Divine Video search screenshot"
                        className="w-full h-auto rounded-lg shadow-lg"
                      />
                    </div>
                  </CarouselItem>
                </CarouselContent>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </Carousel>
              {/* Fade effects on sides */}
              <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white dark:from-background to-transparent pointer-events-none z-10" />
              <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white dark:from-background to-transparent pointer-events-none z-10" />
            </Link>

            {/* Action Buttons */}
            <div className="pt-4">
              <Link
                to="/discovery"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold bg-white dark:bg-gray-800 text-primary border-2 border-primary rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 active:scale-95"
              >
                Try it on the web
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Login Section */}
        <Card className="bg-white/80 dark:bg-black/40 backdrop-blur-md border-white/20">
          <CardContent className="pt-8 pb-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Log in with Nostr to continue
            </p>
            <LoginArea className="w-full justify-center" />
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-black/40 backdrop-blur-md border-white/20">
          <CardContent className="pt-8 pb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              {/* About Divine */}
              <div className="space-y-3">
                <h3 className="text-xs font-medium uppercase tracking-wider text-primary">
                  About Divine
                </h3>
                <nav className="flex flex-col gap-2">
                  <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    About
                  </Link>
                  <Link to="/faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    FAQ
                  </Link>
                  <Link to="/authenticity" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Our Mission
                  </Link>
                  <Link to="/open-source" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Open Source
                  </Link>
                </nav>
              </div>

              {/* Authenticity */}
              <div className="space-y-3">
                <h3 className="text-xs font-medium uppercase tracking-wider text-primary">
                  Authenticity
                </h3>
                <nav className="flex flex-col gap-2">
                  <Link to="/human-created" className="text-sm text-foreground font-semibold hover:text-primary transition-colors inline-flex items-center gap-1.5">
                    <span className="text-primary">⭐</span>
                    Made by Humans
                  </Link>
                  <Link to="/proofmode" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    ProofMode
                  </Link>
                </nav>
              </div>

              {/* Legal & Safety */}
              <div className="space-y-3">
                <h3 className="text-xs font-medium uppercase tracking-wider text-primary">
                  Legal & Safety
                </h3>
                <nav className="flex flex-col gap-2">
                  <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Privacy
                  </Link>
                  <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    EULA/T&C
                  </Link>
                  <Link to="/safety" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Safety
                  </Link>
                </nav>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}