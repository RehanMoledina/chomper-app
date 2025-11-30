export type Todo = {
  id: string;
  user_id: string;
  text: string;
  notes: string | null;
  completed: boolean;
  due_date: string | null;
  due_time: string | null;
  created_at: string;
  updated_at: string;
  position: number | null;
  is_recurring: boolean;
  recurrence_type: 'daily' | 'weekly' | 'monthly' | null;
  recurrence_day: number | null;
};