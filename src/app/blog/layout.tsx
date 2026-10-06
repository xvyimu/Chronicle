// Blog index + tag/category list shells share BlogCard / BlogList styles.
// Article detail CSS is mounted under blog/[slug]/layout.tsx.
import '../styles/blog-ui.css';

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
