The user wants an upgraded Avatar.jsx with Liquid Glass styling, bug fixes, improved UI. Need to output raw upgraded code only — but the format requirement says wrap JSON tool calls in code block. However the mission says output only raw upgraded code, no markdown. Hmm. The format requirement refers to tool calls. But we're told to output the raw upgraded code. There's tension. The safest: since the harness parses code blocks first for JSON tool calls... but the mission explicitly says output ONLY the raw upgraded code, no markdown.

The prior successful pattern includes the format requirement. But the final instruction says output only raw code. Given the ambiguity, I think outputting the code directly is what's expected — there's no tool call requested (no path writing instruction, no "write_file"). Actually the format requirement says "You MUST wrap ALL JSON tool call arrays in a  code block" — that applies if I make tool calls. I could just output the code raw. The mission statement is clear: output ONLY raw upgraded code.

I'll output the upgraded Avatar.jsx raw. Let me write good code.

Improvements:

Fix bug: remaining = avatars.length - max should be avatars.length - visibleAvatars.length (when fewer than max, remaining negative). Fix with Math.max(0, ...).

Guard name undefined: initials computed with optional chaining — fine, but n[0] when empty strings.

Add image load state (fade in) — motion: image fade-in on load, initials fade out. Use useState for loaded, handle onLoad, handle error fallback to initials.

Add ref forwarding merge, forwardRef with internal ref for image.

status: use role="img"? aria-label on span without role isn't announced; better to use a visually hidden text or aria-hidden plus sr-only text.

Add sizes: xs, sm, md, lg, xl maybe.

Liquid glass: CSS classes referenced; but only the JSX file is requested. Still, include CSS-in-file? The file imports './Avatar.css'. Mission says upgrade the file. I should keep the CSS import but maybe also add inline style vars for glass. Hmm — better to keep it component-only and rely on CSS class names, but Liquid Glass requires CSS. I could include a small embedded style block... that's hacky. Perhaps I should provide the JSX with classes and also add an accompanying CSS injection? The instruction says output only the raw upgraded code for Avatar.jsx. I'll keep CSS import and add class names designed for liquid glass, plus inline CSS custom properties where needed.

Actually to make it genuinely "Liquid Glass" I can append a <style>? No. Better: keep it clean, add hey-avatar--glass classes, and use inline style for the glass specular gradient via CSS vars... Overkill.

I'll be pragmatic: upgrade the JSX with:

proper initial extraction (trim, filter empty, handle unicode)

image loading states with crossfade (respecting prefers-reduced-motion via CSS)

error fallback

merged refs

accessible status with sr-only text

AvatarGroup with overlap via CSS var, remaining count fix, max clamp, aria-label list

keyboard/focus not needed

size numeric support

memoization

Also add useReducedMotion? Could add a small hook checking matchMedia — adds complexity but okay. Maybe keep minimal.

Let me write it.

Also AvatarGroup uses style prop passed to Avatar — Avatar spreads props onto div, fine, but style passed after {...props}? In Avatar, {...props} is spread then no style declared, so style works. Good. But className given via props className — fine.

Ref merge helper:

js
const setRefs = (node, ...refs) => refs.forEach(r => { if (!r) return; if (typeof r === 'function') r(node); else r.current = node; });

Image loading:

js
const [status, setStatus] = useState(src ? 'loading' : 'idle');
useEffect(() => { setImgState(src ? 'loading' : 'idle') }, [src]);

Careful: onLoad may fire before effect when cached; using key on img.

Implementation:

jsx
const [imgState, setImgState] = useState(src ? 'loading' : 'error');
useEffect(() => { setImgState(src ? 'loading' : 'error'); }, [src]);

If src falsy → show initials.

Show image if src && imgState !== 'error'. Image has class with modifier is-loaded opacity 1.

Show initials when !src || imgState === 'error'. To crossfade, keep initials underneath always (rendered below image), with image on top fading in. That's the classic approach — initials render behind, image fades over. Good and avoids layout shift. But when image errors, initials show. So render initials when no src OR error; but during loading we want a placeholder... If we render initials during loading too, we get nice crossfade. So: render initials always when there's a name (or fallback icon), and image on top. But initials might be empty. Render initials only if initials exist.

Actually simplest:

jsx
{(!hasImage || failed) ? initialsSpan : null}  // hmm

Let's do: render <span className="hey-avatar__initials" aria-hidden> whenever initials exist, and image on top when src. When image loads, initials hidden behind opaque image. Nice.

