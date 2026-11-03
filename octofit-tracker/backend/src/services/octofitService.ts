import { isValidObjectId } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Activity payload is required'), { status: 400 });
  }

  const body = input as {
    userId?: string;
    teamId?: string;
    type?: string;
    minutes?: number;
  };

  if (!body.userId || !body.teamId || !body.type || body.minutes === undefined) {
    throw Object.assign(new Error('userId, teamId, type, and minutes are required'), { status: 400 });
  }

  if (!isValidObjectId(body.userId) || !isValidObjectId(body.teamId)) {
    throw Object.assign(new Error('userId and teamId must be valid ObjectIds'), { status: 400 });
  }

  const user = await User.findById(body.userId);
  const team = await Team.findById(body.teamId);

  if (!user || !team) {
    throw Object.assign(new Error('userId and teamId must reference existing records'), { status: 400 });
  }

  if (typeof body.minutes !== 'number' || Number.isNaN(body.minutes) || body.minutes <= 0) {
    throw Object.assign(new Error('minutes must be a positive number'), { status: 400 });
  }

  const activity = await Activity.create({
    user: user._id,
    team: team._id,
    type: body.type,
    minutes: body.minutes,
    points: body.minutes,
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Team payload is required'), { status: 400 });
  }

  const body = input as {
    name?: string;
    mascot?: string;
    members?: unknown[];
  };

  if (!body.name || !body.mascot) {
    throw Object.assign(new Error('name and mascot are required'), { status: 400 });
  }

  const members = Array.isArray(body.members) ? body.members : [];
  const memberIds = members.map((member) => String(member));

  for (const memberId of memberIds) {
    if (!isValidObjectId(memberId)) {
      throw Object.assign(new Error('members must contain valid ObjectIds'), { status: 400 });
    }
  }

  if (memberIds.length > 0) {
    const existingUsers = await User.countDocuments({ _id: { $in: memberIds } });
    if (existingUsers !== memberIds.length) {
      throw Object.assign(new Error('members must reference existing users'), { status: 400 });
    }
  }

  const team = await Team.create({
    name: body.name,
    mascot: body.mascot,
    members: memberIds,
  });

  return team.toObject();
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
  ]);

  if (totals.length === 0) {
    return [];
  }

  const teamIds = totals.map((entry) => entry._id);
  const teamsById = new Map((await Team.find({ _id: { $in: teamIds } }).lean()).map((team) => [team._id.toString(), team]));

  return totals
    .map((entry) => {
      const team = teamsById.get(entry._id.toString());
      if (!team) {
        return null;
      }
      return {
        teamName: team.name,
        totalPoints: Number(entry.totalPoints),
      };
    })
    .filter((entry): entry is { teamName: string; totalPoints: number } => entry !== null)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const normalizedEmail = userEmail.trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();

  const activityFocuses = new Set<string>();
  if (user.fitnessGoal) {
    activityFocuses.add(String(user.fitnessGoal));
  }

  for (const activity of recentActivities) {
    const type = String(activity.type ?? '').toLowerCase();
    if (type.includes('run') || type.includes('cycle') || type.includes('walk') || type.includes('jog')) {
      activityFocuses.add('endurance');
    }
    if (type.includes('strength') || type.includes('lift') || type.includes('power')) {
      activityFocuses.add('strength');
    }
  }

  const preferredFocus = Array.from(activityFocuses)[0] ?? 'endurance';
  const workouts = await Workout.find({ focus: preferredFocus }).sort({ minutes: -1, title: 1 }).lean();

  if (workouts.length === 0) {
    return [];
  }

  const newestActivity = recentActivities[0];
  const activitySummary = newestActivity?.type ? String(newestActivity.type) : preferredFocus;
  const reason = `Based on your ${preferredFocus} focus and recent ${activitySummary} activity.`;

  return workouts.map((workout) => ({
    ...workout,
    reason,
  }));
}

export { User };
