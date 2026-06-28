export default function LoadingSpinner({ text = 'Loading tasks...' }) {
  return (
    <div className="spinner-overlay">
      <div className="spinner" />
      <p className="spinner-text">{text}</p>
    </div>
  );
}
