import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = {
  teamName?: string;
  totalPoints?: number;
  rank?: number;
};

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadLeaderboard() {
      setLoading(true);
      setError(null);

      try {
        const data = await getJson<{ leaderboard?: LeaderboardEntry[] }>('/api/leaderboard');
        if (active) {
          setEntries(data.leaderboard ?? []);
        }
      } catch {
        if (active) {
          setError('Unable to load leaderboard');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadLeaderboard();

    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      loading={loading}
      error={error}
      empty={entries.length === 0}
      emptyMessage="No leaderboard"
    >
      <ol className="list-group list-group-numbered">
        {entries.map((entry, index) => (
          <li key={`${entry.teamName ?? 'entry'}-${index}`} className="list-group-item d-flex justify-content-between align-items-center">
            <span>{entry.teamName ?? 'Team'} </span>
            <span>{entry.totalPoints ?? 0}</span>
          </li>
        ))}
      </ol>
    </CapabilityCard>
  );
}