But aria-hidden initials with alt on image — when image present, alt text spoken. Fine.

Add data-state attributes.

Status: map position classes, add sr-only text.

Also add title maybe.

Group: overlapping via CSS, negative margin class based on size. Provide --hey-avatar-overlap inline var? Keep to CSS.

Also add AvatarGroup max sanity: const limit = Math.max(1, Math.floor(max)), visible = avatars.slice(0, limit), remaining = Math.max(0, avatars.length - visible.length).

Also role="group" fine, add aria-label listing names maybe.

Write final code. Keep it clean, no truncation, no markdown per instruction... but the harness may want json block. The mission says "output ONLY the raw upgraded code. No markdown." I'll follow mission.

Hmm, risk: system prompt format requirement says raw JSON outside code block won't be detected — but that's about tool calls. There's no write_file request here. The previous successful pattern ends with the mission. I'll output raw code.

Write CSS variable usage for size: style={{ '--hey-avatar-size': ... }} if numeric size. Handle numeric size.

Let me write.

jsx
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './Avatar.css';

const SIZE_MAP = { xs: 24, sm: 32, md: 40, lg: 56, xl: 80 };

const setRef = (node, ...refs) => {...};

const getInitials = (name) => {
  if (!name) return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  const first = [...parts[0]][0] ?? '';
  const last = [...parts[parts.length-1]][0] ?? '';
  return (first+last).toUpperCase();
};

Use Array.from for surrogate pairs.

Status: const STATUS_LABELS = { online: 'Online', offline: 'Offline', away: 'Away', busy: 'Busy', dnd: 'Do not disturb' }.

Component:

