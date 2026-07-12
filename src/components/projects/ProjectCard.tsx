import { Project } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import MagneticCard from '@/components/ui/MagneticCard';
import MetaBadge from '@/components/ui/MetaBadge';
import { imageBlurProps } from '@/lib/image-blur-data';

export default function ProjectCard({
  project,
  priority = false,
}: {
  project: Project;
  priority?: boolean;
}) {
  return (
    <MagneticCard as="article" className="card card--project group" strength={3}>
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
        <div className="flex items-center gap-3 text-xs text-[var(--text-dim)]">
          {project.url && (
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--brand)] transition-colors"
            >
              线上 →
            </a>
          )}
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--brand)] transition-colors"
            >
              源码 →
            </a>
          )}
        </div>
      </div>
    </MagneticCard>
  );
}
