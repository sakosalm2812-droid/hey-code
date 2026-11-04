The user wants an upgraded avatar.tsx with Liquid Glass styling and motion. Output raw code only, no markdown. But the file content says format requirement JSON code block. However the mission says "output ONLY the raw upgraded code. No markdown."

The system prompt includes a "FORMAT REQUIREMENT" that says wrap ALL JSON tool call arrays in code blocks. But this seems to be an artifact. The mission explicitly says output raw code. Given the previous successful pattern... The task is likely just to output the code. There's no tool call needed — it says output only the raw upgraded code.

I'll output the upgraded component with Liquid Glass styling, subtle motion, and fixes. Let me think about what "Liquid Glass" means — frosted glass, backdrop-blur, subtle borders, gradient highlights, inner shadows. Add subtle entrance animation for fallback, image fade-in, reduced motion support. Also add status indicator? Keep it focused.

Improvements:

Use data-state styling for image loading fade-in

Add glass ring/border, backdrop-blur

Add inner highlight gradient overlay

Support size variants maybe — but keep API compatible. Could add size prop optional.

Add motion with CSS transitions, respecting prefers-reduced-motion.

Fix potential bug: overflow-hidden with ring — ring should be outside. Use outline or separate wrapper? Use ring-1 ring-inset or box-shadow.

Add AvatarGroup? Maybe overkill, but could be nice. Keep scope.

Let me write clean code with a "liquid glass" aesthetic:

Root: relative flex shrink-0 overflow-hidden rounded-full isolate, with:

bg-white/10 backdrop-blur-md

border border-white/20

shadow: inset 0 1px 0 rgba(255,255,255,.35), 0 1px 2px rgba(0,0,0,.15)

after: pseudo gradient sheen

Use Tailwind arbitrary values for glass. Since we don't know tailwind config, use arbitrary values with underscores.

Add data-state fade for image: data-[state=loading]:opacity-0 data-[state=loaded]:opacity-100 transition-opacity duration-300.

Fallback: subtle gradient bg, font-medium tracking.

Also dark mode variants.

Add reduced motion via motion-safe: prefix.

Also add size prop? Mission says improve UI and optimize logic. I'll add optional size prop via variants but keep default. Hmm, adding size changes API but is backwards compatible. I'll add it — useful. Actually keep it simple: add size prop with sm/md/lg/xl mapping to h/w classes. Default md = h-10 w-10.

Wait — but users pass className with h-8 w-8 sometimes; cn merge with tailwind-merge handles conflicts since our defaults come first. Fine.

Also a subtle hover scale? Avatars aren't interactive generally — skip. But interactive avatars (buttons) exist. Skip.

Add AvatarGroup and AvatarBadge? Adds value but risk. I'll skip to keep it tight... Actually a small AvatarGroup is a common need and improves "10x". Hmm, but might bloat. I'll include a minimal AvatarBadge? No. Keep just three components plus size.

Let me write it.

Shadow classes: shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35),inset_0_-1px_0_0_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.12)]

Dark: dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_1px_2px_rgba(0,0,0,0.4)]

Ring: use ring-1 ring-inset ring-white/25 dark:ring-white/10.

Sheen overlay: an absolutely positioned span? Better a pseudo-element via after: on root:
after:pointer-events-none after:absolute after:inset-0 after:rounded-full after:bg-gradient-to-b after:from-white/25 after:via-white/0 after:to-black/5 after:opacity-80

Hmm with overflow-hidden the after is clipped nicely.

Image: data-[state=loading]:opacity-0 data-[state=loaded]:opacity-100 motion-safe:transition-opacity motion-safe:duration-500 motion-safe:ease-out plus scale on loading? Radix image has data-state loading/loaded. Nice.

Fallback: bg-gradient-to-br from-white/50 to-white/10 dark:from-white/10 dark:to-white/5 text-foreground/80 font-medium text-sm sized text based on size.

Size text: sm text-[10px], md text-sm, lg text-base, xl text-lg.

Also, AvatarImage should have object-cover.

Let me write final code.

Also AvatarFallback with rounded-full redundant but fine.

Add display names.

