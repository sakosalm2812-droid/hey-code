The user wants an upgraded button.tsx. They ask to output raw code only, no markdown. But the FORMAT REQUIREMENT at top says wrap JSON tool call arrays in  code block. There's a conflict. The file content says "output ONLY the raw upgraded code. No markdown." But the format requirement says wrap tool calls in json code block.

The format requirement is the automation harness instruction — it's critical. So I should use a write_file tool call wrapped in a  block.

Let me focus on the actual task: upgrade the button component with Liquid Glass styling, motion principles (Emil Kowalski restraint, speed, purposeful motion), fix bugs.

Bugs in current code:

asChild with Slot — loading spinner and children handling: when asChild, loading is ignored silently but disabled/aria-busy still applied to the child element which may not accept them. Actually Slot passes props to child; disabled on non-button child is bad. Also disabled prop passed to Slot child can warn.

The {...props} after disabled/aria-busy means props can override disabled — actually spread after means props override. If props contains disabled it overrides. Minor.

ring-offset-background etc fine.

Loading spinner: no aria-hidden, no sr-only "Loading" text. Accessibility issue.

No type="button" default — buttons inside forms default to submit. Bug.

Layout shift when loading text changes — no.

transition-colors — could use more purposeful motion.

gradient variant hover:from-primary/90 with transition-colors doesn't animate gradients (background-image not transitionable) — causes abrupt change. Fix with pseudo-element or use opacity overlay.

Missing active/press feedback (scale) — Emil's principle: press feedback on high-frequency interactions.

focus-visible ring only, fine but could add ring offset color.

asChild + loading: spinner never rendered.

The spinner SVG has className="mr-2 h-4 w-4 animate-spin" — spin animation should respect prefers-reduced-motion.

No data-loading attribute.

Spinner should be positioned to avoid layout shift — could overlay instead of adding margin.

Liquid Glass: glassmorphism — backdrop-blur, translucent bg, inner highlight border, subtle shadow, saturated backdrop.

Let me write a high-quality component.

Design:

Base: inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ...

Motion: transition-[color,background-color,border-color,box-shadow,transform,opacity] duration-150 ease-out active:scale-[0.98] — Emil: fast, subtle. Actually use motion-safe: for transforms and respect reduced motion.

Liquid glass: bg-white/60 backdrop-blur-xl backdrop-saturate-150 border border-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_1px_2px_rgba(0,0,0,0.06),0_8px_24px_-12px_rgba(0,0,0,0.18)] plus dark mode variants.

Gradient variant fix: use a pseudo-element overlay via relative overflow-hidden and before: with gradient, and hover opacity transition. Or simpler: use bg-[linear-gradient(...)] and animate via bg-[length]? Cleanest: before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary before:to-primary/80 before:opacity-100 hover:before:opacity-90 — hmm.

Actually let's do gradient with an overlay layer that changes opacity:

text
gradient: 'relative isolate overflow-hidden bg-primary text-primary-foreground shadow-... before:absolute before:inset-0 before:-z-10 before:bg-[linear-gradient(135deg,theme(colors.white/0.25),transparent_50%)] before:opacity-100 hover:before:opacity-0 transition-... '

Simpler and safer: keep gradient but use a second gradient layer:

text
gradient: 'bg-gradient-to-b from-primary to-primary/85 text-primary-foreground shadow-sm hover:from-primary/95 hover:to-primary/75 hover:shadow-md'

Gradients can't transition, so use before: overlay. Let's do:

text
gradient: 'relative isolate overflow-hidden bg-primary text-primary-foreground shadow-[...] before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-b before:from-white/20 before:to-transparent before:opacity-100 before:transition-opacity before:duration-200 hover:before:opacity-0'

Hmm -z-10 with isolate... the before would go behind the bg-primary of the element itself? With isolate and -z-10, the pseudo goes behind content but the element's own background paints at the element level, which is... Actually a negative z-index child paints behind the element's background? No — the element's background paints below all its children including negative z-index children? Per CSS spec, stacking: background of element paints first, then negative z-index children. So negative z-index pseudo would be above the background. Actually for a stacking context, the order is: background/borders of the element, then negative z-index descendants, then block-level, floats, inline, z-index:0/auto, then positive. So before:-z-10 renders above the element's own background. Good — so the white overlay sits on top of the primary background but below the text. Wait, text is inline content, which paints after negative z-index children. Yes. Good.

But it's a bit fragile. Alternative simpler approach: use bg-gradient-to-b from-primary to-primary/80 and on hover, since we can't transition, just accept. But we should fix it. Another approach: wrap gradient in the element's background-image via CSS variable and use @property? Too much.

Let's keep the before-overlay approach but simpler: overlay white gradient at top sheen, plus hover changes overlay to darker:

text
before:from-white/15 before:to-transparent hover:before:from-black/5 hover:before:to-black/10

That transitions opacity smoothly. Good.

Actually simpler: use two stacked gradients with opacity transitions. I'll go with pseudo-element.

Loading state:

Don't add margin; use a grid overlay or replace content? Best practice: keep width stable, spinner overlays. But simplest robust: spinner inline with gap, plus hide children with opacity? Layout shift occurs when spinner appears. Better: reserve space using an absolutely positioned spinner over content that fades, and children get opacity-0. Hmm but then button width stays the same. But content invisible is odd for loading.

Emil's approach: show spinner, keep label. Layout shift of 16px + gap is small but jarring on high-frequency. I'll do: wrapper span with relative; spinner absolutely positioned centered; children with transition-opacity data-[loading=true]:opacity-0? Actually keep the label visible for clarity — but shift.

