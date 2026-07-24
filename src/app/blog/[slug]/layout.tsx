// Article reading surface: layout panels + MDX prose (not needed on /blog index).
// TagLink styles live in blog-ui.css, already mounted by parent blog/layout.tsx.
import '../../styles/article-ui.css';
import '../../styles/prose.css';

export default function BlogArticleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
