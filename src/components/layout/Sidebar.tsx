import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { NAV_SECTIONS } from './navSections';
import { useActiveSection } from '../../hooks/useActiveSection';
import { useSidebarCollapsed } from '../../hooks/useSidebarCollapsed';
import { rankColor } from '../../constants/rankColors';
import Badge from '../ui/Badge';
import Tooltip from '../ui/Tooltip';
import type { CFUserInfo } from '../../types';

interface SidebarProps {
  profile: CFUserInfo | null;
}

export default function Sidebar({ profile }: SidebarProps) {
  const active = useActiveSection();
  const { collapsed, toggle } = useSidebarCollapsed();

  return (
    <aside
      className={`sidebar relative sticky top-0 hidden h-screen shrink-0 overflow-visible lg:block ${
        collapsed
          ? 'w-[4.5rem] min-w-[4.5rem] max-w-[4.5rem]'
          : 'w-60 min-w-60 max-w-60'
      }`}
    >
      <div className="sidebar-panel flex h-full flex-col overflow-hidden border-r border-white/10 bg-gray-950/80 backdrop-blur-md">
        <div className="sidebar-scroll flex h-full flex-col overflow-x-hidden overflow-y-auto px-3 py-4">
          {collapsed ? (
            profile ? (
              <Tooltip content={profile.handle} placement="right" className="mb-4 shrink-0">
                <a href="#profile" className="mx-auto block w-fit">
                  <img
                    src={profile.titlePhoto}
                    alt={profile.handle}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-white/10"
                  />
                </a>
              </Tooltip>
            ) : (
              <div className="mb-4 h-10 shrink-0" />
            )
          ) : (
            profile && (
              <div className="mb-6 flex shrink-0 items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <img
                  src={profile.titlePhoto}
                  alt={profile.handle}
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{profile.handle}</p>
                  {profile.rank && (
                    <Badge
                      color={rankColor(profile.rank)}
                      size="sm"
                      label={profile.rank}
                    />
                  )}
                </div>
              </div>
            )
          )}

          <nav className="flex flex-col gap-1 pb-2">
            {NAV_SECTIONS.map((s) => {
              const isActive = active === s.id;
              const Icon = s.icon;
              const linkClass = `flex items-center rounded-lg text-sm transition-colors ${
                collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2'
              } ${
                isActive
                  ? 'bg-blue-500/20 font-medium text-blue-300'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`;

              const link = (
                <a href={`#${s.id}`} className={linkClass} aria-label={s.label}>
                  <Icon className="h-5 w-5 shrink-0" aria-hidden />
                  {!collapsed && <span>{s.label}</span>}
                </a>
              );

              if (!collapsed) {
                return <div key={s.id}>{link}</div>;
              }

              return (
                <Tooltip key={s.id} content={s.label} placement="right" className="w-full">
                  {link}
                </Tooltip>
              );
            })}
          </nav>
        </div>
      </div>

      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="sidebar-toggle"
      >
        {collapsed ? (
          <ChevronRightIcon className="h-4 w-4" aria-hidden />
        ) : (
          <ChevronLeftIcon className="h-4 w-4" aria-hidden />
        )}
      </button>
    </aside>
  );
}
