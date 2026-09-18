export type Habit = {
  id: string;
  name: string;
  ritualName?: string;
  routine: "Morning" | "Night";
  done: boolean;
  category: string;
  frequency: string;
  time: string;
  scheduledDate?: string;
};
export const seedHabits: Habit[] = [
  {
    id: "water",
    name: "Drink water",
    ritualName: "Morning",
    routine: "Morning",
    done: true,
    category: "Body",
    frequency: "Every day",
    time: "Any time",
  },
  {
    id: "skincare",
    name: "Skincare",
    ritualName: "Morning",
    routine: "Morning",
    done: true,
    category: "Self Care",
    frequency: "Every day",
    time: "Any time",
  },
  {
    id: "exercise",
    name: "Take a walk",
    ritualName: "Morning",
    routine: "Morning",
    done: true,
    category: "Body",
    frequency: "Every day",
    time: "Any time",
  },
  {
    id: "meditate",
    name: "Meditate",
    ritualName: "Morning",
    routine: "Morning",
    done: false,
    category: "Mind",
    frequency: "Every day",
    time: "Any time",
  },
  {
    id: "journal",
    name: "Journal",
    ritualName: "Night",
    routine: "Night",
    done: false,
    category: "Mind",
    frequency: "Every day",
    time: "Any time",
  },
  {
    id: "read",
    name: "Read 20 minutes",
    ritualName: "Night",
    routine: "Night",
    done: true,
    category: "Mind",
    frequency: "Every day",
    time: "Any time",
  },
  {
    id: "stretch",
    name: "Stretch",
    ritualName: "Night",
    routine: "Night",
    done: false,
    category: "Body",
    frequency: "Every day",
    time: "Any time",
  },
  {
    id: "sleep",
    name: "Sleep before 11 PM",
    ritualName: "Night",
    routine: "Night",
    done: true,
    category: "Rest",
    frequency: "Every day",
    time: "Before 11 PM",
  },
];
export const dailyIds = [
  "water",
  "skincare",
  "exercise",
  "read",
  "stretch",
  "journal",
];
export function toggleHabit(habits: Habit[], id: string) {
  return habits.map((h) => (h.id === id ? { ...h, done: !h.done } : h));
}
export function completion(habits: Habit[], edited: boolean) {
  return edited
    ? Math.round(
        (habits.filter((h) => h.done).length / Math.max(1, habits.length)) *
          100,
      )
    : 73;
}
export function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
export type ActivityHistory = Record<string, Habit[]>;

export function habitsForDay(
  dateKey: string,
  todayKey: string,
  habits: Habit[],
  history: ActivityHistory,
) {
  return dateKey === todayKey
    ? habits.filter((habit) => isScheduledForDate(habit, dateKey))
    : (history[dateKey] ?? []);
}

export function isScheduledForDate(habit: Habit, date: string) {
  if (habit.scheduledDate) return habit.scheduledDate === date;
  const [year, month, day] = date.split("-").map(Number);
  const weekday = new Date(year, month - 1, day).getDay();
  if (habit.frequency === "Weekdays") return weekday >= 1 && weekday <= 5;
  if (habit.frequency === "Weekends") return weekday === 0 || weekday === 6;
  return true;
}
export function ritualGroupsForDate(habits: Habit[], date: string) {
  const groups = new Map<string, Habit[]>();
  for (const habit of habits) {
    const name = habit.ritualName?.trim();
    if (!name || !isScheduledForDate(habit, date)) continue;
    const activities = groups.get(name) ?? [];
    activities.push(habit);
    groups.set(name, activities);
  }
  return Array.from(groups, ([name, activities]) => ({ name, activities }));
}
export function isHabit(value: unknown): value is Habit {
  if (!value || typeof value !== "object") return false;
  const h = value as Habit;
  return (
    typeof h.id === "string" &&
    typeof h.name === "string" &&
    (typeof h.ritualName === "undefined" || typeof h.ritualName === "string") &&
    typeof h.done === "boolean" &&
    ["Morning", "Night"].includes(h.routine) &&
    typeof h.category === "string" &&
    typeof h.frequency === "string" &&
    typeof h.time === "string" &&
    (typeof h.scheduledDate === "undefined" ||
      typeof h.scheduledDate === "string")
  );
}

export type CategoryConsistency = {
  category: string;
  value: number;
  done: number;
  total: number;
};
export function categoryConsistency(
  habits: Habit[],
  history: ActivityHistory,
  todayKey: string,
  days: number,
): CategoryConsistency[] {
  const order = new Map<string, number>();
  habits.forEach((habit, index) => {
    const category = habit.category?.trim();
    if (category && !order.has(category)) order.set(category, index);
  });
  const tally = new Map<string, { done: number; total: number }>();
  const count = (entries: Habit[]) => {
    for (const habit of entries) {
      const category = habit.category?.trim();
      if (!category) continue;
      if (!order.has(category)) order.set(category, habits.length + order.size);
      const stat = tally.get(category) ?? { done: 0, total: 0 };
      stat.total += 1;
      if (habit.done) stat.done += 1;
      tally.set(category, stat);
    }
  };
  if (!todayKey) {
    count(habits);
  } else {
    const end = new Date(`${todayKey}T00:00:00`);
    for (let back = days - 1; back >= 0; back -= 1) {
      const date = new Date(end);
      date.setDate(date.getDate() - back);
      const key = localDateKey(date);
      const entries =
        key === todayKey
          ? habits.filter((habit) => isScheduledForDate(habit, key))
          : history[key];
      if (entries?.length) count(entries);
    }
  }
  return Array.from(tally, ([category, stat]) => ({
    category,
    value: Math.round((stat.done / stat.total) * 100),
    done: stat.done,
    total: stat.total,
  })).sort(
    (a, b) =>
      b.value - a.value ||
      b.total - a.total ||
      (order.get(a.category) ?? 0) - (order.get(b.category) ?? 0),
  );
}
