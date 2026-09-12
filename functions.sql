create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles(id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict(id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at before update on public.notes for each row execute function public.set_updated_at();
drop trigger if exists tests_set_updated_at on public.tests;
create trigger tests_set_updated_at before update on public.tests for each row execute function public.set_updated_at();
drop trigger if exists current_affairs_set_updated_at on public.current_affairs;
create trigger current_affairs_set_updated_at before update on public.current_affairs for each row execute function public.set_updated_at();

create or replace function public.get_test_questions(p_test_id uuid)
returns table(question_id uuid, question_en text, question_as text, options jsonb, position integer)
language sql
security definer
set search_path = public, pg_temp
as $$
  select q.id, q.question_en, q.question_as, q.options, tq.position
  from public.tests t
  join public.test_questions tq on tq.test_id = t.id
  join public.questions q on q.id = tq.question_id
  where t.id = p_test_id and t.published = true
  order by tq.position;
$$;
revoke all on function public.get_test_questions(uuid) from public;
grant execute on function public.get_test_questions(uuid) to authenticated;

create or replace function public.submit_test_attempt(p_test_id uuid, p_attempt_id uuid, p_answers jsonb)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_attempt public.attempts%rowtype;
  v_score integer := 0;
  v_total integer;
  v_duration integer;
  v_q record;
  v_idx integer;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  if jsonb_typeof(p_answers) <> 'object' then raise exception 'Invalid answers'; end if;

  select * into v_attempt
  from public.attempts
  where id = p_attempt_id and user_id = v_user and test_id = p_test_id
  for update;
  if not found then raise exception 'Attempt not found'; end if;
  if v_attempt.submitted_at is not null then raise exception 'already submitted'; end if;

  select duration_minutes into v_duration from public.tests where id = p_test_id and published = true;
  if v_duration is null then raise exception 'Test not available'; end if;
  if now() > v_attempt.started_at + make_interval(mins => v_duration) then raise exception 'Test time has expired'; end if;

  select count(*) into v_total from public.test_questions where test_id = p_test_id;
  if v_total = 0 then raise exception 'Test has no questions'; end if;

  for v_q in
    select tq.question_id, q.correct_index
    from public.test_questions tq
    join public.questions q on q.id = tq.question_id
    where tq.test_id = p_test_id
  loop
    v_idx := null;
    if jsonb_typeof(p_answers->v_q.question_id::text) = 'number' then
      begin v_idx := (p_answers->>v_q.question_id::text)::integer; exception when others then v_idx := null; end;
    end if;
    if v_idx is not null and v_idx between 0 and 3 and v_idx = v_q.correct_index then
      v_score := v_score + 1;
    end if;
  end loop;

  update public.attempts
  set answers = p_answers, score = v_score, total = v_total, submitted_at = now()
  where id = p_attempt_id;
  return p_attempt_id;
end;
$$;
revoke all on function public.submit_test_attempt(uuid, uuid, jsonb) from public;
grant execute on function public.submit_test_attempt(uuid, uuid, jsonb) to authenticated;
