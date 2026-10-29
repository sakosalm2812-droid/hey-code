import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/HEY/);
  });

  test('shows hero section', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('HEY');
    await expect(page.locator('text=Your AI Assistant Like Jarvis')).toBeVisible();
  });

  test('has navigation links', async ({ page }) => {
    await expect(page.locator('a[href="#features"]')).toBeVisible();
    await expect(page.locator('a[href="#pricing"]')).toBeVisible();
    await expect(page.locator('a[href="#testimonials"]')).toBeVisible();
  });

  test('has sign up and sign in buttons', async ({ page }) => {
    await expect(page.locator('a[href="/signup"]')).toBeVisible();
    await expect(page.locator('a[href="/signin"]')).toBeVisible();
  });

  test('shows features section', async ({ page }) => {
    await expect(page.locator('#features')).toBeVisible();
    await expect(page.locator('text=Multi-Model Chat')).toBeVisible();
    await expect(page.locator('text=Smart Context')).toBeVisible();
  });

  test('shows pricing section', async ({ page }) => {
    await expect(page.locator('#pricing')).toBeVisible();
    await expect(page.locator('text=Free')).toBeVisible();
    await expect(page.locator('text=Pro')).toBeVisible();
    await expect(page.locator('text=Team')).toBeVisible();
  });

  test('shows testimonials', async ({ page }) => {
    await expect(page.locator('#testimonials')).toBeVisible();
  });

  test('shows CTA section', async ({ page }) => {
    await expect(page.locator('text=Ready to supercharge your productivity')).toBeVisible();
  });

  test('footer has legal links', async ({ page }) => {
    await expect(page.locator('a[href="/privacy"]')).toBeVisible();
    await expect(page.locator('a[href="/terms"]')).toBeVisible();
    await expect(page.locator('a[href="/cookies"]')).toBeVisible();
  });
});

test.describe('Authentication', () => {
  test('sign in page loads', async ({ page }) => {
    await page.goto('/signin');
    await expect(page.locator('h2')).toContainText('Welcome back');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('sign up page loads', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('h2')).toContainText('Create your account');
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('forgot password page loads', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.locator('h2')).toContainText('Forgot Password');
  });
});

test.describe('Legal Pages', () => {
  test('privacy policy loads', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.locator('h1')).toContainText('Privacy Policy');
  });

  test('terms of service loads', async ({ page }) => {
    await page.goto('/terms');
    await expect(page.locator('h1')).toContainText('Terms of Service');
  });

  test('cookie policy loads', async ({ page }) => {
    await page.goto('/cookies');
    await expect(page.locator('h1')).toContainText('Cookie Policy');
  });

  test('contact page loads', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.locator('h1')).toContainText('Contact Us');
  });

  test('status page loads', async ({ page }) => {
    await page.goto('/status');
    await expect(page.locator('h1')).toContainText('System Status');
  });
});

test.describe('PWA', () => {
  test('manifest.json is accessible', async ({ page }) => {
    const response = await page.request.get('/manifest.json');
    expect(response.ok()).toBeTruthy();
    const manifest = await response.json();
    expect(manifest.name).toBe('HEY - Your AI Assistant');
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test('robots.txt is accessible', async ({ page }) => {
    const response = await page.request.get('/robots.txt');
    expect(response.ok()).toBeTruthy();
  });
});

test.describe('Responsive Design', () => {
  test('works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('works on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('works on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('About & Privacy Pages', () => {
  test('about page loads and shows the brand story', async ({ page }) => {
    await page.goto('/about');
    await expect(page).toHaveTitle(/About/);
    await expect(page.locator('h1')).toContainText('HEY');
    await expect(page.locator('text=No limits to the sky.')).toBeVisible();
    await expect(page.locator('a[href="/privacy"]').first()).toBeVisible();
    await expect(page.locator('a[href="/signup"]').first()).toBeVisible();
  });

  test('privacy policy is complete and well-formed', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page).toHaveTitle(/Privacy Policy/);
    await expect(page.locator('h1')).toContainText('Privacy Policy');
    await expect(page.locator('a[href="#contact"]')).toBeVisible();
    await expect(page.locator('text=privacy@hey.ai')).toBeVisible();
  });

  test('data processing agreement page loads', async ({ page }) => {
    await page.goto('/dpa');
    await expect(page).toHaveTitle(/Data Processing Agreement/);
    await expect(page.locator('h1')).toContainText('Data Processing Agreement');
    await expect(page.locator('text=Standard Contractual Clauses')).toBeVisible();
    await expect(page.locator('text=not legal advice')).toBeVisible();
    await expect(page.locator('a[href="/privacy"]').first()).toBeVisible();
  });

  test('signup enforces the minimum age', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('#age')).toHaveCount(1);
    await page.getByPlaceholder('John Doe').fill('Test User');
    await page.getByPlaceholder('you@example.com').fill('age-gate@example.com');
    await page.getByPlaceholder('••••••••').first().fill('password123');
    await page.getByPlaceholder('••••••••').nth(1).fill('password123');
    await page.locator('#terms').check();
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page.getByRole('alert')).toContainText('at least 13 years old');
  });

  test('internal links on public pages resolve (link snapshot)', async ({ page }) => {
    for (const path of ['/', '/about', '/privacy', '/dpa']) {
      await page.goto(path);
      const hrefs = await page
        .locator('a[href^="/"]')
        .evaluateAll((links) =>
          links
            .map((a) => a.getAttribute('href'))
            .filter((h): h is string => !!h && !h.startsWith('/api/') && !h.includes('#'))
        );
      const unique = Array.from(new Set(hrefs));
      for (const href of unique) {
        const res = await page.request.get(href, { maxRedirects: 0 });
        expect(res.status(), `${path} -> ${href}`).toBeLessThan(400);
      }
    }
  });
});
