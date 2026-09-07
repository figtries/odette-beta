'use client';
import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { completion, type Habit } from './habits';
type Tool = { name: string; description: string; inputSchema: object; annotations: { readOnlyHint: boolean }; execute: (input: unknown) => unknown };
type Context = { registerTool: (tool: Tool, options: { signal: AbortSignal }) => void | Promise<void> };
export function useOdetteTools(habits: Habit[], edited: boolean, setHabits: Dispatch<SetStateAction<Habit[]>>, setEdited: Dispatch<SetStateAction<boolean>>) {
  useEffect(() => {
    const context = (document as Document & { modelContext?: Context }).modelContext;
    if (!context?.registerTool) return;
    const controller = new AbortController();
    const register = (tool: Tool) => { try { void Promise.resolve(context.registerTool(tool, { signal: controller.signal })).catch(() => {}); } catch {} };
    register({ name: 'read_odette_rituals', description: 'Read rituals saved in this browser and their completion.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true }, execute: () => ({ habits, completion: completion(habits, edited) }) });
    register({ name: 'set_odette_ritual_completion', description: 'Mark an existing local ritual complete or incomplete.', inputSchema: { type: 'object', properties: { id: { type: 'string' }, done: { type: 'boolean' } }, required: ['id', 'done'], additionalProperties: false }, annotations: { readOnlyHint: false }, execute: (input) => {
      const args = input as { id?: unknown; done?: unknown } | null;
      if (!args || typeof args.id !== 'string' || typeof args.done !== 'boolean' || !habits.some(h => h.id === args.id)) throw new Error('An existing ritual id and boolean done value are required.');
      const done = args.done;
      setHabits(items => items.map(h => h.id === args.id ? { ...h, done } : h));
      setEdited(true);
      return { id: args.id, done };
    } });
    return () => controller.abort();
  }, [habits, edited, setHabits, setEdited]);
}
