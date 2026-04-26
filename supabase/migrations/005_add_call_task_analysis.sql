alter table call_logs
  add column if not exists task_label text,
  add column if not exists task_confidence text
    check (task_confidence in ('High', 'Medium', 'Low'));
