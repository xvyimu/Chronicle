import Link from 'next/link';

const manifestoItems = [
  {
    number: '01',
    label: 'Why',
    title: '少一点噪音，多一点可复用经验',
    description:
      '这里记录真实踩过的坑、复盘过的部署路径和反复会用到的工具入口。内容不追热点，更像一套可以再次打开的个人工程手册。',
    href: '/about',
    action: '看站点说明',
  },
  {
    number: '02',
    label: 'How',
    title: '文章、专题、项目和收藏互相连接',
    description:
      '一篇文章解决一个问题，一个专题串起一条路径，一个项目验证一组做法，导航收藏则保留那些值得长期回访的外部资料。',
    href: '/categories',
    action: '浏览分类',
  },
  {
    number: '03',
    label: 'What',
    title: '配置清单、性能实践和工具入口',
    description:
      '从 VPS 初始化、CI/CD、反向代理，到 Web 性能、数据库和自托管工具，优先沉淀能直接落地的步骤和判断依据。',
    href: '/blog',
    action: '进入文章',
  },
];

export default function ManifestoSection() {
  return (
    <section className="home-manifesto" aria-labelledby="home-manifesto-title">
      <div className="home-manifesto__inner">
        <div className="home-manifesto__intro">
          <span className="section__eyebrow">Manifesto</span>
          <h2 id="home-manifesto-title" className="home-manifesto__title">
            把零散经验整理成下一次能直接复用的入口。
          </h2>
        </div>

        <div className="home-manifesto__list">
          {manifestoItems.map((item) => (
            <article key={item.number} className="home-manifesto__item">
              <div className="home-manifesto__number">{item.number}</div>
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