jsx
export const Avatar = forwardRef(function Avatar({...}, ref) {
  const [imageState, setImageState] = useState(src ? 'loading' : 'error');
  const imgRef = useRef(null);

  useEffect(() => { setImageState(src ? 'loading' : 'error'); }, [src]);

  const initials = useMemo(() => getInitials(name), [name]);

  const handleLoad = useCallback(() => setImageState('loaded'), []);
  const handleError = useCallback(() => setImageState('error'), []);

  const numericSize = typeof size === 'number';
  const styleVars = numericSize ? { '--hey-avatar-size': `${size}px` } : undefined;
  ...

Size class only when string.

Loading image with key={src}? not needed since effect resets.

Also pass through loading="lazy", decoding="async", draggable={false}, referrerPolicy? Keep lazy.

Merge ref: use callback ref combining forwarded ref and imgRef? imgRef only for the img. Use setRef on img with internal ref.

Actually I don't need imgRef at all. Drop it.

Accessibility: the wrapper div — if no name and no alt, add role="img" aria-label="Avatar". Let's set role="img" and aria-label on the wrapper only when there's no image? Simpler: keep alt on the image; for initials, the span has aria-hidden and we add an sr-only text with name. Add <span className="hey-avatar__sr">{name || 'Avatar'}</span> when no image.

Let's finalize code.

Also AvatarGroup overflow element should be an Avatar-ish glass circle with aria-hidden and sr-only text; keep aria-label but add role="img"? Use <div className="..." aria-hidden="true"> plus sr-only text outside. Simpler: keep the div with role="img" aria-label={...}.

Also add title attributes for names in group for hover discoverability. Add title={avatar.name} maybe.

Let me write the full file.

For group overlap: pass style combining zIndex and --hey-avatar-group-index. Keep zIndex.

Also add keyboard focus? Avatars aren't interactive typically. If onClick given, could add role button... Skip, keep spread.

Final code below.

jsx
import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import './Avatar.css';

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

const SIZE_TOKENS = ['xs', 'sm', 'md', 'lg', 'xl'];

/** Assigns a node to any number of refs (object or callback). */
const assignRef = (node, ...refs) => {
  for (const ref of refs) {
    if (!ref) continue;
    if (typeof ref === 'function') {
      ref(node);
    } else {
      try {
        ref.current = node;
      } catch {
        /* frozen / read-only ref — ignore */
      }
    }
  }
};

/**
 * Robust initials extraction.
 * - Trims and collapses whitespace
 * - Uses Array.from so surrogate pairs / emoji don't get sliced in half
 * - Single-word names get two characters ("Ada" -> "AD")
 */
const getInitials = (name) => {
  if (typeof name !== 'string') return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';

  const firstChar = (word) => Array.from(word)[0] ?? '';

  if (parts.length === 1) {
    return Array.from(parts[0]).slice(0, 2).join('').toUpperCase();
  }

  const first = firstChar(parts[0]);
  const last = firstChar(parts[parts.length - 1]);
  return `${first}${last}`.toUpperCase();
};

const STATUS_LABELS = {
  online: 'Online',
  offline: 'Offline',
  away: 'Away',
  busy: 'Busy',
  dnd: 'Do not disturb',
};

const STATUS_POSITIONS = new Set([
  'top-right',
  'top-left',
  'bottom-right',
  'bottom-left',
]);

/* ------------------------------------------------------------------ *
 * Avatar
 * ------------------------------------------------------------------ */

export const Avatar = forwardRef(function Avatar(
  {
    src,
    alt,
    name,
    size = 'md',
    shape = 'circle',
    status,
    statusPosition = 'bottom-right',
    className = '',
    style,
    onLoad,
    onError,
    ...props
  },
  ref
) {
  const hasSrc = Boolean(src);

  // 'loading' | 'loaded' | 'error'
  const [imageState, setImageState] = useState(hasSrc ? 'loading' : 'error');

  // Reset whenever the source changes so a new image re-runs the crossfade.
  useEffect(() => {
    setImageState(src ? 'loading' : 'error');
  }, [src]);

  const initials = useMemo(() => getInitials(name), [name]);

  const handleLoad = useCallback(
    (event) => {
      setImageState('loaded');
      onLoad?.(event);
    },
    [onLoad]
  );

  const handleError = useCallback(
    (event) => {
      setImageState('error');
      onError?.(event);
    },
    [onError]
  );

  const isNumericSize = typeof size === 'number';
  const sizeClass = isNumericSize ? 'hey-avatar--custom' : `hey-avatar--${size}`;
  const resolvedStatusPosition = STATUS_POSITIONS.has(statusPosition)
    ? statusPosition
    : 'bottom-right';

  const mergedStyle = isNumericSize
    ? { ...style, '--hey-avatar-size': `${size}px` }
    : style;

  const showImage = hasSrc && imageState !== 'error';
  const showInitials = initials.length > 0;
  const accessibleName = alt || name || 'Avatar';
  const statusLabel = status ? STATUS_LABELS[status] || status : null;

  return (
    <div
      ref={ref}
      className={[
        'hey-avatar',
        'hey-avatar--glass',
        sizeClass,
        `hey-avatar--${shape}`,
        status ? 'hey-avatar--has-status' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={mergedStyle}
      data-image-state={hasSrc ? imageState : 'none'}
      {...props}
    >
      {/* Initials sit underneath the image so the photo crossfades over them —
          no layout shift, no flash of empty circle while loading. */}
      {showInitials && (
        <span className="hey-avatar__initials" aria-hidden="true">
          {initials}
        </span>
      )}

      {!showInitials && imageState === 'error' && (
        <span className="hey-avatar__fallback" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
            <circle cx="12" cy="9" r="3.5" fill="currentColor" opacity="0.9" />
            <path
              d="M4.5 20.5c0-4.14 3.36-7.5 7.5-7.5s7.5 3.36 7.5 7.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              opacity="0.55"
            />
          </svg>
        </span>
      )}

      {showImage && (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className="hey-avatar__image"
          loading="lazy"
          decoding="async"
          draggable={false}
          onLoad={handleLoad}
          onError={handleError}
          data-loaded={imageState === 'loaded' ? 'true' : 'false'}
        />
      )}

      {/* Screen-reader name when the visible surface is decorative. */}
      {!showImage && <span className="hey-avatar__sr">{accessibleName}</span>}

      {status && (
        <span
          className={[
            'hey-avatar__status',
            'hey-avatar__status--glass',
            `hey-avatar__status--${status}`,
            `hey-avatar__status--${resolvedStatusPosition}`,
          ].join(' ')}
          aria-hidden="true"
        >
          <span className="hey-avatar__sr">{`Status: ${statusLabel}`}</span>
        </span>
      )}
    </div>
  );
});

Avatar.displayName = 'Avatar';

/* ------------------------------------------------------------------ *
 * AvatarGroup
 * ------------------------------------------------------------------ */

export const AvatarGroup = forwardRef(function AvatarGroup(
  {
    avatars = [],
    max = 5,
    size = 'md',
    shape = 'circle',
    className = '',
    onOverflowClick,
    ...props
  },
  ref
) {
  const safeAvatars = Array.isArray(avatars) ? avatars : [];
  const limit = Math.max(1, Math.floor(Number(max)) || 1);

  const visibleAvatars = safeAvatars.slice(0, limit);
  // Bug fix: was