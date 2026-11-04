The user wants me to upgrade Skeleton.jsx. But there's a conflict: the format requirement says wrap JSON tool calls in  code block. The mission says output ONLY raw upgraded code. There's no tool call needed here — this is a single-file upgrade. The format requirement is about wrapping JSON tool call arrays. Since we don't need a tool call, we can just output the code.

Wait — but the mission says "output ONLY the raw upgraded code. No markdown. No truncation." The format requirement says tool calls must be wrapped. But we're not making tool calls. We should just output the upgraded code raw.

Let me think about what improvements to make. This is a Skeleton component for a "HEY" design system with Liquid Glass aesthetic. Key things:

Bug fixes:

size="sm" passed to Skeleton but Skeleton doesn't accept size prop — it's ignored. The avatar variant gets default size from CSS. Should fix by supporting size or removing. Actually avatar should accept width/height. Let's add size support or use width/height.

count > 1 recursion passes className? No — it doesn't pass className to children, that's fine. But it also doesn't pass gap correctly? It does.

Recursive call loses className on inner skeleton — that's actually correct (group holds it). But it also loses nothing else.

gap variable: if gap is a raw CSS value, var(--space-${gap}) might break. Could be fine.

aria-hidden="true" — correct, but for accessibility, maybe add role="status" on group? Skeletons should be aria-hidden and there should be a live region. Keep aria-hidden.

width: width || ... — if width is 0 it falls through. Use width ?? .... Bug: width could be number 0. Minor.

Also height || undefined — same.

SkeletonCard header uses hardcoded px.

Liquid Glass UI: shimmer animation, glass gradient, backdrop blur, reduced-motion support, CSS variables.

Motion principles: Skeleton shimmer is a continuous animation — it's a loading indicator, not user-triggered, so frequency gate doesn't apply. Should respect prefers-reduced-motion. Use transform-based shimmer (GPU) rather than background-position.

Logic optimization: memoize variants map outside component, avoid re-creation. Use React.memo. Forward refs. Compute inline styles cleanly.

Add prop for gap number support.

Let me also add a shimmer style via inline? No, CSS handles it. But we only output JSX file. We can't modify CSS. So we should keep class names but perhaps add a data attribute for glass. Hmm. The mission says upgrade this file. We can add inline styles and additional class names but CSS file isn't provided. Better to keep classes and add a few robust inline styles (like border-radius for circular using width/height).

Actually for circular, if width/height given, border-radius 50%. CSS presumably handles. Let's add borderRadius: variant === 'circular' || variant === 'avatar' ? '50%' : undefined.

For SkeletonChat avatar size="sm" — fix by using width/height. Since CSS likely has sizes, but Skeleton doesn't use size. So either add size support or use width/height. I'll add size support via mapping to dimensions, or just use width/height. Simplest: replace size="sm" with width="32px" height="32px" — but maybe CSS uses the avatar variant size. Actually since size is ignored, currently the avatar shows at CSS default. Fix: pass width/height.

Let me write improved code.

Key improvements:

Move variants object outside component (module scope).

Use React.memo for performance.

Fix ?? vs ||.

Add as prop? Maybe not.

Support gap as number.

Add borderRadius for circular/avatar.

Support size prop for avatar/circular.

Fix SkeletonChat avatar.

Add role="status" + visually hidden "Loading" text? For accessibility, aria-hidden is standard for skeleton; screen readers should be told via aria-busy on container. Keep aria-hidden but maybe expose a label prop. I'll add aria-busy on group and keep aria-hidden.

Add style prop passthrough.

Add reduced-motion consideration — CSS side, but add data attribute.

Add data-variant for CSS hooks.

Use key from index (fine for static skeleton).

Also the recursive Skeleton call in group loses className — correct. But it also doesn't pass style. Add style prop.

Let me also think: SkeletonCard lines last width 60% — good.

Now write the code. The instruction "output ONLY the raw upgraded code. No markdown." — so no code fences. But format requirement says wrap JSON tool calls. We're not making tool calls. So output raw code.

Hmm, but the harness parses code blocks. The "previously successful pattern" suggests outputting raw code worked. Follow the mission.

Let me write it.

jsx
import { memo } from 'react';
import './Skeleton.css';

const VARIANT_CLASS = {
  text: 'hey-skeleton--text',
  circular: 'hey-skeleton--circular',
  rectangular: 'hey-skeleton--rectangular',
  card: 'hey-skeleton--card',
  button: 'hey-skeleton--button',
  input: 'hey-skeleton--input',
  avatar: 'hey-skeleton--avatar',
};

const SIZE_MAP = { xs: '16px', sm: '24px', md: '32px', lg: '48px', xl: '64px' };

function resolveGap(gap) {
  if (typeof gap === 'number') return `${gap}px`;
  if (/^[\d.]+(px|rem|em|%)$/.test(gap)) return gap;
  return `var(--space-${gap})`;
}

