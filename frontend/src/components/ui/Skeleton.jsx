export default function Skeleton({ variant = 'text', width, height, className = '' }) {
  return (
    <span
      className={`skeleton skeleton--${variant} ${className}`.trim()}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

// Card fantasma para grades de alimentos enquanto carregam.
export function SkeletonCard() {
  return (
    <div className="card card--flush" aria-hidden="true">
      <Skeleton variant="image" />
      <div className="card__body">
        <Skeleton variant="title" />
        <Skeleton width="40%" />
        <Skeleton width="70%" />
        <Skeleton variant="button" />
      </div>
    </div>
  );
}
