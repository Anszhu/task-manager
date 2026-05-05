export const EmptyState = ({
  title,
  description
}: {
  title: string;
  description: string;
}) => (
  <div className="empty-state card">
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);
