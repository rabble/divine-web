// ABOUTME: Landing page component shown to logged-out users
// ABOUTME: Displays the diVine Video brand message

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
import { useRef, useState } from "react";
import { MailerLiteSignup } from "@/components/MailerLiteSignup";
import { Button } from "@/components/ui/button";
import SignupDialog from "@/components/auth/SignupDialog";

export function LandingPage() {
  const plugin = useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  );
  const [signupDialogOpen, setSignupDialogOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-primary to-primary/80 dark:from-primary/90 dark:to-primary/70 p-4 relative overflow-hidden">
        {/* Decorative curved line */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M -50,200 Q 250,100 500,300 T 1050,400"
            stroke="white"
            strokeWidth="8"
            fill="none"
            opacity="0.4"
            strokeLinecap="round"
          />
          <path
            d="M -50,600 Q 250,500 500,700 T 1050,800"
            stroke="white"
            strokeWidth="6"
            fill="none"
            opacity="0.3"
            strokeLinecap="round"
          />
        </svg>

        <div className="max-w-2xl w-full space-y-6 relative z-10">
        <Card className="w-full shadow-2xl bg-white dark:bg-gray-900">
          <CardContent className="pt-8 pb-8 px-8 text-center space-y-6">
            {/* Elevator Pitch */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-logo text-primary">
                di<span className="italic">V</span>ine
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
                        alt="diVine Video feed screenshot"
                        className="w-full h-auto rounded-lg shadow-lg"
                      />
                    </div>
                  </CarouselItem>
                  <CarouselItem className="pl-2 md:pl-4 basis-4/5 md:basis-3/4">
                    <div className="p-1">
                      <img
                        src="/screenshots/iPad 13 inch-1.png"
                        alt="diVine Video profile screenshot"
                        className="w-full h-auto rounded-lg shadow-lg"
                      />
                    </div>
                  </CarouselItem>
                  <CarouselItem className="pl-2 md:pl-4 basis-4/5 md:basis-3/4">
                    <div className="p-1">
                      <img
                        src="/screenshots/iPad 13 inch-2.png"
                        alt="diVine Video hashtags screenshot"
                        className="w-full h-auto rounded-lg shadow-lg"
                      />
                    </div>
                  </CarouselItem>
                  <CarouselItem className="pl-2 md:pl-4 basis-4/5 md:basis-3/4">
                    <div className="p-1">
                      <img
                        src="/screenshots/iPad 13 inch-3.png"
                        alt="diVine Video discovery screenshot"
                        className="w-full h-auto rounded-lg shadow-lg"
                      />
                    </div>
                  </CarouselItem>
                  <CarouselItem className="pl-2 md:pl-4 basis-4/5 md:basis-3/4">
                    <div className="p-1">
                      <img
                        src="/screenshots/iPad 13 inch-4.png"
                        alt="diVine Video trending screenshot"
                        className="w-full h-auto rounded-lg shadow-lg"
                      />
                    </div>
                  </CarouselItem>
                  <CarouselItem className="pl-2 md:pl-4 basis-4/5 md:basis-3/4">
                    <div className="p-1">
                      <img
                        src="/screenshots/iPad 13 inch-5.png"
                        alt="diVine Video lists screenshot"
                        className="w-full h-auto rounded-lg shadow-lg"
                      />
                    </div>
                  </CarouselItem>
                  <CarouselItem className="pl-2 md:pl-4 basis-4/5 md:basis-3/4">
                    <div className="p-1">
                      <img
                        src="/screenshots/iPad 13 inch-6.png"
                        alt="diVine Video search screenshot"
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
            <div className="pt-4 flex flex-wrap gap-3 justify-center">
              <Button
                onClick={() => setSignupDialogOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-8 py-6 text-base font-semibold bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 active:scale-95"
              >
                Sign Up
              </Button>
              <Link
                to="/discovery"
                className="inline-flex items-center justify-center gap-2 px-8 py-6 text-base font-semibold bg-white dark:bg-gray-800 text-primary border-2 border-primary rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 active:scale-95"
              >
                Try it on the web
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>

      <SignupDialog
        isOpen={signupDialogOpen}
        onClose={() => setSignupDialogOpen(false)}
      />
    </div>
  );
}