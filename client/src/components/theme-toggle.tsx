import { memo } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle = memo(function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={[
        'inline-flex items-center justify-center rounded-full border border-border backdrop-blur-sm shadow-sm',
        'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
        'w-10 h-10 bg-white/70 dark:bg-neutral-800/70 hover:bg-white dark:hover:bg-neutral-700',
        className,
      ].join(' ')}
    >
      <Sun
        size={18}
        className={`text-amber-500 transition-opacity ${isDark ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}
      />
      <Moon
        size={18}
        className={`absolute text-indigo-300 transition-opacity ${isDark ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
      />
      <span className="sr-only">{isDark ? 'Light mode' : 'Dark mode'}</span>
    </button>
  );
});

export default ThemeToggle;
