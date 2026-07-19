export default function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-paper border-2 border-ink rounded-2xl shadow-doodle-sm p-5 ${className}`}>
      {children}
    </div>
  );
}
