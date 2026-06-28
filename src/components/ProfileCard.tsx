import { memo } from 'react';
import { motion } from 'framer-motion';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import GlassCard from './ui/GlassCard';
import Badge from './ui/Badge';
import Button from './ui/Button';
import { rankColor } from '../constants/rankColors';
import { formatFullDate, lastOnlineLabel, countryFlag } from '../utils/formatters';
import { fadeSlideUp } from '../utils/motionVariants';
import type { CFUserInfo } from '../types';

interface ProfileCardProps {
  profile: CFUserInfo;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-white/40">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

function ProfileCard({ profile }: ProfileCardProps) {
  const flag = countryFlag(profile.country);
  const location = [profile.city, profile.country].filter(Boolean).join(', ');

  return (
    <motion.div variants={fadeSlideUp} initial="hidden" animate="visible">
      <GlassCard className="p-6">
        <div className="flex flex-col gap-6 sm:flex-row">
          <img
            src={profile.titlePhoto}
            alt={profile.handle}
            className="h-24 w-24 rounded-2xl object-cover ring-2 ring-white/10"
          />
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold">{profile.handle}</h1>
              {profile.rank && (
                <Badge color={rankColor(profile.rank)} label={profile.rank} />
              )}
            </div>

            <div className="flex flex-wrap gap-x-8 gap-y-3">
              <Stat label="Rating" value={profile.rating ?? '—'} />
              <Stat label="Max Rating" value={profile.maxRating ?? '—'} />
              <Stat label="Contribution" value={profile.contribution} />
              <Stat label="Friends" value={profile.friendOfCount} />
            </div>

            <div className="space-y-1 text-sm text-white/60">
              {location && (
                <p>
                  {flag && <span className="mr-1">{flag}</span>}
                  {location}
                </p>
              )}
              {profile.organization && <p>{profile.organization}</p>}
              <p>Registered {formatFullDate(profile.registrationTimeSeconds)}</p>
              <p>Last online {lastOnlineLabel(profile.lastOnlineTimeSeconds)}</p>
            </div>

            <a
              href={`https://codeforces.com/profile/${profile.handle}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" className="mt-2">
                View on Codeforces
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

export default memo(ProfileCard);
