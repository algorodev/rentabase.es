import { defineConfig } from 'astro/config';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

const SITE_URL = 'https://www.rentabase.es';

/**
 * Lee el frontmatter de cada entrada .mdx de una content collection para
 * construir un mapa URL canónica → lastmod (updatedDate || pubDate || mtime).
 */
function buildLastmodMap(collectionDir, urlPrefix) {
  const here = dirname(fileURLToPath(import.meta.url));
  const dir = join(here, 'src', 'content', collectionDir);
  const map = new Map();

  let files;
  try {
    files = readdirSync(dir);
  } catch {
    return map;
  }

  for (const file of files) {
    if (!file.endsWith('.mdx') && !file.endsWith('.md')) continue;
    const slug = file.replace(/\.mdx?$/, '');
    const fullPath = join(dir, file);
    const raw = readFileSync(fullPath, 'utf8');
    const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);

    let lastmod;
    if (fmMatch) {
      const fm = fmMatch[1];
      const updated = fm.match(/^updatedDate:\s*['"]?([^'"\n]+)['"]?/m);
      const published = fm.match(/^pubDate:\s*['"]?([^'"\n]+)['"]?/m);
      const draft = fm.match(/^draft:\s*true\s*$/m);
      if (draft) continue;
      const dateStr = updated?.[1] || published?.[1];
      if (dateStr) {
        const d = new Date(dateStr);
        if (!isNaN(d.valueOf())) lastmod = d.toISOString();
      }
    }
    if (!lastmod) lastmod = statSync(fullPath).mtime.toISOString();

    map.set(`${SITE_URL}${urlPrefix}/${slug}/`, lastmod);
  }

  return map;
}

const blogLastmod = buildLastmodMap('blog', '/blog');
const noticiasLastmod = buildLastmodMap('noticias', '/noticias');
const allLastmod = new Map([...blogLastmod, ...noticiasLastmod]);

/** lastmod más reciente entre todo el contenido (para home, índices, etc.) */
const latestLastmod = [...allLastmod.values()].sort().pop();

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'always',
  integrations: [
    mdx(),
    sitemap({
      serialize(item) {
        const lastmod = allLastmod.get(item.url) || latestLastmod;
        return {
          ...item,
          lastmod,
          changefreq: item.url.includes('/blog/') ? 'monthly' : 'weekly',
          priority: item.url === `${SITE_URL}/` ? 1.0 : 0.7,
        };
      },
    }),
    tailwind(),
    react(),
  ],
});
