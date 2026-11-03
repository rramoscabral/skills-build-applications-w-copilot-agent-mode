import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = {
  name?: string;
  members?: unknown[];
};

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadTeams() {
      setLoading(true);
      setError(null);

      try {
        const data = await getJson<{ teams?: Team[] }>('/api/teams');
        if (active) {
          setTeams(data.teams ?? []);
        }
      } catch {
        if (active) {
          setError('Unable to load teams');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadTeams();

    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      loading={loading}
      error={error}
      empty={teams.length === 0}
      emptyMessage="No teams"
    >
      <ul className="list-group">
        {teams.map((team, index) => (
          <li key={`${team.name ?? 'team'}-${index}`} className="list-group-item">
            <div className="d-flex justify-content-between">
              <span>{team.name ?? 'Team'}</span>
              <span>{team.members?.length ?? 0} members</span>
            </div>
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