I'll do the "spinner overlays, content fades" approach with fixed width preservation via a hidden sizer? Overkill. Let me just do: the button has relative, spinner absolutely centered, children get opacity-0 when loading. Button width preserved since children still occupy space. That's clean and zero layout shift. Add aria-live sr-only text.

But for asChild, loading shouldn't apply — we can still render spinner? With Slot, only one child allowed. So handle asChild separately: if asChild, don't render spinner (current behavior) but also don't pass disabled. Actually we should warn. Keep simple: asChild renders Slot with children, and loading is ignored but we still set aria-busy.

Hmm, better: for asChild, if loading, we can't inject. Keep as-is but strip invalid props. I'll pass aria-busy and data-loading only.

Also fix type="button" default — but only for non-asChild. Destructure type = 'button'.

Also {...props} order: put spread before overrides where appropriate so our controlled props win? Careful: className/variant already destructured. Put {...props} first then disabled etc. Actually ref and className fine. I'll place {...props} before disabled/aria-busy so ours win, but allow user disabled — disabled is destructured so props.disabled is undefined... no, disabled is destructured out so it won't be in props. Fine.

Reduced motion: motion-reduce:transition-none motion-reduce:active:scale-100 and spinner motion-reduce:animate-none... spinner without animation is useless; use motion-reduce:animate-[spin_1.5s_linear_infinite]? Better keep animate-spin but slower? Standard practice: keep spinner spinning (essential feedback). I'll leave animate-spin.

Focus ring: focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background.

Liquid glass base variants need to work with the theme tokens (primary etc.). I'll blend: keep semantic colors but add glass treatment (backdrop blur, inner highlight, layered shadows, border white/40).

Let me write variants:

default: bg-primary text-primary-foreground border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_1px_2px_0_rgba(0,0,0,0.08)] hover:bg-primary/90 hover:shadow-[...]

destructive: similar with destructive

outline: border border-border/70 bg-background/60 backdrop-blur-xl backdrop-saturate-150 text-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),0_1px_2px_0_rgba(0,0,0,0.04)] hover:bg-accent/60 hover:text-accent-foreground

secondary: glass

ghost: transparent, hover bg-accent/60

link: text-primary underline-offset-4 hover:underline

gradient: as above

Sizes: keep, maybe adjust for glass rounding.

Active press: active:scale-[0.98] — for icon size maybe 0.96. Emil: subtle. Use active:scale-[0.97] and transition-transform duration-100. Combine transitions: transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-150 ease-[cubic-bezier(0.2,0,0,1)].

Hmm, Emil recommends ease-out with ~150ms for hover, ~100ms for press.

Let me finalize the code.

tsx
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const glassBase =
  'backdrop-blur-xl backdrop-saturate-150 border border-white/40 dark:border-white/10 ' +
  'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.55),0_1px_2px_0_rgba(0,0,0,0.05),0_8px_24px_-12px_rgba(0,0,0,0.18)]';

const buttonVariants = cva(
  [
    'relative isolate inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg',
    'text-sm font-medium leading-none select-none',
    'transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-150 ease-[cubic-bezier(0.2,0,0,1)]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-50',
    'motion-safe:active:scale-[0.97] motion-reduce:transition-none',
  ].join(' '),
  {
    variants: {
      variant: {
        default: cn('bg-primary text-primary-foreground hover:bg-primary/90', glassBase, 'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_1px_2px_0_rgba(0,0,0,0.08),0_8px_24px_-12px_rgba(0,0,0,0.3)] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.24),0_2px_4px_0_rgba(0,0,0,0.1),0_12px_28px_-12px_rgba(0,0,0,0.35)]'),
        ...
      }
    }
  }
)

Careful with cn inside cva variants — cva accepts strings; using template with glassBase string is fine but cn merges tailwind conflicts which is desirable. But cva doesn't run cn. So shadow conflicts wouldn't be merged — duplicate shadow classes, last wins in CSS but specificity order in the generated stylesheet is by class order in CSS file, not class attribute order. Risky. So better to not include glassBase's shadow for solid variants; define separate base shadows per variant.

Simplify: create two helper strings:

ts
const glassSurface = 'backdrop-blur-xl backdrop-saturate-150 border';
const glassHighlight = 'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.55)]';

I'll just write each variant explicitly to avoid conflicts. Cleaner.

Let me write out:

ts
variant: {
  default:
    'border border-white/10 bg-primary text-primary-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_1px_2px_0_rgba(0,0,0,0.08),0_8px_24px_-12px_rgba(0,0,0,0.30)] hover:bg-primary/90 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.24),0_2px_6px_0_rgba(0,0,0,0.10),0_14px_30px_-12px_rgba(0,0,0,0.35)]',
  destructive:
    'border border-white/10 bg-destructive text-destructive-foreground shadow-[...] hover:bg-destructive/90',
  outline:
    'border border-border/70 bg-background/60 text-foreground backdrop-blur-xl backdrop-saturate-150 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),0_1px_2px_0_rgba(0,0,0,0.05)] hover:bg-accent/70 hover:text-accent-foreground dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_1px_2px_0_rgba(0,0,0,0.4)]',
  secondary:
    'border border-white/40 bg-secondary/70 text-secondary-foreground backdrop-blur-xl backdrop-saturate-150 shadow-[...] hover:bg-secondary/85 dark:border-white/10',
  ghost:
    'border border-transparent bg-transparent text-foreground