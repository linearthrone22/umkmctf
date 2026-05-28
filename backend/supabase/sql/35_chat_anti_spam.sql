-- Feature: anti-spam chat + rate limit per user
-- Safe to run multiple times.

create or replace function public.enforce_message_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recent_count int;
  v_last record;
begin
  if auth.uid() is null then
    raise exception 'Unauthenticated';
  end if;

  if (new.sender_id)::text <> (auth.uid())::text then
    raise exception 'sender_id must match auth.uid()';
  end if;

  -- Limit: max 6 messages / 10 seconds per conversation per sender
  select count(*) into v_recent_count
  from public.messages m
  where m.conversation_id = new.conversation_id
    and (m.sender_id)::text = (auth.uid())::text
    and m.created_at >= now() - interval '10 seconds';

  if coalesce(v_recent_count, 0) >= 6 then
    raise exception 'Rate limit: terlalu cepat (maks 6 pesan / 10 detik).';
  end if;

  -- Block duplicate spam: same text within 20 seconds
  select m.body, m.created_at into v_last
  from public.messages m
  where m.conversation_id = new.conversation_id
    and (m.sender_id)::text = (auth.uid())::text
  order by m.created_at desc
  limit 1;

  if found then
    if lower(coalesce(v_last.body,'')) = lower(coalesce(new.body,'')) and v_last.created_at >= now() - interval '20 seconds' then
      raise exception 'Duplicate blocked: pesan sama dalam 20 detik.';
    end if;
  end if;

  -- Basic sanity
  if length(btrim(coalesce(new.body,''))) < 1 then
    raise exception 'Pesan kosong.';
  end if;
  if length(new.body) > 1500 then
    raise exception 'Pesan terlalu panjang (maks 1500 karakter).';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_messages_before_insert_rate_limit on public.messages;
create trigger trg_messages_before_insert_rate_limit
before insert on public.messages
for each row execute function public.enforce_message_rate_limit();