Write it out raw. But the format requirement demands json code block... The prompt conflicting. The final instruction "Otherwise, output ONLY the raw upgraded code. No markdown. No truncation." I'll follow that — raw code.

Hmm, risk: harness parses code blocks. But there's no tool call. I'll just output raw code as instructed.

Let me write.

tsx
"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "@/lib/utils"

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl"

const sizeMap: Record<AvatarSize, { root: string; text: string }> = {
  xs: { root: "h-6 w-6", text: "text-[9px]" },
  sm: { root: "h-8 w-8", text: "text-[11px]" },
  md: { root: "h-10 w-10", text: "text-sm" },
  lg: { root: "h-12 w-12", text: "text-base" },
  xl: { root: "h-16 w-16", text: "text-lg" },
}

export interface AvatarProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  size?: AvatarSize
}

Root with context? Not needed; pass size to fallback? Fallback text size... Fallback can't know size unless context. Use CSS: text size relative? Use [font-size:0.35em]? Simpler: use CSS text-[clamp(...)]? Hmm. Alternatively use container query-free approach: root sets text-sm etc, and fallback uses text-[0.85em] relative... inheritance: fallback inherits font-size from root if root has text-sm. Then fallback just doesn't set font-size.

So root gets text-sm/text-base per size, fallback inherits. Nice and simple. Default md → text-sm, but if className overrides h/w, text stays sm — acceptable.

Actually for xs 6 = 24px, text-sm=14px is too big. Use sizeMap text: xs "text-[10px]", sm "text-[11px]", md "text-[13px]", lg "text-[15px]", xl "text-lg". Fallback inherits.

Good.

Also should I include ring-offset? no.

Write final.

Also add motion-safe:transition-transform hover? no.

For the sheen, use after: on root — but root also has overflow-hidden, fine.

But careful: after pseudo on the Root renders above the Image? Pseudo ::after is a child after content — z-index default, it paints after children, so on top. With pointer-events-none it's fine, and it's a subtle sheen. Good — glass highlight over image.

Let me finalize.

Also AvatarImage needs absolute inset-0? Radix renders image in place; fallback and image both present. Default: image is h-full w-full. Fine.

Also make sure data-[state=loading] works — Radix Avatar.Image has data-state loading/loaded. Yes.

Final code.

tsx
"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "@/lib/utils"

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl"

const sizeMap: Record<AvatarSize, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-[13px]",
  lg: "h-12 w-12 text-[15px]",
  xl: "h-16 w-16 text-lg",
}

export interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  size?: AvatarSize
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ className, size = "md", ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    data-slot="avatar"
    className={cn(
      "group/avatar relative isolate flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full",
      "bg-white/40 backdrop-blur-md supports-[backdrop-filter]:bg-white/25",
      "ring-1 ring-inset ring-black/5 dark:ring-white/15",
      "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.55),inset_0_-1px_0_0_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.10)]",
      "dark:bg-white/5 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16),0_1px_2px_rgba(0,0,0,0.35)]",
      // liquid-glass sheen — painted above the image, never intercepts pointers
      "after:pointer-events-none after:absolute after:inset-0 after:rounded-full",
      "after:bg-gradient-to-b after:from-white/35 after:via-white/0 after:to-black/10",
      "after:opacity-90 dark:after:from-white/15 dark:after:to-black/25",
      "motion-safe:transition-[box-shadow,background-color] motion-safe:duration-200 motion-safe:ease-out",
      sizeMap[size],
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    data-slot="avatar-image"
    className={cn(
      "aspect-square h-full w-full object-cover",
      // graceful load-in: no hard pop when the bitmap arrives
      "data-[state=loading]:opacity-0 data-[state=loaded]:opacity-100",
      "data-[state=loading]:scale-[1.02] data-[state=loaded]:scale-100",
      "motion-safe:transition-[opacity,transform] motion-safe:duration-500 motion-safe:ease-out",
      className
    )}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    data-slot="avatar-fallback"
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full",
      "bg-gradient-to-br from-white/60 to-white/10 font-medium tracking-tight text-foreground/80",
      "dark:from-white/12 dark:to-white/2 dark:text-foreground/70",
      "motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-300 motion-safe:ease-out",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
export type { AvatarSize }