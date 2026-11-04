-- HONG_BAO.sql  (Vo Lam Idle · he thong Hong Bao tren may chu)
-- Chay 1 lan trong Supabase > SQL Editor. Chay lai nhieu lan van an toan.
-- Tao: hb_get, hb_reward, hb_open, hb_open_n (dung dung cach app.js dang goi).
-- LUU Y: Dai Hong Bao (dhb) duoc ghi nhan vao vi nhung CHUA mo duoc,
-- vi game cong Kim Nguyen Bao qua he thong KNB tren may chu (knb_sync/knb_spend)
-- ma project nay chua co.

begin;

-- 1) Bang -------------------------------------------------------------

create table if not exists public.hb_wallet (
  owner   uuid primary key references auth.users(id) on delete cascade,
  hb      integer not null default 0 check (hb  >= 0),
  dhb     integer not null default 0 check (dhb >= 0),
  updated timestamptz not null default now()
);

-- Cac khoan thuong chi nhan 1 lan (moc cap, thanh tuu) hoac 1 lan/ngay (diem danh)
create table if not exists public.hb_claims (
  id      bigint generated always as identity primary key,
  owner   uuid not null references auth.users(id) on delete cascade,
  slot    integer not null default 0,
  gkey    text not null,
  period  date not null default date '1970-01-01',
  hb      integer not null default 0,
  dhb     integer not null default 0,
  created timestamptz not null default now(),
  unique (owner, slot, gkey, period)
);

-- Dem so Hong Bao nhan tu nguon do client tu bao (Phuc Duyen, su kien...) moi ngay
create table if not exists public.hb_daily (
  owner uuid not null references auth.users(id) on delete cascade,
  day   date not null,
  hb    integer not null default 0,
  dhb   integer not null default 0,
  primary key (owner, day)
);

create table if not exists public.hb_log (
  id      bigint generated always as identity primary key,
  owner   uuid not null references auth.users(id) on delete cascade,
  kind    text not null,
  amt     integer not null,
  cname   text,
  created timestamptz not null default now()
);

-- Bang phan thuong (lay tu app.js)
create table if not exists public.hb_reward_defs (
  def_key text primary key,
  hb      integer not null default 0,
  dhb     integer not null default 0
);

insert into public.hb_reward_defs(def_key, hb, dhb) values
  -- moc cap, chua chuyen sinh
  ('lv0:10',1,0),('lv0:20',1,0),('lv0:30',2,0),('lv0:40',2,0),('lv0:50',3,0),
  ('lv0:60',3,0),('lv0:70',3,0),('lv0:80',5,0),('lv0:90',5,0),('lv0:95',5,1),
  ('lv0:97',5,0),('lv0:99',5,1),('lv0:110',5,0),('lv0:120',8,1),('lv0:135',8,0),
  ('lv0:150',10,2),('lv0:165',10,0),('lv0:180',10,1),('lv0:190',15,1),('lv0:200',20,3),
  -- moc cap, sau chuyen sinh
  ('lvr:10',2,0),('lvr:30',3,0),('lvr:50',5,0),('lvr:80',5,0),
  ('lvr:100',8,1),('lvr:130',8,0),('lvr:160',10,1),('lvr:200',15,2),
  -- thanh tuu
  ('ach:lv30',2,0),('ach:lv50',2,0),('ach:lv80',3,0),('ach:lv100',3,0),('ach:lv150',5,1),
  ('ach:k1000',2,0),('ach:k10000',5,0),('ach:b50',3,0),('ach:zone8',5,0),('ach:zone16',5,1),
  ('ach:setfull',5,1),('ach:tower20',5,1),('ach:reborn1',10,2),('ach:gold5',5,1),('ach:login30',10,2),
  -- diem danh 7 ngay
  ('d:1',1,0),('d:2',2,0),('d:3',2,0),('d:4',3,0),('d:5',3,0),('d:6',5,0),('d:7',5,1),
  -- moc diem danh theo thang
  ('m:5',5,0),('m:10',10,1),('m:15',10,0),('m:20',15,2),('m:25',15,0),('m:30',20,3)
on conflict (def_key) do update set hb = excluded.hb, dhb = excluded.dhb;

-- 2) Bao mat: bat RLS, khong cap quyen truc tiep, chi di qua ham ----------

alter table public.hb_wallet      enable row level security;
alter table public.hb_claims      enable row level security;
alter table public.hb_daily       enable row level security;
alter table public.hb_log         enable row level security;
alter table public.hb_reward_defs enable row level security;

revoke all on public.hb_wallet, public.hb_claims, public.hb_daily,
              public.hb_log, public.hb_reward_defs from anon, authenticated;

-- 3) Ham noi bo: quay so Hong Bao (1 - 1000 van luong) ---------------------

