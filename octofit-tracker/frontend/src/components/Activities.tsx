import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = {
  type?: string;
  minutes?: number;
  points?: number;
};

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadActivities() {
      setLoading(true);
      setError(null);

      try {
        const data = await getJson<{ activities?: Activity[] }>('/api/activities');
        if (active) {
          setActivities(data.activities ?? []);
        }
      } catch {
        if (active) {
          setError('Unable to load activities');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadActivities();

    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard
      title="Activities"
      description="Track student activity minutes and points."
      loading={loading}
      error={error}
      empty={activities.length === 0}
      emptyMessage="No activities"
    >
      <ul className="list-group">
        {activities.map((activity, index) => (
          <li key={`${activity.type ?? 'activity'}-${index}`} className="list-group-item">
            <div className="d-flex justify-content-between">
              <span>{activity.type ?? 'Activity'}</span>
              <span>{activity.points ?? activity.minutes ?? 0} pts</span>
            </div>
            <small>{activity.minutes ?? 0} minutes</small>
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
