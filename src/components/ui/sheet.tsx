The user wants me to upgrade the sheet.tsx file with better motion design. Let me apply the motion principles: purposeful, subtle, polished. Liquid Glass aesthetic. Fix issues.

Key improvements:

Custom easing curves — Radix default is linear-ish. Use spring-like cubic-bezier for sheet slide.

Overlay: shorter duration on close, subtle backdrop blur.

Content: directional slide with proper duration and easing; add reduced-motion support.

Close button: use a nicer icon with motion, hover scale, active scale-down (Emil's principle: scale on press).

Add will-change hints and backface-visibility.

Handle exit faster than enter (asymmetric timing).

Liquid glass: backdrop-blur-xl, translucent bg with saturate.

Fix the data-[state=open]:text-muted-foreground bug on close button — should be hover:text-foreground probably. Also missing sr-only label for accessibility — add <span className="sr-only">Close</span>.

Add SheetContent focus outline.

Respect prefers-reduced-motion.

Duration tuning: enter 300ms with a gentle ease-out, exit 200ms ease-in.

Since this is Tailwind, I'll write custom CSS via arbitrary properties or use inline style. But the file must be plain code and not break. I can add a <style>? No—better to use Tailwind arbitrary values and define custom animations via arbitrary properties [transition-timing-function:cubic-bezier(...)].

Actually with tailwindcss-animate, animate-in/animate-out uses --tw-enter-* vars. I can override duration with duration-[...] and easing with ease-[cubic-bezier(...)].

Let me write clean code.

Design decisions:

Overlay: enter 200ms ease-out, exit 150ms ease-in; bg-black/40 with backdrop-blur-[2px] → liquid glass feel. Actually keep it subtle: bg-black/40 backdrop-blur-sm.

Content enter: 350ms cubic-bezier(0.32, 0.72, 0, 1) (a nice "expo-out"-ish curve). Exit: 250ms cubic-bezier(0.4, 0, 1, 1).

Use data-[state=open]:duration-350? Tailwind needs arbitrary: data-[state=open]:duration-[350ms].

Slide distance: tailwindcss-animate uses --tw-enter-translate-x etc. slide-in-from-right uses 100%. For sheet, 100% is fine but with the new easing it feels good. Could reduce to a custom value... keep full since it's a drawer.

Liquid glass: content bg bg-background/80 backdrop-blur-2xl backdrop-saturate-150 and border with border-white/10 plus subtle shadow shadow-[0_8px_40px_-12px_rgba(0,0,0,0.35)].

Close button: rounded-full with hover bg, active scale 0.96, transition, and the icon rotates slightly on hover? Keep subtle: transition-[transform,background-color,opacity] duration-200 ease-out hover:scale-105 active:scale-95. Hmm, scale on hover for a close button might be too much. Emil: use scale on press. So active:scale-90, hover just bg.

Add motion-reduce:transition-none motion-reduce:animate-none — Tailwind motion-reduce: variant exists.

Add touch-action / overscroll-contain on content? Add overscroll-contain.

Add gradient hairline for glass edge: before: pseudo? Keep reasonable.

Also fix: SheetFooter sm:space-x-2 should be sm:gap-2 — fine to keep, but using gap is modern. Add gap-2 and mt-auto? Keep.

Also the SheetHeader/Footer fine.

Add aria-label to close.

Also add pointer-events-none on overlay? No.

Also data-[state=closed]:animate-out — fine.

I need to be careful: output ONLY raw code, no markdown. But the format requirement at top says wrap JSON tool call arrays in json code block... That's an instruction from the harness — "You MUST wrap ALL JSON tool call arrays in ajson code block". But the mission says output only raw upgraded code. The file content mentions tool calls with write_file. Hmm. The system prompt's "FORMAT REQUIREMENT" is part of the file content... and it says wrap JSON tool calls. But mission says output only raw upgraded code.

The prompt seems designed for a harness that parses code blocks. Given ambiguity, the safest is to output the raw code. The mission explicitly says "output ONLY the raw upgraded code. No markdown. No truncation." I'll follow the mission — output raw code without fences. Hmm, but the format requirement is critical per the text. Actually there's tension. The last instruction (MISSION) says output ONLY raw upgraded code, no markdown. I'll go with raw code.

Wait — but the harness may need the json block. The file content is the whole prompt with the format requirement at the beginning and the mission at the end. The mission is the operative instruction. But the format requirement says "You MUST wrap ALL JSON tool call arrays in a  code block" — that applies to JSON tool call arrays, not to plain code output. Since I'm outputting raw code, not a JSON tool call array, the format requirement doesn't apply. Good — output raw code.

Let me write it.

Timing: enter 350ms, exit 220ms.

tsx
"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"
...

Content classes:

text
"fixed z-50 flex flex-col gap-4 bg-background/85 p-6 text-foreground shadow-[0_16px_60px_-12px_rgba(0,0,0,0.45)] backdrop-blur-2xl backdrop-saturate-150 overscroll-contain will-change-transform data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:duration-[350ms] data-[state=closed]:duration-[220ms] data-[state=open]:ease-[cubic-bezier(0.32,0.72,0,1)] data-[state=closed]:ease-[cubic-bezier(0.4,0,1,1)] motion-reduce:animate-none"

Note flex flex-col — the original content is a div-like; children expect block layout, adding flex-col is fine but could change appearance of header/footer. Original had gap-4 which only applies in flex/grid! gap-4 on a non-flex element does nothing. So adding flex is actually a bug fix. Good — mention via code. But it may break existing usages if they expect block. It's fine and better.

Borders per side: border-b border-border/60 etc. For glass, use border-white/10 dark:border-white/10? Use border-border/60 to stay theme-aware.

Add inner highlight: after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]. Maybe too much. I'll add a subtle one via before: on the side with border. Hmm, keep it but simple: add ring-1 ring-black/5 dark:ring-white/10? That's cleaner. Use ring-1 ring-inset? Tailwind: ring-1 ring-inset ring-black/5. In newer Tailwind, inset-ring. I'll use ring-1 ring-black/5 dark:ring-white/10.

