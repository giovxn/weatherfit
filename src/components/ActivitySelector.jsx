import { BriefcaseBusiness, Trees, User, WandSparkles } from 'lucide-react';

const ACTIVITIES = [
  { id: 'casual', label: 'Casual', icon: User },
  { id: 'work', label: 'Work / Office', icon: BriefcaseBusiness },
  { id: 'formal', label: 'Formal Event', icon: WandSparkles },
  { id: 'outdoor', label: 'Outdoor Activity', icon: Trees }
];

export default function ActivitySelector({ activity, setActivity }) {
  return (
    <div className="activity-row">
      <span className="activity-label">Activity Context</span>
      <div className="activity-pills" role="tablist" aria-label="Select activity">
        {ACTIVITIES.map((a) => {
          const Icon = a.icon;
          const isActive = activity === a.id;
          return (
            <button
              key={a.id}
              type="button"
              className={`apill ${isActive ? 'active' : ''}`}
              onClick={() => setActivity(a.id)}
              aria-pressed={isActive}
            >
              <Icon size={14} />
              {a.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}