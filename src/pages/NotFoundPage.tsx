import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import ThemeToggle from '../components/ui/ThemeToggle';

export default function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white">
      <ThemeToggle className="absolute right-4 top-4 z-20" />
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-white/60">Page not found</p>
      <Link to="/" className="mt-6">
        <Button variant="primary">Back to Home</Button>
      </Link>
    </div>
  );
}
