import { blogPostingSchema, breadcrumbSchema, toJsonLd } from '@/lib/jsonld';
import { SITE_CONFIG } from '@/lib/site';
import type { PostFull } from '@/types';

export default function ArticleJsonLd({
  post,
  nonce,
}: {
  post: PostFull;
  nonce?: string;
}) {
  const articleLd = toJsonLd(blogPostingSchema(post));
  const breadcrumbLd = toJsonLd(
    breadcrumbSchema([
      { name: '首页', url: SITE_CONFIG.url },
      { name: '博客', url: `${SITE_CONFIG.url}/blog` },
      { name: post.title, url: `${SITE_CONFIG.url}/blog/${post.slug}` },
    ]),
  );

  return (
    <>
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: articleLd }}
      />
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbLd }}
      />
    </>
  );
}
