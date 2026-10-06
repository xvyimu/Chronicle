import { Project } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import MetaBadge from '@/components/ui/MetaBadge';
import { imageBlurProps } from '@/lib/image-blur-data';

/**
 * 项目卡片 —— 静态卡片（Iteration 06：去掉 MagneticCard 的 3D 倾斜 / 光斑）。
 */
export default function ProjectCard({
  project,
  priority = false,
}: {
  project: Project;
  priority?: boolean;
}) {
  return (
    <article className="card card--project">
      <Link href={`/projects/${project.id}`} className="block">
        {project.image ? (
          <div className="card__media">
            <Image
              src={project.image}
              alt={project.title}
              fill
              className="card__image"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              loading={priority ? 'eager' : undefined}
              priority={priority}
              {...imageBlurProps(project.image)}
            />
          </div>
        ) : (
          <div className="card__media card__media--placeholder">
            <span className="card__initial">{project.title.charAt(0)}</span>
          </div>
        )}
        <div className="card__top">
          <h3 className="card__name">{project.title}</h3>
        </div>
        <p className="card__desc">{project.description}</p>
      </Link>
      <div className="card__foot">
        <div className="card__tags">
          {project.tags.map((tag) => (
            <MetaBadge key={tag} className="card__tag">
              {tag}
            </MetaBadge>
          ))}
        </div>
        <div className="card__links">
          {project.url && (
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card__link"
            >
              线上 →
            </a>
          )}
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="card__link"
            >
              源码 →
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