function resolveSize(size) {
  if (!size) return undefined;
  return SIZE_MAP[size] || size;
}

function SkeletonBase({ variant='text', width, height, size, className='', style, ...rest }) {
  const resolvedWidth = width ?? (variant === 'text' ? '100%' : resolveSize(size));
  const resolvedHeight = height ?? resolveSize(size);
  const isRound = variant === 'circular' || variant === 'avatar';
  return (
    <div
      className={`hey-skeleton ${VARIANT_CLASS[variant] || VARIANT_CLASS.text} ${className}`.trim()}
      data-variant={variant}
      style={{
        width: resolvedWidth,
        height: resolvedHeight,
        borderRadius: isRound ? '50%' : undefined,
        ...style,
      }}
      aria-hidden="true"
      {...rest}
    />
  );
}

export const Skeleton = memo(function Skeleton({ count = 1, gap = 'md', ...props }) {
  if (count > 1) {
    const { className = '', ...inner } = props;
    return (
      <div className={`hey-skeleton-group ${className}`.trim()} style={{ display:'flex', flexDirection:'column', gap: resolveGap(gap) }} aria-hidden="true" aria-busy="true">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonBase key={i} {...inner} />
        ))}
      </div>
    );
  }
  return <SkeletonBase {...props} />;
});
Skeleton.displayName = 'Skeleton';

Wait — SkeletonBase uses style prop but I destructure style and spread ...rest onto div; but rest could contain className? No, className destructured. Good. But rest could include style? No, destructured.

However, in Skeleton count>1 branch, inner may contain style — passed to each child, fine. gap removed from props in count>1? I destructured gap at top so not in props. Good.

Also count — if count is 0 or negative? count > 1 false, renders single. Fine.

Now SkeletonCard:

