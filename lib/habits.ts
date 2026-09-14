export type Habit = {
  id: string;
  name: string;
  ritualName?: string;
  routine: "Morning" | "Night";
  done: boolean;
  category: string;
  frequency: string;
  time: string;
};
export const seedHabits: Habit[] = [
  {
    id: "water",
    name: "Drink water",
    routine: "Morning",
    done: true,
    category: "Body",
    frequency: "Every day",
    time: "Any time",
  },
  {
    id: "skincare",
    name: "Skincare",
    routine: "Morning",
    done: true,
    category: "Self Care",
    frequency: "Every day",
    time: "Any time",
  },
  {
    id: "exercise",
    name: "Take a walk",
    routine: "Morning",
    done: true,
    category: "Body",
    frequency: "Every day",
    time: "Any time",
  },
  {
    id: "meditate",
    name: "Meditate",
    routine: "Morning",
    done: false,
    category: "Mind",
    frequency: "Every day",
    time: "Any time",
  },
  {
    id: "journal",
    name: "Journal",
    routine: "Night",
    done: false,
    category: "Mind",
    frequency: "Every day",
    time: "Any time",
  },
  {
    id: "read",
    name: "Read 20 minutes",
    routine: "Night",
    done: true,
    category: "Mind",
    frequency: "Every day",
    time: "Any time",
  },
  {
    id: "stretch",
    name: "Stretch",
    routine: "Night",
    done: false,
    category: "Body",
    frequency: "Every day",
    time: "Any time",
  },
  {
    id: "sleep",
    name: "Sleep before 11 PM",
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
    typeof h.time === "string"
  );
}