create or replace function public.hb_roll_hb()
returns integer
language sql
volatile
set search_path = public
as $$
  select case
    when random() < 0.005 then 1000                                  -- trung lon
    else least(999, 1 + floor(999 * power(random(), 3.5))::int)       -- trung binh ~220
  end;
$$;

-- 4) hb_get: tra ve so Hong Bao hien co --------------------------------------

create or replace function public.hb_get()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  u uuid := auth.uid();
  w public.hb_wallet;
begin
  if u is null then raise exception 'Cần đăng nhập'; end if;
  insert into public.hb_wallet(owner) values (u) on conflict (owner) do nothing;
  select * into w from public.hb_wallet where owner = u;
  return jsonb_build_object('hb', w.hb, 'dhb', w.dhb);
end;
$$;

-- 5) hb_reward: nhan Hong Bao tu moc cap / thanh tuu / diem danh / nguon khac

create or replace function public.hb_reward(k text, cnt integer default 1, s integer default 0)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  u        uuid    := auth.uid();
  v_k      text    := btrim(coalesce(k, ''));
  v_cnt    integer := greatest(1, least(coalesce(cnt, 1), 500));
  v_slot   integer := greatest(0, least(coalesce(s, 0), 19));
  v_day    date    := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_period date    := date '1970-01-01';
  v_cap_hb  constant integer := 400;   -- gioi han/ngay cho nguon client tu bao
  v_cap_dhb constant integer := 20;
  parts    text[];
  v_def    text;
  v_re     integer;
  v_lv     integer;
  v_hb     integer := 0;
  v_dhb    integer := 0;
  v_ins    integer;
  d        public.hb_reward_defs;
  ch       record;
  dy       public.hb_daily;
  w        public.hb_wallet;
begin
  if u is null then raise exception 'Cần đăng nhập'; end if;
  if v_k !~ '^[a-z]{1,8}(:[A-Za-z0-9_]{1,24}){1,2}$' then
    return jsonb_build_object('got', false, 'why', 'khóa phần thưởng không hợp lệ');
  end if;

  insert into public.hb_wallet(owner) values (u) on conflict (owner) do nothing;
  select * into w from public.hb_wallet where owner = u for update;

  parts := string_to_array(v_k, ':');

  if parts[1] = 'lv' then
    -- lv:<level> (chuyen sinh 0) hoac lv:<chuyen sinh>:<level>
    if array_length(parts, 1) = 2 and parts[2] ~ '^\d{1,3}$' then
      v_re := 0;  v_lv := parts[2]::int;
    elsif array_length(parts, 1) = 3 and parts[2] ~ '^\d{1,2}$' and parts[3] ~ '^\d{1,3}$' then
      v_re := parts[2]::int;  v_lv := parts[3]::int;
    else
      return jsonb_build_object('got', false, 'why', 'khóa mốc cấp không hợp lệ');
    end if;
    v_def := case when v_re = 0 then 'lv0:' else 'lvr:' end || v_lv;

    select * into d from public.hb_reward_defs where def_key = v_def;
    if not found then
      return jsonb_build_object('got', false, 'why', 'mốc cấp không có phần thưởng');
    end if;

    select lvl, reborn into ch from public.chars where owner = u and slot = v_slot;
    if not found then
      return jsonb_build_object('got', false, 'why', 'chưa có nhân vật trên máy chủ');
    end if;
    if not (ch.reborn > v_re or (ch.reborn = v_re and ch.lvl >= v_lv)) then
      return jsonb_build_object('got', false, 'why', 'chưa đạt cấp trên máy chủ');
    end if;
    v_hb := d.hb;  v_dhb := d.dhb;

  elsif parts[1] in ('ach', 'd', 'm') and array_length(parts, 1) = 2 then
    select * into d from public.hb_reward_defs where def_key = v_k;
    if not found then
      return jsonb_build_object('got', false, 'why', 'phần thưởng không tồn tại');
    end if;
    v_hb := d.hb;  v_dhb := d.dhb;
    if parts[1] in ('d', 'm') then v_period := v_day; end if;   -- 1 lan/ngay

  elsif array_length(parts, 1) = 2 and parts[2] in ('hb', 'dhb') then
    -- nguon khac (fd:hb, ev:hb, bk:hb ...): gioi han theo ngay
    insert into public.hb_daily(owner, day) values (u, v_day) on conflict do nothing;
    select * into dy from public.hb_daily where owner = u and day = v_day for update;
    if parts[2] = 'hb' then
      v_hb := least(v_cnt, greatest(0, v_cap_hb - dy.hb));
    else
      v_dhb := least(v_cnt, greatest(0, v_cap_dhb - dy.dhb));
    end if;
    if v_hb + v_dhb <= 0 then
      return jsonb_build_object('got', false, 'why', 'đã đạt giới hạn nhận trong ngày',
                                'hb', w.hb, 'dhb', w.dhb);
    end if;
    update public.hb_daily set hb = hb + v_hb, dhb = dhb + v_dhb
     where owner = u and day = v_day;
  else
    return jsonb_build_object('got', false, 'why', 'khóa phần thưởng không hợp lệ');
  end if;

  -- Cac khoan chi nhan 1 lan: ghi vao hb_claims, neu da co thi coi nhu da nhan
  if parts[1] in ('lv', 'ach', 'd', 'm') then
    insert into public.hb_claims(owner, slot, gkey, period, hb, dhb)
    values (u, v_slot, v_k, v_period, v_hb, v_dhb)
    on conflict (owner, slot, gkey, period) do nothing;
    get diagnostics v_ins = row_count;
    if v_ins = 0 then
      return jsonb_build_object('got', true, 'why', 'đã nhận trước đó', 'hb', w.hb, 'dhb', w.dhb);
    end if;
  end if;

  update public.hb_wallet
     set hb = hb + v_hb, dhb = dhb + v_dhb, updated = now()
   where owner = u
  returning * into w;

  return jsonb_build_object('got', true, 'hb', w.hb, 'dhb', w.dhb);
