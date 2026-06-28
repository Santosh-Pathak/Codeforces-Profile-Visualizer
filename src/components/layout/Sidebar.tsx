import { NAV_SECTIONS } from './navSections';
import { useActiveSection } from '../../hooks/useActiveSection';
import { rankColor } from '../../constants/rankColors';
import Badge from '../ui/Badge';
import type { CFUserInfo } from '../../types';

interface SidebarProps {
  profile: CFUserInfo | null;
}

export default function Sidebar({ profile }: SidebarProps) {
  const active = useActiveSection();

  return (
    <aside className="sidebar sticky top-0 hidden h-screen w-60 shrink-0 flex-col overflow-y-auto border-r border-white/10 bg-gray-950/80 px-4 py-6 backdrop-blur-md lg:flex">
      {profile && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
          <img
            src={profile.titlePhoto}
            alt={profile.handle}
            className="h-10 w-10 rounded-full object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{profile.handle}</p>
            {profile.rank && (
              <Badge color={rankColor(profile.rank)} size="sm" label={profile.rank} />
            )}
          </div>
        </div>
      )}

      <nav className="flex flex-col gap-1">
        {NAV_SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={`rounded-lg px-3 py-2 text-sm transition-colors ${
              active === s.id
                ? 'bg-blue-500/20 font-medium text-blue-300'
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            {s.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
