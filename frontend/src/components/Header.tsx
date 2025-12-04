import { useTheme, type Theme } from '../hooks/useThemes';

interface HeaderProps {
  walletConnected: boolean;
  notesCount: number;
}

export default function Header({ walletConnected, notesCount }: HeaderProps) {
  const { theme, setTheme, themes } = useTheme();

  const themeLabels: Record<Theme, string> = {
    'purple-elegance': 'Purple Elegance',
    'ocean-blue': 'Ocean Blue',
    'forest-green': 'Forest Green',
    'sunset-amber': 'Sunset Amber',
    'midnight-black': 'Midnight Black',
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="header-title">
            <span className="logo-icon">📝</span>
            Solana Notes
          </h1>
          {walletConnected && <span className="notes-badge">{notesCount}</span>}
        </div>

        <div className="theme-selector">
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as Theme)}
            className="theme-dropdown"
            aria-label="Select theme"
          >
            {themes.map((t) => (
              <option key={t} value={t}>
                {themeLabels[t]}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
