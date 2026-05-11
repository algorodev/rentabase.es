import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const sortedPosts = posts.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );

  let content = `# RentaBase - Contenido completo

> Blog sobre inversión, ahorro, criptomonedas y fiscalidad en España.
> Este archivo contiene el contenido completo de todos los artículos publicados.

`;

  for (const post of sortedPosts) {
    const date = post.data.pubDate.toISOString().split('T')[0];
    content += `---\n\n`;
    content += `## ${post.data.title}\n\n`;
    content += `- URL: https://www.rentabase.es/blog/${post.slug}/\n`;
    content += `- Fecha: ${date}\n`;
    content += `- Categoría: ${post.data.category}\n`;
    content += `- Tags: ${post.data.tags.join(', ')}\n`;
    content += `- Descripción: ${post.data.description}\n\n`;
    content += `${post.body}\n\n`;
  }

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