end;
$$;

-- 6) hb_open / hb_open_n: mo Hong Bao ----------------------------------------

create or replace function public.hb_open(k text, cname text default '')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  u uuid := auth.uid();
  w public.hb_wallet;
  v_amt integer;
begin
  if u is null then raise exception 'Cần đăng nhập'; end if;
  if k = 'dhb' then
    raise exception 'Đại Hồng Bao chưa mở được: máy chủ chưa có hệ thống Kim Nguyên Bảo';
  elsif k <> 'hb' then
    raise exception 'Loại Hồng Bao không hợp lệ';
  end if;

  select * into w from public.hb_wallet where owner = u for update;
  if not found or w.hb < 1 then raise exception 'Không còn Hồng Bao'; end if;

  v_amt := public.hb_roll_hb();
  update public.hb_wallet set hb = hb - 1, updated = now()
   where owner = u returning * into w;
  insert into public.hb_log(owner, kind, amt, cname)
  values (u, 'hb', v_amt, left(coalesce(cname, ''), 40));

  return jsonb_build_object('amt', v_amt, 'n', w.hb, 'bal', null);
end;
$$;

create or replace function public.hb_open_n(k text, cnt integer, cname text default '')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  u uuid := auth.uid();
  w public.hb_wallet;
  v_n integer := greatest(1, least(coalesce(cnt, 1), 10));
  v_amt integer;
  v_sum integer := 0;
  v_amts integer[] := '{}';
  i integer;
begin
  if u is null then raise exception 'Cần đăng nhập'; end if;
  if k = 'dhb' then
    raise exception 'Đại Hồng Bao chưa mở được: máy chủ chưa có hệ thống Kim Nguyên Bảo';
  elsif k <> 'hb' then
    raise exception 'Loại Hồng Bao không hợp lệ';
  end if;

  select * into w from public.hb_wallet where owner = u for update;
  if not found or w.hb < 1 then raise exception 'Không còn Hồng Bao'; end if;

  v_n := least(v_n, w.hb);
  for i in 1..v_n loop
    v_amt := public.hb_roll_hb();
    v_sum := v_sum + v_amt;
    v_amts := v_amts || v_amt;
    insert into public.hb_log(owner, kind, amt, cname)
    values (u, 'hb', v_amt, left(coalesce(cname, ''), 40));
  end loop;

  update public.hb_wallet set hb = hb - v_n, updated = now()
   where owner = u returning * into w;

  return jsonb_build_object('amt', v_sum, 'amts', to_jsonb(v_amts), 'n', w.hb, 'bal', null);
end;
$$;

-- 7) Quyen thuc thi: chi nguoi da dang nhap ----------------------------------

revoke all on function public.hb_roll_hb()                         from public, anon, authenticated;
revoke all on function public.hb_get()                             from public, anon;
revoke all on function public.hb_reward(text, integer, integer)    from public, anon;
revoke all on function public.hb_open(text, text)                  from public, anon;
revoke all on function public.hb_open_n(text, integer, text)       from public, anon;

grant execute on function public.hb_get()                          to authenticated;
grant execute on function public.hb_reward(text, integer, integer) to authenticated;
grant execute on function public.hb_open(text, text)               to authenticated;
grant execute on function public.hb_open_n(text, integer, text)    to authenticated;

commit;

-- Lam moi bo nho schema de Supabase nhan ham moi
notify pgrst, 'reload schema';
