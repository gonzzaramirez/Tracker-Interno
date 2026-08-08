-- 021_task_goal_members.sql — per-goal member filtering.
-- Goals can optionally target a subset of the task's mapped members.
-- An empty array ('[]') means all mapped members (backward compatible).

ALTER TABLE task_goals ADD COLUMN member_ids TEXT DEFAULT '[]';
