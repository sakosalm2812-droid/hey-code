import { motion } from 'framer-motion';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { ModalOverlay, ModalContent } from '@/components/ui/modal';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { SheetOverlay, SheetContent } from '@/components/ui/sheet';
import { TooltipPrimitive, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { TabsPrimitive, TabsListRoot, TabsTriggerRoot, TabsContentRoot } from '@/components/ui/tabs';

export default function Playground() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}
    >
      <h1 style={{ marginBottom: 32, fontSize: 'clamp(2rem, 4vw, 2.5rem)' }}>
        HEY UI Primitives Playground
      </h1>

      <motion.section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 24,
          marginBottom: 32,
        }}
      >
        {/* Button */}
        <motion.div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            padding: 24,
            transition: 'border-color 0.2s ease',
          }}
          whileHover={{ borderColor: 'var(--accent)' }}
        >
          <h3 style={{ marginBottom: 16, fontSize: 14, fontWeight: 600 }}>Button</h3>
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
        </motion.div>

        {/* Input */}
        <motion.div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-field)',
            padding: 16,
            transition: 'border-color 0.2s ease',
          }}
          whileHover={{ borderColor: 'var(--accent)' }}
        >
          <h3 style={{ marginBottom: 16, fontSize: 14, fontWeight: 600 }}>Input</h3>
          <Input placeholder="Type something..." />
          <Input disabled placeholder="Disabled input" />
        </motion.div>

        {/* Textarea */}
        <motion.div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-field)',
            padding: 16,
            transition: 'border-color 0.2s ease',
          }}
          whileHover={{ borderColor: 'var(--accent)' }}
        >
          <h3 style={{ marginBottom: 16, fontSize: 14, fontWeight: 600 }}>Textarea</h3>
          <Textarea rows={3} placeholder="Type something..." />
          <Textarea disabled rows={3} placeholder="Disabled textarea" />
        </motion.div>

        {/* Select */}
        <motion.div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            padding: 16,
            transition: 'border-color 0.2s ease',
          }}
          whileHover={{ borderColor: 'var(--accent)' }}
        >
          <h3 style={{ marginBottom: 16, fontSize: 14, fontWeight: 600 }}>Select</h3>
          <Select>
            <SelectTrigger>
              <span>Select option</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem>Option 1</SelectItem>
              <SelectItem>Option 2</SelectItem>
              <SelectItem>Option 3</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Toggle */}
        <motion.div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            padding: 16,
            transition: 'border-color 0.2s ease',
          }}
          whileHover={{ borderColor: 'var(--accent)' }}
        >
          <h3 style={{ marginBottom: 16, fontSize: 14, fontWeight: 600 }}>Toggle</h3>
          <Toggle />
          <Toggle aria-checked="true" />
        </motion.div>

        {/* Badge */}
        <motion.div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            padding: 16,
            transition: 'border-color 0.2s ease',
          }}
          whileHover={{ borderColor: 'var(--accent)' }}
        >
          <h3 style={{ marginBottom: 16, fontSize: 14, fontWeight: 600 }}>Badge</h3>
          <Badge variant="default">Default</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </motion.div>

        {/* Avatar */}
        <motion.div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            padding: 16,
            transition: 'border-color 0.2s ease',
          }}
          whileHover={{ borderColor: 'var(--accent)' }}
        >
          <h3 style={{ marginBottom: 16, fontSize: 14, fontWeight: 600 }}>Avatar</h3>
          <Avatar src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop" alt="User" />
          <Avatar>US</Avatar>
        </motion.div>

        {/* Modal */}
        <motion.div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            padding: 16,
            transition: 'border-color 0.2s ease',
          }}
          whileHover={{ borderColor: 'var(--accent)' }}
        >
          <h3 style={{ marginBottom: 16, fontSize: 14, fontWeight: 600 }}>Modal</h3>
          <motion.button
            onClick={() => {}}
            style={{
              marginBottom: 12,
              padding: '8px 16px',
              borderRadius: 6,
              border: 'none',
              background: 'var(--accent)',
              color: 'var(--on-accent)',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Open Modal
          </motion.button>
          <span>Modal content would go here</span>
        </motion.div>
      </motion.section>

      <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        <p style={{ marginBottom: 8, fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Built Components</p>
        <div>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginRight: 6 }}>•</span>
          <a href="#" style={{ fontSize: 10, color: 'var(--accent)', textDecoration: 'none' }}>Button</a>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginRight: 6 }}>•</span>
          <a href="#" style={{ fontSize: 10, color: 'var(--accent)', textDecoration: 'none' }}>Input</a>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginRight: 6 }}>•</span>
          <a href="#" style={{ fontSize: 10, color: 'var(--accent)', textDecoration: 'none' }}>Textarea</a>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginRight: 6 }}>•</span>
          <a href="#" style={{ fontSize: 10, color: 'var(--accent)', textDecoration: 'none' }}>Select</a>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginRight: 6 }}>•</span>
          <a href="#" style={{ fontSize: 10, color: 'var(--accent)', textDecoration: 'none' }}>Toggle</a>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginRight: 6 }}>•</span>
          <a href="#" style={{ fontSize: 10, color: 'var(--accent)', textDecoration: 'none' }}>Badge</a>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginRight: 6 }}>•</span>
          <a href="#" style={{ fontSize: 10, color: 'var(--accent)', textDecoration: 'none' }}>Avatar</a>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginRight: 6 }}>•</span>
          <a href="#" style={{ fontSize: 10, color: 'var(--accent)', textDecoration: 'none' }}>Modal</a>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginRight: 6 }}>•</span>
          <a href="#" style={{ fontSize: 10, color: 'var(--accent)', textDecoration: 'none' }}>Checkbox</a>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginRight: 6 }}>•</span>
          <a href="#" style={{ fontSize: 10, color: 'var(--accent)', textDecoration: 'none' }}>Skeleton</a>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginRight: 6 }}>•</span>
          <a href="#" style={{ fontSize: 10, color: 'var(--accent)', textDecoration: 'none' }}>Sheet</a>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginRight: 6 }}>•</span>
          <a href="#" style={{ fontSize: 10, color: 'var(--accent)', textDecoration: 'none' }}>Tooltip</a>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginRight: 6 }}>•</span>
          <a href="#" style={{ fontSize: 10, color: 'var(--accent)', textDecoration: 'none' }}>Tabs</a>
        </div>
      </div>

      <div style={{ marginTop: 48, pt-8, border-t, border-color: 'var(--border)' }}>
        <h2 style={{ marginBottom: 16, fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em' }}>Component Details</h2>

        <details>
          <summary style={{ cursor: 'pointer', fontSize: 11, color: 'var(--accent)', fontWeight: 500 }}>Checkbox</summary>
          <p style={{ margin: '10px 0 0', fontSize: 12, lineHeight: 1.5, color: 'var(--text-primary)' }}>
            Radix UI Checkbox with deep teal accent state. Uses logical properties for RTL support.
          </p>
        </details>

        <details>
          <summary style={{ cursor: 'pointer', fontSize: 11, color: 'var(--accent)', fontWeight: 500 }}>Skeleton</summary>
          <p style={{ margin: '10px 0 0', fontSize: 12, lineHeight: 1.5, color: 'var(--text-primary)' }}>
            Shimmer loading states with animate-pulse. Gracefully degrades with prefers-reduced-motion.
          </p>
        </details>

        <details>
          <summary style={{ cursor: 'pointer', fontSize: 11, color: 'var(--accent)', fontWeight: 500 }}>Sheet</summary>
          <p style={{ margin: '10px 0 0', fontSize: 12, lineHeight: 1.5, color: 'var(--text-primary)' }}>
            Side-slide panel using Radix Dialog. Animates from bottom on open, slides out on close.
          </p>
        </details>

        <details>
          <summary style={{ cursor: 'pointer', fontSize: 11, color: 'var(--accent)', fontWeight: 500 }}>Tooltip</summary>
          <p style={{ margin: '10px 0 0', fontSize: 12, lineHeight: 1.5, color: 'var(--text-primary)' }}>
            Tooltip with accent bg and white text. Auto-placement with fallback to avoid clipping.
          </p>
        </details>

        <details>
          <summary style={{ cursor: 'pointer', fontSize: 11, color: 'var(--accent)', fontWeight: 500 }}>Dropdown</summary>
          <p style={{ margin: '10px 0 0', fontSize: 12, lineHeight: 1.5, color: 'var(--text-primary)' }}>
            Radix Dropdown Menu. Grouped items, separators, and keyboard-navigible shortcuts.
          </p>
        </details>

        <details>
          <summary style={{ cursor: 'pointer', fontSize: 11, color: 'var(--accent)', fontWeight: 500 }}>Tabs</summary>
          <p style={{ margin: '10px 0 0', fontSize: 12, lineHeight: 1.5, color: 'var(--text-primary)' }}>
            Radix Tabs with Panels. Keyboard-navigible (Arrow keys, Home/End), swipe-aware for touch.
          </p>
        </details>
      </div>
    </motion.div>
  );
}