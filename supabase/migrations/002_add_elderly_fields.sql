alter table elderly_users
  add column if not exists age int,
  add column if not exists nickname text,
  add column if not exists phone_model text;
