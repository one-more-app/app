import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitepress';

const docsRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const cursorRulesDir = path.join(docsRoot, 'cursor-rules');

function cursorRuleSidebarItems(): { text: string; link: string }[] {
  if (!fs.existsSync(cursorRulesDir)) return [];
  return fs
    .readdirSync(cursorRulesDir)
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .sort((a, b) => a.localeCompare(b))
    .map((f) => ({
      text: f.replace(/\.md$/, '').replace(/-/g, ' '),
      link: `/cursor-rules/${f.replace(/\.md$/, '')}`,
    }));
}

const specLinks = [
  '2026-10-06-outbound-marketing-design',
  '2026-10-01-user-preview-page-design',
  '2026-10-01-referral-reward-pro-month-design',
  '2026-10-01-profile-badges-design',
  '2026-10-01-monthly-xp-ranking-design',
  '2026-10-01-friends-exercise-leaderboard-design',
  '2026-10-01-force-update-version-gate-design',
  '2026-10-01-browse-count-sort-design',
  '2026-09-26-transactional-email-layout-design',
  '2026-09-26-account-soft-delete-design',
  '2026-09-10-onboarding-record-catalog-drawer-design',
  '2026-09-10-onboarding-notifications-cascade-design',
  '2026-09-10-onboarding-body-pickers-design',
  '2026-09-04-onboarding-questions-reorder-design',
  '2026-09-04-onboarding-intro-features-design',
].map((slug) => ({
  text: slug.replace(/-design$/, '').replace(/^(\d{4}-\d{2}-\d{2})-/, '$1 · '),
  link: `/superpowers/specs/${slug}`,
}));

const planLinks = [
  '2026-10-01-user-preview-page',
  '2026-10-01-referral-reward-pro-month',
  '2026-10-01-monthly-xp-ranking',
  '2026-10-01-force-update-version-gate',
  '2026-10-01-browse-count-sort',
  '2026-09-26-transactional-email-layout',
  '2026-09-26-account-soft-delete',
  '2026-09-10-onboarding-record-catalog-drawer',
  '2026-09-10-onboarding-body-pickers',
  '2026-09-04-onboarding-questions-reorder',
  '2026-09-04-onboarding-intro-features',
].map((slug) => ({
  text: slug.replace(/^(\d{4}-\d{2}-\d{2})-/, '$1 · '),
  link: `/superpowers/plans/${slug}`,
}));

export default defineConfig({
  title: 'One More Docs',
  description: 'Documentation interne — One More',
  lang: 'fr-FR',
  cleanUrls: true,
  lastUpdated: true,
  // Liens vers le repo (../client, …) et localhost — pas vérifiés au build.
  ignoreDeadLinks: true,
  srcExclude: ['**/.vitepress/**', '**/.DS_Store'],

  transformPageData(pageData) {
    const rel = pageData.relativePath;
    if (!rel) return;
    const filePath = path.join(docsRoot, rel);
    try {
      pageData.markdownRaw = fs.readFileSync(filePath, 'utf-8');
    } catch {
      // pages sans fichier source (404, etc.)
    }
  },

  themeConfig: {
    search: { provider: 'local' },
    nav: [
      { text: 'Accueil', link: '/' },
      { text: 'Outbound n8n', link: '/outbound-n8n-reference' },
      { text: 'Quality gates', link: '/quality-gates' },
    ],
    sidebar: [
      {
        text: 'Guides',
        items: [
          { text: 'Outbound & n8n', link: '/outbound-n8n-reference' },
          { text: 'AWS SES (emails)', link: '/outbound-ses-setup' },
          { text: 'WebSocket', link: '/WEBSOCKET' },
          { text: 'Push notifications', link: '/push-notifications-setup' },
          { text: 'Quality gates', link: '/quality-gates' },
          { text: 'AppsFlyer', link: '/appsflyer-setup' },
          { text: 'Mapping ligues', link: '/ANALYSE_MAPPING_LIGUES' },
        ],
      },
      {
        text: 'Notion',
        items: [
          { text: 'Rewards CRM', link: '/notion-rewards-crm' },
          { text: 'Review feedback', link: '/notion-review-feedback-db' },
        ],
      },
      {
        text: 'Cursor rules',
        collapsed: true,
        items: [
          { text: 'À propos (sync)', link: '/cursor-rules/' },
          ...cursorRuleSidebarItems(),
        ],
      },
      { text: 'Specs (design)', collapsed: true, items: specLinks },
      { text: 'Plans (impl)', collapsed: true, items: planLinks },
    ],
    socialLinks: [],
  },

  vite: {
    server: {
      // 5199 par défaut ; si occupé, Vite prend le port suivant (strictPort: false).
      port: 5199,
      strictPort: false,
    },
    preview: {
      port: 5199,
      strictPort: false,
    },
  },
});
