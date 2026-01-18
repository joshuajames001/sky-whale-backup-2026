-- Add subscription tracking columns to profiles
alter table profiles 
add column if not exists subscription_status text check (subscription_status in ('active', 'past_due', 'canceled', 'trialing')),
add column if not exists subscription_tier text,
add column if not exists energy_allowance int default 0,
add column if not exists next_energy_grant timestamptz;

-- Function to claim monthly energy
create or replace function claim_monthly_energy(user_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  profile_record record;
  new_grant_date timestamptz;
begin
  -- Get profile info
  select * into profile_record from profiles where id = user_id;

  -- Check if eligible
  if profile_record.subscription_status != 'active' then
    return json_build_object('success', false, 'message', 'No active subscription');
  end if;

  if profile_record.next_energy_grant > now() then
    return json_build_object('success', false, 'message', 'Energy already claimed for this period', 'next_grant', profile_record.next_energy_grant);
  end if;

  if profile_record.energy_allowance <= 0 then
     return json_build_object('success', false, 'message', 'No energy allowance set');
  end if;

  -- Calculate next grant date (1 month from previous grant, or now + 1 month if way behind?)
  -- Better to stick to anniversary. If way behind, maybe just now + 1 month.
  -- Let's do: next_allowance = GREATEST(next_energy_grant + interval '1 month', now() + interval '1 month') if we want to skip missed months?
  -- Or just simple: now() + 1 month.
  new_grant_date := now() + interval '1 month';

  -- Add Energy
  perform add_energy(user_id, profile_record.energy_allowance);
  
  -- Update Profile
  update profiles 
  set next_energy_grant = new_grant_date
  where id = user_id;

  -- Log Transaction (internal system grant)
  insert into transactions (user_id, amount_czk, energy_amount, package_id, status)
  values (user_id, 0, profile_record.energy_allowance, 'system_monthly_drip', 'completed');

  return json_build_object('success', true, 'amount', profile_record.energy_allowance, 'next_grant', new_grant_date);
end;
$$;