jsx
export const SkeletonCard = memo(function SkeletonCard({ lines=3, showImage=true, showAction=false, className='' }) {
  return (
    <div className={`hey-skeleton-card ${className}`.trim()} aria-hidden="true" aria-busy="true">
      {showImage && <div className="hey-skeleton-card__image hey-skeleton" data-variant="rectangular" />}
      ...

Hmm, image div was just hey-skeleton-card__image — CSS may animate it. Keep as is to not break CSS, but add hey-skeleton class? Might conflict. Keep original class. Actually to apply shimmer consistently, add data-variant. But risk. Keep original.

Card body lines: last line 60%. Good.

SkeletonChat: fix avatar size="sm" → size="sm" now supported by Skeleton via resolveSize. So it works! Good, that's a fix since Skeleton now supports size.

Let me finalize. Also add aria-busy only on group, not individual (aria-hidden already). Actually aria-busy on aria-hidden element is redundant. But harmless. Maybe skip. I'll keep it on group only.

Also add role="status" with visually hidden text? That would need CSS. Skip.

Let me ensure resolveGap regex handles 'md' → var. gap='md' → not number, not matching px/rem → var(--space-md). Good. gap=8 → '8px'. gap='8px' → matches → '8px'. gap='1rem' → '1rem'.

resolveSize: size could be number → SIZE_MAP[number] undefined → return number (number as style value works? React adds px for number for width/height). Actually returning number for width works. Fine. But size='sm' → '24px'.

Edge: width ?? ... — width='100%' works.

For circular with width only: height undefined → CSS probably sets aspect-ratio. Fine.

Now the file. Also add prop types? Not necessary.

Also memo import — use named.

Also export default? Original only named exports. Keep named.

One more: In count>1, children lose className intentionally. But also lose style? Passed via inner. Fine. But also lose size? Passed via inner. Good.

Potential bug: In count>1 we pass ...inner which includes count? No, count destructured out. Includes gap? No. Good.

Also SkeletonBase receives ...rest which might include count? No.

Let me write final. Add style prop support to Skeleton for the group too.

Also for the group, className destructured from props; but props also has style? We didn't destructure style for group — it stays in inner and passed to children. Hmm, if user passes style to Skeleton with count>1, it goes to children not group. Better destructure style at top and apply to group. Let me do:

jsx
export const Skeleton = memo(function Skeleton({ count = 1, gap = 'md', className = '', style, ...props }) {
  if (count > 1) {
    return (
      <div className={`hey-skeleton-group ${className}`.trim()} style={{ display:'flex', flexDirection:'column', gap: resolveGap(gap), ...style }} aria-hidden="true">
        {Array.from({length: count}).map((_, i) => <SkeletonBase key={i} {...props} />)}
      </div>
    );
  }
  return <SkeletonBase className={className} style={style} {...props} />;
});

Better.

Now SkeletonCard image: add hey-skeleton class? Original CSS .hey-skeleton-card__image likely has its own shimmer. Keep. But to be safe add data-variant.

Final code.

Also maybe add role="presentation"? aria-hidden enough.

I'll output raw code, no fences. The mission demands it.

Wait, the format requirement is very insistent about JSON code blocks for tool calls. But we're not calling tools — we're outputting the file content directly. The mission says "output ONLY the raw upgraded code." There's tension. Given the "previously successful pattern" cut off, and the file's format requirement is generic, I'll follow the mission since no tool call is being made. Actually, hmm — maybe the harness expects a write_file tool call wrapped in json. The format requirement says "You MUST wrap ALL JSON tool call arrays in a  code block." That implies if you make tool calls, wrap them. But mission says output raw code only.

Given the explicit mission "output ONLY the raw upgraded code. No markdown. No truncation." and that this is a direct upgrade request (not "write file"), I'll output raw code. The previous successful pattern likely did the same.

Let me produce clean code.

jsx
import { memo } from 'react';
import './Skeleton.css';

const VARIANT_CLASS = {
  text: 'hey-skeleton--text',
  circular: 'hey-skeleton--circular',
  rectangular: 'hey-skeleton--rectangular',
  card: 'hey-skeleton--card',
  button: 'hey-skeleton--button',
  input: 'hey-skeleton--input',
  avatar: 'hey-skeleton--avatar',
};

const SIZE_MAP = {
  xs: '16px',
  sm: '24px',
  md: '32px',
  lg: '48px',
  xl: '64px',
};

const UNIT_RE = /^[\d.]+(px|rem|em|%|vh|vw)$/;

function resolveGap(gap) {
  if (typeof gap === 'number') return `${gap}px`;
  if (typeof gap === 'string' && UNIT_RE.test(gap)) return gap;
  return `var(--space-${gap})`;
}

function resolveSize(size) {
  if (size == null) return undefined;
  return SIZE_MAP[size] || size;
}

function SkeletonBase({
  variant = 'text',
  width,
  height,
  size,
  className = '',
  style,
  ...rest
}) {
  const resolvedWidth = width ?? (variant === 'text' ? '100%' : resolveSize(size));
  const resolvedHeight = height ?? resolveSize(size);
  const isRound = variant === 'circular' || variant === 'avatar';

  return (
    <div
      className={`hey-skeleton ${VARIANT_CLASS[variant] || VARIANT_CLASS.text} ${className}`.trim()}
      data-variant={variant}
      style={{
        width: resolvedWidth,
        height: resolvedHeight,
        borderRadius: isRound ? '50%' : undefined,
        ...style,
      }}
      aria-hidden="true"
      {...rest}
    />
  );
}

export const Skeleton = memo(function Skeleton({
  count = 1,
  gap = 'md',
  className = '',
  style,
  ...props
}) {
  if (count > 1) {
    return (
      <div
        className={`hey-skeleton-group ${className}`.trim()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: resolveGap(gap),
          ...style,
        }}
        aria-hidden="true"
      >
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonBase key={i} {...props} />
        ))}
      </div>
    );
  }

  return <SkeletonBase className={className} style={style} {...props} />;
});

Skeleton.displayName = 'Skeleton';

export const SkeletonCard = memo(function SkeletonCard({
  lines = 3,
  showImage = true,
  showAction = false,
  className = '',
}) {
  return (
    <div className={`hey-skeleton-card ${className}`.trim()} aria-hidden="true">
      {showImage && (
        <div className="hey-skeleton-card__image hey-skeleton" data-variant="rectangular" />
      )}
      <div className="hey-skeleton-card__content">
        <div className="hey-skeleton-card__header">
          <Skeleton variant="text" width="40%" height="24px" />
          <Skeleton variant="text" width="30%" height="14px" />
        </div>
        <div className="hey-skeleton-card__body">
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
              key={i}
              variant="text"
              width={i === lines - 1 ? '60%' : '100%'}
              height="16px"
            />
          ))}
        </div>
        {showAction && (
          <div className="hey-skeleton-card__actions">
            <Skeleton variant="button" width="100px" />
            <Skeleton variant="button" width="100px" />
          </div>
        )}
      </div>
    </div>
  );
});

SkeletonCard.displayName = 'SkeletonCard';

export const SkeletonChat = memo(function SkeletonChat({
  messageCount = 3,
  className = '',
}) {
  return (
    <div className={`hey-skeleton-chat ${className}`.trim()} aria-hidden="true">
      {Array.from({ length: messageCount }).map((_, i) => (
        <div key={i} className="hey-skeleton-chat__message">
          <Skeleton variant="avatar" size="sm" />
          <div className="hey-skeleton-chat__bubble">
            <Skeleton variant="text" width="80%" height="20px" />
            <Skeleton variant="text" width="60%" height="20px" />
          </div>
        </div>
      ))}
    </div>
  );
});

SkeletonChat.displayName = 'SkeletonChat';

export default Skeleton;