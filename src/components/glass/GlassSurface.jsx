The user wants me to upgrade a React component file (GlassSurface.jsx) using motion/design skill principles. They want "Liquid Glass" improved UI, bug fixes, logic optimization. Output only raw upgraded code. But wait — the format requirement at the top says all JSON tool call arrays must be wrapped in  code blocks. However the mission says output ONLY the raw upgraded code. There's a conflict.

Hmm, let me re-read. The format requirement is about tool calls — "You MUST wrap ALL JSON tool call arrays in a  code block." That's for the automation harness to parse tool calls. But the mission says output only raw upgraded code.

Given the harness parses code blocks for JSON tool calls, and the mission is to upgrade a file... The "PREVIOUSLY SUCCESSFUL PATTERN" suggests writing files via write_file tool. Actually the instructions say output ONLY raw upgraded code. But there's no tool available listed. Let me think about what's expected.

The file content says format requirement about wrapping JSON tool call arrays. This seems like a prompt injection test / harness. The actual deliverable likely should be the upgraded code. Since no tools are actually defined for me to call (I'm an assistant), I should output the raw upgraded code as requested.

But wait — the format requirement explicitly says raw JSON outside code block won't be detected. This suggests the harness expects a write_file tool call in a json code block. The "PREVIOUSLY SUCCESSFUL PATTERN" indicates the pattern.

Given ambiguity, the safest is to output the upgraded code. But the format requirement is "READ CAREFULLY" and critical. It says wrap ALL JSON tool call arrays in  block. If I don't make tool calls, that's fine — I just output code.

The mission explicitly: "Otherwise, output ONLY the raw upgraded code. No markdown. No truncation."

So I should output raw code. But that conflicts with the top format requirement which is about tool calls, not about final output. I think the final answer should be raw code. However, the harness likely wants a write_file JSON block to actually write the file.

Let me reconsider: The prompt is structured as a system-like instruction with "FORMAT REQUIREMENT" for tool calls, then the actual task. This is likely a scenario where the assistant is expected to call write_file with the upgraded content. The "PREVIOUSLY SUCCESSFUL PATTERN" section is cut off but shows the audit pattern.

Given the instruction "output ONLY the raw upgraded code" vs "wrap JSON tool calls", I think the intended behavior: output a  block with a write_file tool call containing the code. That satisfies both — the tool call is in a json block, and the content is the raw upgraded code.

Actually, re-reading: "You MUST wrap ALL JSON tool call arrays in a  code block." So if I'm calling a tool, wrap it. The mission says output only raw upgraded code. These can be reconciled: I output a json block with write_file tool call, where content is the upgraded code.

I'll go with the write_file tool call format, since the harness parses code blocks first. The path should be the file path: src\components\glass\GlassSurface.jsx. Use absolute path? The example says "/abs/path". The file is relative. I'll use the given path.

Now let me actually design the improved component.

Key improvements:

Bug fixes:

TIER_STYLES objects are recreated on every render inside component? Actually they're module-level constants — fine. But tierStyle is a reference; combinedStyle useMemo depends on tierStyle and style — fine.

useMemo for baseClasses depends on tierClass, interactive, className — fine but minor.

Polymorphic as — when Component changes, ref forwarding works but TypeScript not relevant.

interactive adds hover/press — but styles.interactive class.

Potential issue: spreading ...props after style — style prop passed separately so ok, but if caller passes style in props it's destructured. Good.

Missing: motion design — no transitions. Liquid glass should have subtle motion.

Liquid Glass improvements:

Add specular highlight / edge highlight via pseudo-elements or background layers.

Add subtle motion: on interactive, hover lift/scale, press scale down — using CSS transitions with proper easing, respecting prefers-reduced-motion.

Use spring-like cubic-bezier.

Add will-change sparingly.

Add inner border highlight gradient.

Add background-image with subtle gradient for liquid feel.

Motion principles (Emil/Jakub):

Frequency: glass surfaces are often high-frequency (hover on cards) → keep transitions fast (~150-200ms), use transform/opacity.

Interactive hover: subtle translateY(-1px) + shadow increase; press: scale(0.985).

Respect reduced motion.

Performance:

backdrop-filter is expensive; keep static.

Memoize styles module-level (already).

Avoid recreating objects.

Accessibility:

interactive should add role/tabIndex? Maybe not force, but add focus-visible styling via class.

API:

Add elevation/glow? Keep simple.

Add motion prop to disable transitions?

Add asChild? no.

Let me write improved code. Since it's a .jsx file, no TypeScript.

I need to be careful with CSS module class names — I can only reference styles.* that exist. I'll add classes like styles.interactive, styles.motion, etc. But I can't edit the CSS file. Hmm. The mission is only this file. I should keep to existing classes but I can add inline style transitions and use data attributes. But adding CSS classes that don't exist would break.

Better approach: use inline styles for motion? Transitions can be inline via style. But hover states can't be done inline without JS. Since interactive presumably relies on CSS module .interactive for hover, I'll keep it but enhance the component with motion that CSS handles.

Actually I can add transition properties inline in combinedStyle, and rely on the existing .interactive class for hover transforms. But I don't know what .interactive does. The original code just adds the class. So the CSS handles hover.

For upgrade, I'll:

Add --glass-* local variables? no.

Add transition inline respecting reduced motion via a media query check? Can't inline media query. Could use a hook usePrefersReducedMotion.

Let me add a small hook to detect reduced motion and conditionally apply transitions.

But adding transitions inline to a component that already has .interactive hover CSS could conflict. Hmm.

Given uncertainty, I'll focus on:

Fixing the tier style memoization (module-level fine).

Polymorphic ref: for custom components, forwarding ref works. But when as is a string, fine.

Forward remaining props cleanly.

Add data-tier attribute for styling hooks.

Add data-interactive.

Add role and tabIndex when interactive and as is not a button? Risky. Maybe add tabIndex={interactive && !props.tabIndex ? 0 : props.tabIndex}? Could be wrong. I'll leave optional.

Add specular edge highlight as an extra background layer via backgroundImage combining? That changes visual. The tier styles already use var fills. I can add a backgroundImage with linear-gradient overlay for the liquid sheen. But that would override the CSS module background. Since inline style takes precedence, adding backgroundImage is fine and adds liquid glass feel.

Liquid glass aesthetic: subtle top-edge highlight, gradient sheen. Add:

text
backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 22%, rgba(255,255,255,0) 55%, rgba(255,255,255,0.06) 100%)'

