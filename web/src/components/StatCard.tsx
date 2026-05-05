export const StatCard = ({
  label,
  value,
  tone = "default"
}: {
  label: string;
  value: number;
  tone?: "default" | "accent" | "alert";
}) => (
  <div className={`stat-card card ${tone}`}>
    <p>{label}</p>
    <strong>{value}</strong>
  </div>
);
