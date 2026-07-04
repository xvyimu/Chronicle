import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { LinkCategory, LinkItem } from '@/types';

interface CuratedLinksPreviewProps {
  categories: LinkCategory[];
}

function getLinkHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function PreviewLinkItem({ item }: { item: LinkItem }) {
  return (
    <li className="home-links-preview__item">
      <Separator className="home-links-preview__item-separator" />
      <a href={item.url} target="_blank" rel="noopener noreferrer">
        <span className="home-links-preview__link-top">
          <strong>{item.title}</strong>
          <small>{getLinkHost(item.url)}</small>
        </span>
        <span className="home-links-preview__item-desc">{item.description}</span>
      </a>
    </li>
  );
}

export default function CuratedLinksPreview({ categories }: CuratedLinksPreviewProps) {
  if (categories.length === 0) return null;

  return (
    <section className="section home-links-preview" aria-labelledby="home-links-title">
      <div className="section__inner">
        <div className="section__head">
          <div>
            <span className="section__eyebrow">Curated Links</span>
            <h2 id="home-links-title" className="section__title">
              个人收藏入口
            </h2>
            <p className="section__subtitle">
              长期会反复打开的 AI、工程文档、自托管和 VPS 资料，统一收在导航页。
            </p>
          </div>
          <div className="section__action">
            <Button asChild variant="link" className="section__link">
              <Link href="/links">打开导航</Link>
            </Button>
          </div>
        </div>

        <div className="home-links-preview__grid">
          {categories.map((category) => (
            <Card
              key={category.id}
              role="article"
              aria-labelledby={`home-links-${category.id}`}
              size="sm"
              className="home-links-preview__group"
            >
              <CardHeader className="home-links-preview__top">
                <CardTitle>
                  <h3 id={`home-links-${category.id}`}>{category.title}</h3>
                </CardTitle>
                <CardAction>
                  <Badge variant="secondary">{category.items.length} 个收藏</Badge>
                </CardAction>
              </CardHeader>
              <CardDescription className="home-links-preview__desc">
                {category.description}
              </CardDescription>
              <CardContent className="home-links-preview__content">
                <ul
                  className="home-links-preview__list"
                  aria-label={`${category.title}精选链接`}
                >
                  {category.items.slice(0, 3).map((item) => (
                    <PreviewLinkItem key={item.url} item={item} />
                  ))}
                </ul>
              </CardContent>
              {category.items.length > 3 ? (
                <CardFooter className="home-links-preview__footer">
                  <Button
                    asChild
                    variant="link"
                    size="sm"
                    className="home-links-preview__more"
                  >
                    <Link href={`/links#${category.id}`}>
                      查看剩余 {category.items.length - 3} 个
                    </Link>
                  </Button>
                </CardFooter>
              ) : null}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