combined with background color. Since background shorthand sets backgroundImage to none, I should set background as color and backgroundImage separately. Original uses background: var(...) which sets background-color and resets image. If I add backgroundImage inline it overrides. Order: combinedStyle has background then style; I'll add backgroundImage after background. Actually object spread: {...tierStyle, ...style} — I can insert backgroundImage in tierStyle after background. Good.

But careful: background shorthand resets backgroundImage. So put background first then backgroundImage. In JS object key order matters for shorthand? No — JS object property order doesn't affect CSS cascade; the final style object has both background and backgroundImage keys. In React style object, background and backgroundImage both apply; background shorthand then backgroundImage longhand — CSS cascade: longhand after shorthand wins if applied in order. React applies styles in object key order? Actually React sets each property individually; order in object doesn't strictly determine cascade because each is set as a separate style property, and backgroundImage longhand overrides the image part of background shorthand if set after. React iterates keys in insertion order, setting style[prop]. So setting background first then backgroundImage works. I'll order keys accordingly.

Also add inset highlight via boxShadow already in vars.

Add subtle transition for background-color? no.

For motion:

Add transitionProperty inline for interactive: transform, box-shadow, background-color. Duration 180ms cubic-bezier(0.22,1,0.36,1) (ease-out-quint-ish). Respect reduced motion.

Add willChange only when interactive? Backdrop-filter already forces compositing. Skip.

Let me also fix: combinedStyle useMemo dependency tierStyle is stable module const, fine.

Add useReducedMotion hook:

js
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);
  return reduced;
}

SSR safe: window undefined initially — use typeof window check.

But this adds re-render. Fine.

Actually for a glass surface, transitions are subtle; I could just always include transition and let CSS @media (prefers-reduced-motion) in module handle it... but can't edit CSS. So hook.

Hmm, but hook in every GlassSurface could be heavy if many. It's fine.

Alternatively, I can apply transitions via a <style>? No.

Let me keep it clean: add hook, apply transition inline only when interactive && !reduced.

But the existing .interactive CSS likely defines hover transform. Without knowing, adding inline transition helps smooth it. Good.

Also, motion for interactive press: can't do without JS handlers. I could add onPointerDown/Up to set pressed state and inline transform scale. That's a nice liquid glass press. Let me add optional press feedback:

js
const [pressed, setPressed] = useState(false);

But that adds state per component. Could be acceptable for interactive only. Use pointer events:
onPointerDown → setPressed(true), onPointerUp/onPointerLeave/onPointerCancel → false.
Then style transform: pressed ? 'scale(0.985)' : undefined. But hover translateY handled by CSS. Combining transform inline would override CSS hover transform. Risky.

Simplify: rely on CSS for hover/press, just ensure transition. Actually to avoid override conflicts, I'll not set inline transform, just transitionProperty.

Hmm but then no motion improvement. The "10x better" expectation... Let me think.

Given I cannot see CSS module, the safest high-value upgrades:

Correctness/robustness: handle unknown tier gracefully (done), memoization, prop forwarding.

Add data attributes for styling.

Add liquid-glass gradient overlay (visual improvement).

Add reduced-motion-aware transitions.

Add focus-visible support for interactive (tabIndex + role button if as is not interactive element? risky).

Add as element ref handling for custom components (forwardRef already).

Avoid passing tier/interactive to DOM (already destructured).

Add displayName.

Add CSS custom property for blur? no.

Also a subtle bug: WebkitBackdropFilter casing in React style object should be WebkitBackdropFilter — correct. Good.

Another: backdropFilter with saturate — fine.

Performance: useMemo for combinedStyle recreates object each render if style prop is new object literal — unavoidable. Fine.

Let me also add contain: 'paint'? Could break shadows. Skip.

Add isolation: 'isolate'? could help stacking. Minor.

I'll add a sheen via backgroundImage and a top inner highlight already in boxShadow var.

Let me also consider: for bar tier, backdrop blur is variable. fine.

Let me write the code.

Also the convenience components pass props including possibly tier override — they set tier first then {...props}, so props.tier overrides. Good, but if someone passes tier it overrides — acceptable. Actually order: <GlassSurface ref={ref} tier="bar" {...props} /> — props spread after tier, so props.tier wins. Fine.

Now the output format: I'll produce a  code block with a tool call array containing write_file. But the mission says "output ONLY the raw upgraded code. No markdown." Conflict.

The top says "You MUST wrap ALL JSON tool call arrays in a  code block." So if I make a tool call, wrap it. The mission's "output only raw upgraded code" might be legacy. Given the harness parses code blocks first for tool calls, and the whole setup screams "automation harness", I'll output the tool call JSON block.

But is there actually a 
write_file
 tool? The example shows 
[{"tool": "write_file", "path": "/
abs/path", "content": "..."}]
. So yes.

I'll use path as given: "src\components\glass\GlassSurface.jsx" — but example