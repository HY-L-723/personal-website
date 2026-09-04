import type { ReactNode } from 'react';

export function PageBanner({
  eyebrow,
  title,
  description,
  icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon?: ReactNode;
}) {
  return (
    <section className="page-banner glass-card">
      <div className="page-banner-icon" aria-hidden="true">
        {icon}
      </div>
      <div>
        <p>{eyebrow}</p>
        <h1>{title}</h1>
        <span>{description}</span>
      </div>
    </section>
  );
}
