import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const noticias = await getCollection('noticias', ({ data }) => !data.draft);

  const sorted = noticias.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );

  return rss({
    title: 'RentaBase · Noticias',
    description:
      'Resumen semanal de las noticias financieras más importantes en España',
    site: context.site!,
    items: sorted.map((noticia) => ({
      title: noticia.data.title,
      description: noticia.data.description,
      pubDate: noticia.data.pubDate,
      link: `/noticias/${noticia.slug}/`,
      categories: noticia.data.tags,
    })),
    customData: '<language>es-ES</language>',
  });
}
