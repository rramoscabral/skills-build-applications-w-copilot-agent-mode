import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Workout = {
  title?: string;
  reason?: string;
};

export default function Workouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadWorkouts() {
      setLoading(true);
      setError(null);

      try {
        const data = await getJson<{ suggestions?: Workout[] }>(`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`);
        if (active) {
          setWorkouts(data.suggestions ?? []);
        }
      } catch {
        if (active) {
          setError('Unable to load workout suggestions');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadWorkouts();

    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      loading={loading}
      error={error}
      empty={workouts.length === 0}
      emptyMessage="No workout suggestions"
    >
      <ul className="list-group">
        {workouts.map((workout, index) => (
          <li key={`${workout.title ?? 'workout'}-${index}`} className="list-group-item">
            <div className="fw-semibold">{workout.title ?? 'Workout'}</div>
            <small>{workout.reason ?? 'Suggested for your activity pattern.'}</small>
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
