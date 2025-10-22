"use client";

import { Icons } from "@/components/common/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { SocialLinks } from "@/config/socials";
import Image from "next/image";

export function ProfileCard() {
  return (
    <Card className="w-full max-w-md mx-auto lg:mx-0">
      <CardContent className="p-8">
        {/* Profile Image */}
        <div className="flex justify-center mb-6">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20">
            <Image
              src={siteConfig.ogImage}
              alt={siteConfig.authorName}
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Name and Title */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-foreground mb-1">
            {siteConfig.authorName}
          </h2>
          <p className="text-muted-foreground text-sm mb-2">
            Software Engineer
          </p>
          <div className="flex items-center justify-center gap-1 text-muted-foreground">
            <Icons.mapPin className="w-4 h-4" />
            <span className="text-sm">Nha Trang, Khánh Hòa</span>
          </div>
        </div>

        {/* Skills/Technologies */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3 text-center">
            Technologies
          </h3>
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge variant="secondary">Python</Badge>
            <Badge variant="secondary">Java</Badge>
            <Badge variant="secondary">JavaScript</Badge>
            <Badge variant="secondary">React</Badge>
            <Badge variant="secondary">Next.js</Badge>
            <Badge variant="secondary">Node.js</Badge>
            <Badge variant="secondary">Docker</Badge>
            <Badge variant="secondary">DevOps</Badge>
          </div>
        </div>

        {/* Social Links */}
        <div>
          <h3 className="text-sm font-semibold mb-3 text-center">Connect</h3>
          <div className="grid grid-cols-2 gap-3">
            {SocialLinks.map((social) => (
              <Button
                key={social.name}
                variant="outline"
                size="sm"
                className="w-full justify-start"
                asChild
              >
                <a
                  href={social.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <social.icon className="w-4 h-4" />
                  <span className="truncate">{social.name}</span>
                </a>
              </Button>
            ))}
          </div>
        </div>

        {/* Resume Link */}
        <div className="mt-4 pt-4 border-t">
          <Button variant="outline" className="w-full mb-3" asChild>
            <a
              href="/resume"
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View Resume
            </a>
          </Button>

          {/* Website Link */}
          <Button variant="default" className="w-full" asChild>
            <a
              href={siteConfig.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <Icons.externalLink className="w-4 h-4" />
              Visit My Website
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
