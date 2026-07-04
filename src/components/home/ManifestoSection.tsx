import Link from 'next/link';

const indexItems = [
  {
    label: 'Articles',
    title: '文章',
    description: '围绕部署、性能、数据库和前端工程，把问题拆成可复用的实践笔记。',
    href: '/blog',
    action: '浏览文章',
  },
  {
    label: 'Links',
    title: '收藏',
    description: '长期回访的官网、文档、工具和 VPS 资源，保留原始链接，方便再次查证。',
    href: '/links',
    action: '打开导航',
  },
  {
    label: 'Projects',
    title: '项目',
    description: '把文章中的判断放进真实项目里验证，留下可以继续迭代的样本。',
    href: '/projects',
    action: '查看作品',
  },
];

export default function ManifestoSection() {
  return (
    <section className="home-manifesto" aria-labelledby="home-index-title">
      <div className="home-manifesto__inner">
        <div className="home-manifesto__intro">
          <p className="home-manifesto__label">Index</p>
          <h2 id="home-index-title" className="home-manifesto__title">
            从这里进入
          </h2>
          <p className="home-manifesto__lead">
            首页不做热闹的入口堆叠，只保留三条最常用的路径。
          </p>
        </div>

        <div className="home-manifesto__list">
          {indexItems.map((item) => (
            <article key={item.href} className="home-manifesto__item">
              <div>
                <p className="home-manifesto__label">{item.label}</p>
                <h3 className="home-manifesto__item-title">{item.title}</h3>
              </div>
              <p className="home-manifesto__desc">{item.description}</p>
              <Link href={item.href} className="home-manifesto__link">
                {item.action}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