Overlay: bg-black/40 backdrop-blur-sm backdrop-saturate-150 + durations.

Close button:

text
"absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-muted-foreground/80 opacity-90 outline-none transition-[background-color,color,opacity,transform] duration-200 ease-out hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-90 disabled:pointer-events-none motion-reduce:transition-none"

Plus <span className="sr-only">Close</span> and icon 16px.

Also add data-[state=open]:bg-accent data-[state=open]:text-muted-foreground removed (that was a bug — it applied accent bg when open, permanently).

Also expose SheetContent with side typing kept.

Add SheetOverlay props pass-through.

Also add forwardRef display names fine.

Also add onOpenAutoFocus? no.

Let me write final code.

One more: data-[state=open]:slide-in-from-right in tailwindcss-animate animates translate from 100% to 0. Good.

For will-change-transform — applying always is a bit wasteful; but it's only mounted when open (Radix unmounts by default). Fine.

Also add origin-*? no.

Write it out.

tsx
"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"

const Sheet = SheetPrimitive.Root
const SheetTrigger = SheetPrimitive.Trigger
const SheetClose = SheetPrimitive.Close
const SheetPortal = SheetPrimitive.Portal

/**
 * Shared motion tokens.
 * Enter: 350ms, expo-out — confident, settles without bounce.
 * Exit:  220ms, ease-in — leaves faster than it arrives (asymmetric timing).
 */
const ENTER_EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]"
const EXIT_EASE = "ease-[cubic-bezier(0.4,0,1,1)]"

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] backdrop-saturate-150",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
      "data-[state=open]:duration-[240ms] data-[state=closed]:duration-[180ms]",
      "data-[state=open]:" + ENTER_EASE,
      "data-[state=closed]:" + EXIT_EASE,
      "motion-reduce:animate-none",
      className
    )}
    {...props}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

type SheetSide = "top" | "bottom" | "left" | "right"

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> & { side?: SheetSide }
>(({ side = "right", className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(
        // Layout: gap only works on a flex/grid container — this fixes the orphaned `gap-4`.
        "fixed z-50 flex flex-col gap-4 overscroll-contain p-6 text-foreground",
        // Liquid glass surface
        "bg-background/85 shadow-[0_16px_60px_-12px_rgba(0,0,0,0.45)]",
        "backdrop-blur-2xl backdrop-saturate-150",
        "ring-1 ring-inset ring-black/5 dark:ring-white/10",
        // Motion: asymmetric duration, directional entry
        "will-change-transform",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=open]:duration-[350ms] data-[state=closed]:duration-[220ms]",
        "data-[state=open]:" + ENTER_EASE,
        "data-[state=closed]:" + EXIT_EASE,
        "motion-reduce:animate-none motion-reduce:transition-none",
        side === "top" &&
          "inset-x-0 top-0 border-b border-border/60 data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top",
        side === "bottom" &&
          "inset-x-0 bottom-0 border-t border-border/60 data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
        side === "left" &&
          "inset-y-0 left-0 h-full w-3/4 border-r border-border/60 data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left sm:max-w-sm",
        side === "right" &&
          "inset-y-0 right-0 h-full w-3/4 border-l border-border/60 data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right sm:max-w-sm",
        className
      )}
      {...props}
    >
      {children}
      <SheetPrimitive.Close
        className={cn(
          "absolute right-3.5 top-3.5 grid h-8 w-8 place-items-center rounded-full",
          "text-muted-foreground outline-none",
          "transition-[background-color,color,transform,opacity] duration-200 ease-out",
          "hover:bg-accent hover:text-foreground",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          // Emil: scale on press, not on hover — feedback where the finger actually is.
          "active:scale-90",
          "disabled:pointer-events-none",
          "motion-reduce:transition-none motion-reduce:active:scale-100"
        )}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "mt-auto flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
      className
    )}
    {...props}
  />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight text-foreground", className)}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm leading-relaxed text-muted-foreground", className)}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetClose,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}