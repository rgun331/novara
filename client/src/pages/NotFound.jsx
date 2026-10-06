import { Link } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { BoxesIllustration } from '../components/brand/Illustrations';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/brand/Logo';

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-canvas px-5 py-6 sm:px-10">
      <header>
        <Link to="/" aria-label="Novara home">
          <Logo />
        </Link>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center text-center">
        <BoxesIllustration className="h-40 w-auto" />
        <h1 className="mt-6 font-display text-4xl font-semibold tracking-[-0.03em]">This shelf is empty.</h1>
        <p className="mt-2 max-w-sm text-ink-500">The page you are looking for has moved or never existed.</p>
        <Button as={Link} to="/" className="mt-7">
          <ArrowLeft weight="bold" className="size-4" /> Back to home
        </Button>
      </main>
    </div>
  );
}
