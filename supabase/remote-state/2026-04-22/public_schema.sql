--
-- PostgreSQL database dump
--

\restrict Ygcq9STfsnyUCLCl9hleuHLRMouM7Ezn0G9TgIAk5aWb9UzgEoBjndE2OVraGkH

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.9 (Ubuntu 17.9-0ubuntu0.25.10.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: transaction_method; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.transaction_method AS ENUM (
    'stripe',
    'paypal',
    'crypto',
    'manual',
    'spei',
    'oxxo',
    'card',
    'internal_game'
);


--
-- Name: transaction_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.transaction_status AS ENUM (
    'pending',
    'completed',
    'failed',
    'cancelled'
);


--
-- Name: transaction_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.transaction_type AS ENUM (
    'deposit',
    'withdraw',
    'bet',
    'win',
    'adjustment',
    'bonus'
);


--
-- Name: _distribute_affiliate_commission(uuid, uuid, numeric, numeric, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public._distribute_affiliate_commission(p_affiliate_user_id uuid, p_referred_user_id uuid, p_wager_amount numeric, p_commission_amount numeric, p_wager_ref text, p_game text) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Insertar el registro de la ganancia en la nueva tabla
    INSERT INTO affiliate_earnings (
        affiliate_user_id,
        referred_user_id,
        wager_amount,
        commission_amount,
        wager_ref,
        game
    ) VALUES (
        p_affiliate_user_id,
        p_referred_user_id,
        p_wager_amount,
        p_commission_amount,
        p_wager_ref,
        p_game
    );

    -- Actualizar el saldo de comisiones del afiliado
    UPDATE balances
    SET commission_balance = commission_balance + p_commission_amount
    WHERE user_id = p_affiliate_user_id;
END;
$$;


--
-- Name: admin_confirm_manual_deposit(text, numeric, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_confirm_manual_deposit(p_folio text, p_amount numeric DEFAULT NULL::numeric, p_ref_id text DEFAULT NULL::text, p_method text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  row public.manual_deposit_requests%rowtype;
  amt numeric;
  ref text;
  w jsonb;
begin
  select * into row
  from public.manual_deposit_requests
  where folio = p_folio
  order by created_at desc
  limit 1
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'NOT_FOUND', 'folio', p_folio);
  end if;

  if row.status is distinct from 'pending' then
    return jsonb_build_object(
      'ok', true,
      'idempotent', true,
      'folio', row.folio,
      'deposit_id', row.id,
      'user_id', row.user_id,
      'amount', row.amount,
      'status', row.status
    );
  end if;

  amt := coalesce(p_amount, row.amount);
  if amt is null or amt <= 0 then
    return jsonb_build_object('ok', false, 'error', 'INVALID_AMOUNT', 'folio', row.folio);
  end if;

  ref := coalesce(p_ref_id, p_method, row.folio);

  w := public.wallet_apply_delta(row.user_id, amt, 0, 0, 'deposit_manual', ref, 'spei');
  if coalesce(w->>'ok','false') <> 'true' then
    return jsonb_build_object('ok', false, 'error', 'WALLET_APPLY_FAILED', 'wallet', w, 'folio', row.folio);
  end if;

  update public.manual_deposit_requests
  set status = 'confirmed',
      confirmed_at = now(),
      updated_at = now()
  where id = row.id;

  return jsonb_build_object(
    'ok', true,
    'idempotent', coalesce((w->>'idempotent')::boolean, false),
    'folio', row.folio,
    'deposit_id', row.id,
    'user_id', row.user_id,
    'amount', amt,
    'status', 'confirmed',
    'wallet', w
  );
end;
$$;


--
-- Name: admin_confirm_manual_deposit(text, numeric, text, text, text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_confirm_manual_deposit(p_folio text, p_amount numeric DEFAULT NULL::numeric, p_ref_id text DEFAULT NULL::text, p_status text DEFAULT NULL::text, p_reason text DEFAULT NULL::text, p_meta jsonb DEFAULT '{}'::jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions'
    AS $$
declare
  v_req public.manual_deposit_requests%rowtype;
  v_status text;
  v_amount numeric;
  v_ref text;
  v_wallet jsonb;
  v_tx_id uuid;
begin
  select * into v_req
  from public.manual_deposit_requests
  where folio = p_folio
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Folio no encontrado');
  end if;

  v_status := lower(trim(coalesce(nullif(p_status,''), 'approved')));

  if v_status not in ('approved','rejected') then
    return jsonb_build_object('ok', false, 'error', 'Status inválido');
  end if;

  if v_req.status is distinct from 'pending' then
    -- idempotente: ya procesado
    return jsonb_build_object(
      'ok', true,
      'already_processed', true,
      'deposit_id', v_req.id,
      'user_id', v_req.user_id,
      'amount', v_req.amount,
      'status', v_req.status
    );
  end if;

  v_amount := coalesce(p_amount, v_req.amount);

  if p_amount is not null and abs(p_amount - v_req.amount) > 0.01 then
    return jsonb_build_object('ok', false, 'error', 'Amount no coincide con la solicitud');
  end if;

  v_ref := nullif(trim(p_ref_id), '');
  if v_ref is null then
    v_ref := 'md:' || p_folio;
  end if;

  if v_status = 'rejected' then
    update public.manual_deposit_requests
      set status = 'rejected',
          reviewed_at = now(),
          reviewed_by = coalesce(p_meta->>'reviewed_by','admin_api'),
          metadata = coalesce(metadata,'{}'::jsonb) || coalesce(p_meta,'{}'::jsonb) || jsonb_build_object('ref_id', v_ref, 'reason', p_reason)
    where id = v_req.id;

    return jsonb_build_object(
      'ok', true,
      'deposit_id', v_req.id,
      'user_id', v_req.user_id,
      'amount', v_amount,
      'status', 'rejected'
    );
  end if;

  -- approved: credit wallet
  v_wallet := public.wallet_apply_delta(
    v_req.user_id,
    v_amount,
    0,
    0,
    coalesce(nullif(p_reason,''), 'deposit_manual'),
    v_ref,
    jsonb_build_object('folio', p_folio, 'deposit_id', v_req.id) || coalesce(p_meta,'{}'::jsonb)
  );

  v_tx_id := (v_wallet->>'tx_id')::uuid;

  update public.manual_deposit_requests
    set status = 'approved',
        reviewed_at = now(),
        reviewed_by = coalesce(p_meta->>'reviewed_by','admin_api'),
        updated_at = now(),
        metadata = coalesce(metadata,'{}'::jsonb) || coalesce(p_meta,'{}'::jsonb) || jsonb_build_object('ref_id', v_ref, 'reason', p_reason, 'tx_id', v_tx_id)
  where id = v_req.id;

  update public.profiles
    set last_deposit_amount = v_amount,
        last_deposit_at = timezone('utc', now()),
        updated_at = now()
  where id = v_req.user_id;

  return jsonb_build_object(
    'ok', true,
    'deposit_id', v_req.id,
    'user_id', v_req.user_id,
    'amount', v_amount,
    'status', 'approved',
    'tx_id', v_tx_id
  );
end;
$$;


--
-- Name: admin_reject_manual_deposit(text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_reject_manual_deposit(p_folio text, p_ref_id text DEFAULT NULL::text, p_note text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  row public.manual_deposit_requests%rowtype;
begin
  select * into row
  from public.manual_deposit_requests
  where folio = p_folio
  order by created_at desc
  limit 1
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'NOT_FOUND', 'folio', p_folio);
  end if;

  if row.status is distinct from 'pending' then
    return jsonb_build_object(
      'ok', true,
      'idempotent', true,
      'folio', row.folio,
      'deposit_id', row.id,
      'status', row.status
    );
  end if;

  update public.manual_deposit_requests
  set status = 'rejected',
      rejected_at = now(),
      updated_at = now(),
      instructions = jsonb_set(coalesce(instructions,'{}'::jsonb), '{rejection_note}', to_jsonb(coalesce(p_note,'')), true)
  where id = row.id;

  return jsonb_build_object('ok', true, 'folio', row.folio, 'deposit_id', row.id, 'status', 'rejected');
end;
$$;


--
-- Name: apply_cashback_on_loss(uuid, numeric, text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.apply_cashback_on_loss(p_user_id uuid, p_loss_amount numeric, p_ref_id text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_rate numeric;
  v_cb numeric;
  v_settings public.casino_settings%rowtype;
  v_p public.profiles%rowtype;

  v_today date := current_date;
  v_week_start date := (date_trunc('week', now())::date);

  v_allow numeric;
  v_day_total numeric;
  v_week_total numeric;

  v_wager_mult numeric;
BEGIN
  IF p_loss_amount IS NULL OR p_loss_amount <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'msg', 'loss_invalid');
  END IF;

  SELECT * INTO v_settings FROM public.casino_settings WHERE id=1;

  SELECT * INTO v_p
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_p.cashback_day IS DISTINCT FROM v_today THEN
    v_p.cashback_day := v_today;
    v_p.cashback_day_total := 0;
  END IF;

  IF v_p.cashback_week_start IS DISTINCT FROM v_week_start THEN
    v_p.cashback_week_start := v_week_start;
    v_p.cashback_week_total := 0;
  END IF;

  v_rate := public.get_cashback_rate(p_user_id);
  IF v_rate <= 0 THEN
    UPDATE public.profiles
    SET cashback_day=v_p.cashback_day,
        cashback_day_total=v_p.cashback_day_total,
        cashback_week_start=v_p.cashback_week_start,
        cashback_week_total=v_p.cashback_week_total
    WHERE id=p_user_id;

    RETURN jsonb_build_object('ok', true, 'rate', 0, 'cashback', 0, 'msg', 'no_tier');
  END IF;

  v_cb := round(p_loss_amount * v_rate, 2);
  IF v_cb <= 0 THEN
    RETURN jsonb_build_object('ok', true, 'rate', v_rate, 'cashback', 0);
  END IF;

  v_day_total := coalesce(v_p.cashback_day_total,0);
  v_week_total := coalesce(v_p.cashback_week_total,0);

  v_allow := least(
    greatest(v_settings.cashback_daily_cap - v_day_total, 0),
    greatest(v_settings.cashback_weekly_cap - v_week_total, 0)
  );

  IF v_allow <= 0 THEN
    UPDATE public.profiles
    SET cashback_day=v_p.cashback_day,
        cashback_day_total=v_day_total,
        cashback_week_start=v_p.cashback_week_start,
        cashback_week_total=v_week_total
    WHERE id=p_user_id;

    RETURN jsonb_build_object('ok', true, 'rate', v_rate, 'cashback', 0, 'msg', 'cap_reached');
  END IF;

  IF v_cb > v_allow THEN
    v_cb := v_allow;
  END IF;

  -- BONUS ONLY (pa' que no te lo farmeen)
  PERFORM public.wallet_apply_delta(
    p_user_id,
    0, v_cb, 0,
    'cashback_loss',
    'internal_game',
    jsonb_build_object(
      'ref_id', coalesce(p_ref_id,'cashback'),
      'loss_amount', p_loss_amount,
      'rate', v_rate
    ) || coalesce(p_metadata,'{}'::jsonb)
  );

  v_wager_mult := v_settings.cashback_wager_multiplier;

  UPDATE public.profiles
  SET cashback_day = v_today,
      cashback_day_total = v_day_total + v_cb,
      cashback_week_start = v_week_start,
      cashback_week_total = v_week_total + v_cb,
      wager_required = wager_required + round(v_cb * v_wager_mult, 2)
  WHERE id = p_user_id;

  INSERT INTO public.cashback_events(user_id, loss_amount, rate, cashback_amount, ref_id, metadata)
  VALUES (p_user_id, p_loss_amount, v_rate, v_cb, p_ref_id, coalesce(p_metadata,'{}'::jsonb));

  RETURN jsonb_build_object('ok', true, 'rate', v_rate, 'cashback', v_cb, 'cap_allow', v_allow);
END $$;


--
-- Name: apply_wager_progress(uuid, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.apply_wager_progress(p_user_id uuid, p_wager_amount numeric) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_p public.profiles%rowtype;
  v_b public.balances%rowtype;
  v_to_release numeric := 0;
BEGIN
  IF p_wager_amount IS NULL OR p_wager_amount <= 0 THEN
    RETURN jsonb_build_object('ok', true, 'msg', 'noop');
  END IF;

  SELECT * INTO v_p
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  UPDATE public.profiles
  SET wager_progress = wager_progress + p_wager_amount
  WHERE id = p_user_id;

  IF (v_p.wager_required > 0) AND ((v_p.wager_progress + p_wager_amount) >= v_p.wager_required) THEN
    SELECT * INTO v_b
    FROM public.balances
    WHERE user_id = p_user_id
    FOR UPDATE;

    v_to_release := coalesce(v_b.bonus_balance,0);

    IF v_to_release > 0 THEN
      PERFORM public.wallet_apply_delta(
        p_user_id,
        v_to_release, -v_to_release, 0,
        'bonus_release',
        'internal_game',
        jsonb_build_object('ref_id','wager_complete','released',v_to_release)
      );
    END IF;

    UPDATE public.profiles
    SET wager_required = 0,
        wager_progress = 0
    WHERE id = p_user_id;

    RETURN jsonb_build_object('ok', true, 'released', v_to_release, 'msg', 'wager_complete');
  END IF;

  RETURN jsonb_build_object('ok', true, 'msg', 'wager_added');
END $$;


--
-- Name: approve_withdraw_request(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.approve_withdraw_request(p_folio text, p_admin_note text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'auth', 'extensions'
    AS $$
declare
  v_req public.withdraw_requests%rowtype;
begin
  if p_folio is null then
    return jsonb_build_object('ok', false, 'error', 'FOLIO_REQUIRED');
  end if;

  select *
  into v_req
  from public.withdraw_requests
  where folio = p_folio
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'WITHDRAW_NOT_FOUND');
  end if;

  if v_req.status <> 'pending' then
    return jsonb_build_object('ok', false, 'error', 'INVALID_STATUS');
  end if;

  -- LIBERAR LOCKED (YA SE DESCONTÓ DESDE REQUEST)
  if v_req.request_from = 'commission' then
    update public.balances
    set commission_locked = commission_locked - v_req.amount,
        updated_at = now()
    where user_id = v_req.user_id;
  else
    update public.balances
    set locked_balance = locked_balance - v_req.amount,
        updated_at = now()
    where user_id = v_req.user_id;
  end if;

  -- ACTUALIZAR RETIRO
  update public.withdraw_requests
  set status = 'completed',
      admin_note = p_admin_note,
      processed_at = now(),
      updated_at = now()
  where folio = p_folio;

  -- ACTUALIZAR TRANSACCIÓN
  update public.transactions
  set status = 'completed'::transaction_status,
      updated_at = now()
  where ref_id = p_folio
    and type = 'withdraw';

  return jsonb_build_object(
    'ok', true,
    'folio', p_folio,
    'status', 'completed'
  );
end;
$$;


--
-- Name: audit_transaction_trigger(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.audit_transaction_trigger() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'auth', 'extensions'
    AS $$
BEGIN
  INSERT INTO public.transactions_audit(transaction_id, changed_by, action, payload)
  VALUES (NEW.id, current_user, TG_OP, to_jsonb(NEW));
  RETURN NEW;
END;
$$;


--
-- Name: confirm_deposit(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.confirm_deposit(p_session_id text, p_payment_intent_id text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  tx record;
begin
  if p_session_id is null or length(p_session_id) = 0 then
    return;
  end if;

  -- Bloquear fila para evitar race conditions
  select * into tx from public.transactions
  where stripe_checkout_session_id = p_session_id
  for update;

  if not found or tx.status = 'completed' then
    return;
  end if;

  -- Marcar completada
  update public.transactions
  set status = 'completed',
      stripe_payment_intent_id = coalesce(p_payment_intent_id, stripe_payment_intent_id),
      completed_at = now()
  where id = tx.id;

  -- Incrementar balance
  insert into public.balances (user_id, balance)
  values (tx.user_id, tx.amount)
  on conflict (user_id)
  do update set balance = public.balances.balance + excluded.balance;
end;
$$;


--
-- Name: crash_play_round(uuid, numeric, numeric, bigint, text, text, text, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.crash_play_round(p_user_id uuid, p_bet_amount numeric, p_auto_cashout numeric, p_nonce bigint, p_server_seed text, p_server_seed_hash text, p_client_seed text, p_crash_point numeric) RETURNS TABLE(round_id uuid, bet_id uuid, win boolean, payout numeric, balance numeric, bonus_balance numeric, locked_balance numeric)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_bal public.balances%ROWTYPE;
  v_win boolean;
  v_payout numeric := 0;
  v_round_id uuid;
  v_bet_id uuid;
BEGIN
  IF p_bet_amount IS NULL OR p_bet_amount <= 0 THEN
    RAISE EXCEPTION 'INVALID_BET';
  END IF;

  IF p_auto_cashout IS NULL OR p_auto_cashout < 1.01 THEN
    RAISE EXCEPTION 'INVALID_CASHOUT';
  END IF;

  IF p_crash_point IS NULL OR p_crash_point < 1 THEN
    RAISE EXCEPTION 'INVALID_CRASH_POINT';
  END IF;

  -- asegurar fila de balance
  INSERT INTO public.balances(user_id) VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- lock balance
  SELECT * INTO v_bal
  FROM public.balances
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_bal.balance < p_bet_amount THEN
    RAISE EXCEPTION 'INSUFFICIENT_BALANCE';
  END IF;

  -- crear ronda (termina instantáneo en este MVP)
  INSERT INTO public.crash_rounds(
    nonce, server_seed, server_seed_hash, client_seed,
    bust_multiplier, status, ended_at
  )
  VALUES (
    p_nonce, p_server_seed, p_server_seed_hash, p_client_seed,
    p_crash_point, 'finished', now()
  )
  RETURNING id INTO v_round_id;

  -- insertar apuesta
  INSERT INTO public.crash_bets(
    round_id, user_id, bet_amount, auto_cashout, status
  )
  VALUES (
    v_round_id, p_user_id, p_bet_amount, p_auto_cashout, 'active'
  )
  RETURNING id INTO v_bet_id;

  -- cobrar apuesta
  v_bal.balance := round(v_bal.balance - p_bet_amount, 2);

  INSERT INTO public.transactions(user_id, reason, delta_balance, ref_id, metadata)
  VALUES (
    p_user_id,
    'bet_crash',
    -round(p_bet_amount, 2),
    v_bet_id::text,
    jsonb_build_object('round_id', v_round_id, 'auto_cashout', p_auto_cashout, 'crash_point', p_crash_point)
  );

  -- settle
  v_win := (p_auto_cashout <= p_crash_point);

  IF v_win THEN
    v_payout := round(p_bet_amount * p_auto_cashout, 2);
    v_bal.balance := round(v_bal.balance + v_payout, 2);

    UPDATE public.crash_bets
    SET status='won',
        cashout_multiplier=p_auto_cashout,
        payout_amount=v_payout,
        updated_at=now()
    WHERE id=v_bet_id;

    INSERT INTO public.transactions(user_id, reason, delta_balance, ref_id, metadata)
    VALUES (
      p_user_id,
      'win_crash',
      v_payout,
      v_bet_id::text,
      jsonb_build_object('round_id', v_round_id, 'multiplier', p_auto_cashout)
    );
  ELSE
    UPDATE public.crash_bets
    SET status='lost',
        payout_amount=0,
        updated_at=now()
    WHERE id=v_bet_id;
  END IF;

  UPDATE public.balances
  SET balance=v_bal.balance,
      updated_at=now()
  WHERE user_id=p_user_id;

  RETURN QUERY
  SELECT v_round_id, v_bet_id, v_win, v_payout, v_bal.balance, v_bal.bonus_balance, v_bal.locked_balance;
END;
$$;


--
-- Name: deposit_intents_normalize_ids(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.deposit_intents_normalize_ids() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  if new.intent_id is null or new.intent_id = '' then
    new.intent_id := new.id;
  end if;

  if new.id is null or new.id = '' then
    new.id := new.intent_id;
  end if;

  return new;
end
$$;


--
-- Name: gen_chd_folio(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.gen_chd_folio() RETURNS text
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  SELECT 'CHD-' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 10));
$$;


--
-- Name: gen_ref_code(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.gen_ref_code() RETURNS text
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  SELECT upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 8));
$$;


--
-- Name: generate_folio(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_folio(p_prefix text DEFAULT 'MD'::text) RETURNS text
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  select p_prefix || '-' || upper(left(replace(gen_random_uuid()::text,'-',''),12));
$$;


--
-- Name: get_cashback_rate(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_cashback_rate(p_user_id uuid) RETURNS numeric
    LANGUAGE plpgsql STABLE
    SET search_path TO 'public'
    AS $$
DECLARE
  v_dep numeric;
  v_dep_at timestamptz;
  v_days int;
  v_rate numeric := 0;
BEGIN
  SELECT last_deposit_amount, last_deposit_at
  INTO v_dep, v_dep_at
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_dep_at IS NULL THEN
    RETURN 0;
  END IF;

  SELECT cashback_lookback_days INTO v_days
  FROM public.casino_settings WHERE id=1;

  IF v_dep_at < (now() - (v_days || ' days')::interval) THEN
    RETURN 0;
  END IF;

  SELECT t.rate INTO v_rate
  FROM public.cashback_tiers t
  WHERE v_dep >= t.min_deposit
  ORDER BY t.min_deposit DESC
  LIMIT 1;

  RETURN coalesce(v_rate,0);
END $$;


--
-- Name: grant_free_rounds_on_deposit(uuid, numeric, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.grant_free_rounds_on_deposit(p_user_id uuid, p_amount numeric, p_game text DEFAULT 'crash'::text) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_rounds int := 0;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN 0;
  END IF;

  SELECT t.free_rounds INTO v_rounds
  FROM public.free_round_tiers t
  WHERE p_amount >= t.min_deposit
  ORDER BY t.min_deposit DESC
  LIMIT 1;

  v_rounds := coalesce(v_rounds,0);
  IF v_rounds <= 0 THEN
    RETURN 0;
  END IF;

  INSERT INTO public.free_round_entitlements(user_id, game, remaining, source, expires_at, metadata)
  VALUES (
    p_user_id, p_game, v_rounds, 'deposit',
    now() + interval '7 days',
    jsonb_build_object('deposit_amount', p_amount)
  );

  RETURN v_rounds;
END $$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'auth', 'extensions'
    AS $$
declare
  v_username text;
  v_ref text;
begin
  v_username :=
    nullif(
      regexp_replace(
        split_part(coalesce(new.email, ''), '@', 1),
        '[^a-zA-Z0-9_]+',
        '',
        'g'
      ),
      ''
    );

  if v_username is null then
    v_username := 'user_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  v_ref := 'REF-' || upper(substr(replace(new.id::text, '-', ''), 1, 10));

  insert into public.profiles (
    id,
    user_id,
    email,
    username,
    avatar_url,
    role,
    kyc_status,
    vip_level,
    xp,
    referral_code,
    free_spins,
    balance,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.id,
    new.email,
    v_username,
    null,
    'user',
    'unverified',
    'verde',
    0,
    v_ref,
    0,
    0,
    now(),
    now()
  )
  on conflict (id) do update
    set email = excluded.email,
        user_id = excluded.user_id,
        username = coalesce(public.profiles.username, excluded.username),
        updated_at = now();

  insert into public.balances (
    user_id,
    balance,
    bonus_balance,
    locked_balance,
    commission_balance,
    currency,
    created_at,
    updated_at
  )
  values (
    new.id,
    0,
    0,
    0,
    0,
    'MXN',
    now(),
    now()
  )
  on conflict (user_id) do nothing;

  return new;
exception
  when others then
    raise warning 'handle_new_user failed for %, %', new.id, sqlerrm;
    return new;
end;
$$;


--
-- Name: handle_new_user_balance(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user_balance() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  insert into public.balances (user_id, balance)
  values (new.id, 0)
  on conflict (user_id) do nothing;
  return new;
end; $$;


--
-- Name: handle_new_user_chido(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user_chido() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  insert into public.profiles(user_id, email, role, kyc_status, created_at, updated_at)
  values (new.id, new.email, 'user', null, now(), now())
  on conflict (user_id) do update set email = excluded.email, updated_at = now();

  insert into public.balances(user_id, balance, bonus_balance, locked_balance, created_at, updated_at)
  values (new.id, 0, 0, 0, now(), now())
  on conflict (user_id) do nothing;

  return new;
end;
$$;


--
-- Name: handle_new_user_profile(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user_profile() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at)
  VALUES (NEW.id, NEW.email, now())
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.balances (user_id, balance, updated_at)
  VALUES (NEW.id, 0, now())
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END $$;


--
-- Name: increment_balance(uuid, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_balance(p_user_uuid uuid, p_amount numeric) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_balance numeric(12,2);
BEGIN
  IF p_user_uuid IS NULL THEN
    RAISE EXCEPTION 'user_uuid is null';
  END IF;

  IF p_amount IS NULL THEN
    RAISE EXCEPTION 'amount is null';
  END IF;

  UPDATE public.profiles
  SET balance = balance + p_amount
  WHERE id = p_user_uuid
  RETURNING balance INTO v_balance;

  IF NOT FOUND THEN
    RAISE NOTICE 'increment_balance: user not found %', p_user_uuid;
  END IF;
END;
$$;


--
-- Name: mark_deposit_and_rewards(uuid, numeric, text, text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mark_deposit_and_rewards(p_user_id uuid, p_amount numeric, p_method text DEFAULT 'spei'::text, p_ref_id text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_rounds int := 0;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'msg', 'amount_invalid');
  END IF;

  -- saldo REAL
  PERFORM public.wallet_apply_delta(
    p_user_id,
    p_amount, 0, 0,
    'deposit_credit',
    p_method,
    jsonb_build_object('ref_id', coalesce(p_ref_id,'deposit')) || coalesce(p_metadata,'{}'::jsonb)
  );

  UPDATE public.profiles
  SET last_deposit_amount = p_amount,
      last_deposit_at = now()
  WHERE id = p_user_id;

  v_rounds := public.grant_free_rounds_on_deposit(p_user_id, p_amount, 'crash');

  RETURN jsonb_build_object('ok', true, 'amount', p_amount, 'free_rounds', v_rounds);
END $$;


--
-- Name: pick_transaction_method(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.pick_transaction_method(p_hint text) RETURNS public.transaction_method
    LANGUAGE plpgsql STABLE
    SET search_path TO 'public'
    AS $$
DECLARE v_label text;
BEGIN
  SELECT e.enumlabel INTO v_label
  FROM pg_type t
  JOIN pg_enum e ON e.enumtypid=t.oid
  WHERE t.typname='transaction_method'
    AND lower(e.enumlabel)=lower(coalesce(p_hint,''))
  LIMIT 1;

  IF v_label IS NULL THEN
    IF p_hint ILIKE '%spei%' THEN v_label := 'spei';
    ELSIF p_hint ILIKE '%oxxo%' THEN v_label := 'oxxo';
    ELSIF p_hint ILIKE '%card%' THEN v_label := 'card';
    ELSIF p_hint ILIKE '%stripe%' THEN v_label := 'stripe';
    ELSIF p_hint ILIKE '%paypal%' THEN v_label := 'paypal';
    ELSIF p_hint ILIKE '%crypto%' THEN v_label := 'crypto';
    ELSIF p_hint ILIKE '%manual%' THEN v_label := 'manual';
    ELSE v_label := 'internal_game';
    END IF;
  END IF;

  RETURN v_label::transaction_method;
END $$;


--
-- Name: pick_transaction_type(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.pick_transaction_type(p_reason text) RETURNS public.transaction_type
    LANGUAGE plpgsql STABLE
    SET search_path TO 'public'
    AS $$
DECLARE v_label text;
BEGIN
  SELECT e.enumlabel INTO v_label
  FROM pg_type t
  JOIN pg_enum e ON e.enumtypid=t.oid
  WHERE t.typname='transaction_type'
    AND (
      (p_reason ILIKE '%deposit%'   AND lower(e.enumlabel) LIKE '%depos%') OR
      (p_reason ILIKE '%withdraw%'  AND lower(e.enumlabel) LIKE '%with%') OR
      (p_reason ILIKE '%bet%'       AND lower(e.enumlabel) LIKE '%bet%')  OR
      (p_reason ILIKE '%win%'       AND lower(e.enumlabel) LIKE '%win%')  OR
      (p_reason ILIKE '%bonus%'     AND lower(e.enumlabel) LIKE '%bon%')  OR
      (p_reason ILIKE '%promo%'     AND lower(e.enumlabel) LIKE '%pro%')  OR
      (p_reason ILIKE '%cashback%'  AND lower(e.enumlabel) LIKE '%cash%')
    )
  ORDER BY e.enumsortorder
  LIMIT 1;

  IF v_label IS NULL THEN
    SELECT e.enumlabel INTO v_label
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid=t.oid
    WHERE t.typname='transaction_type'
    ORDER BY e.enumsortorder
    LIMIT 1;
  END IF;

  RETURN v_label::transaction_type;
END $$;


--
-- Name: place_bet(uuid, numeric, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.place_bet(p_user_id uuid, p_amount numeric, p_game_id text, p_round_id text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'auth', 'extensions'
    AS $$
declare
  v_new_balance numeric;
begin
  -- Llamada atómica al wallet
  select balance into v_new_balance
  from public.wallet_apply_delta(
    p_user_id => p_user_id,
    p_delta_balance => -p_amount,
    p_type => 'bet',
    p_method => 'internal_game',
    p_ref_id => p_round_id,
    p_metadata => jsonb_build_object('game', p_game_id)
  );

  -- Registrar apuesta específica
  insert into public.crash_bets (user_id, bet_amount, status, round_id)
  values (p_user_id, p_amount, 'active', p_round_id::uuid);

  return jsonb_build_object('ok', true, 'new_balance', v_new_balance);

exception when others then
  return jsonb_build_object('ok', false, 'error', SQLERRM);
end;
$$;


--
-- Name: profiles_add_free_spins(uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.profiles_add_free_spins(p_user_id uuid, p_delta integer) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare v_new int;
begin
  insert into public.profiles(user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  update public.profiles
  set free_spins = greatest(0, coalesce(free_spins,0) + coalesce(p_delta,0))
  where user_id = p_user_id
  returning free_spins into v_new;

  return jsonb_build_object('ok', true, 'free_spins', v_new);
end
$$;


--
-- Name: request_withdrawal(uuid, numeric, text, text, text, text, text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.request_withdrawal(p_user_id uuid, p_amount numeric, p_destination text, p_method text DEFAULT 'spei'::text, p_clabe text DEFAULT NULL::text, p_beneficiary text DEFAULT NULL::text, p_from text DEFAULT 'balance'::text, p_meta jsonb DEFAULT '{}'::jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'auth', 'extensions'
    AS $$
declare
  v_profile public.profiles%rowtype;
  v_bal public.balances%rowtype;
  v_folio text := public.generate_folio('WR');
  v_from text := lower(coalesce(nullif(trim(p_from), ''), 'balance'));
  v_tx_id uuid := gen_random_uuid();
begin
  if p_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'USER_REQUIRED');
  end if;

  if p_amount is null or p_amount <= 0 then
    return jsonb_build_object('ok', false, 'error', 'AMOUNT_INVALID');
  end if;

  if p_destination is null or length(trim(p_destination)) < 3 then
    return jsonb_build_object('ok', false, 'error', 'DESTINATION_REQUIRED');
  end if;

  select *
  into v_profile
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'PROFILE_NOT_FOUND');
  end if;

  if lower(coalesce(v_profile.kyc_status, '')) not in ('approved', 'verified') then
    return jsonb_build_object('ok', false, 'error', 'KYC_REQUIRED');
  end if;

  insert into public.balances(
    user_id,
    balance,
    bonus_balance,
    locked_balance,
    commission_balance,
    commission_locked,
    currency
  )
  values (p_user_id, 0, 0, 0, 0, 0, 'MXN')
  on conflict (user_id) do nothing;

  select *
  into v_bal
  from public.balances
  where user_id = p_user_id
  for update;

  if v_from = 'commission' then
    if coalesce(v_bal.commission_balance, 0) < p_amount then
      return jsonb_build_object('ok', false, 'error', 'INSUFFICIENT_COMMISSION');
    end if;

    update public.balances
    set commission_balance = commission_balance - p_amount,
        commission_locked = commission_locked + p_amount,
        updated_at = now()
    where user_id = p_user_id;
  else
    if coalesce(v_bal.balance, 0) < p_amount then
      return jsonb_build_object('ok', false, 'error', 'INSUFFICIENT_BALANCE');
    end if;

    update public.balances
    set balance = balance - p_amount,
        locked_balance = locked_balance + p_amount,
        updated_at = now()
    where user_id = p_user_id;
  end if;

  insert into public.withdraw_requests (
    id,
    user_id,
    folio,
    amount,
    currency,
    method,
    destination,
    status,
    metadata,
    provider,
    external_id,
    clabe,
    beneficiary,
    provider_payload,
    request_from,
    locked_balance_snapshot,
    locked_commission_snapshot,
    created_at,
    updated_at
  )
  values (
    gen_random_uuid(),
    p_user_id,
    v_folio,
    p_amount,
    'MXN',
    p_method,
    p_destination,
    'pending',
    coalesce(p_meta, '{}'::jsonb),
    'manual',
    v_folio,
    p_clabe,
    p_beneficiary,
    coalesce(p_meta, '{}'::jsonb),
    v_from,
    case when v_from = 'commission' then 0 else p_amount end,
    case when v_from = 'commission' then p_amount else 0 end,
    now(),
    now()
  );

  insert into public.transactions (
    id,
    user_id,
    amount,
    type,
    status,
    method,
    reason,
    ref_id,
    metadata,
    created_at,
    updated_at
  )
  values (
    v_tx_id,
    p_user_id,
    -p_amount,
    'withdraw'::transaction_type,
    'pending'::transaction_status,
    public.pick_transaction_method(p_method),
    'withdraw_request',
    v_folio,
    jsonb_build_object(
      'withdraw_from', v_from,
      'destination', p_destination,
      'clabe', p_clabe,
      'beneficiary', p_beneficiary
    ) || coalesce(p_meta, '{}'::jsonb),
    now(),
    now()
  );

  return jsonb_build_object(
    'ok', true,
    'folio', v_folio,
    'amount', p_amount,
    'from', v_from,
    'status', 'pending',
    'tx_id', v_tx_id
  );
end;
$$;


--
-- Name: secure_insert_transaction(uuid, uuid, numeric, public.transaction_type, public.transaction_status, public.transaction_method, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.secure_insert_transaction(p_id uuid, p_user_id uuid, p_amount numeric, p_type public.transaction_type, p_status public.transaction_status, p_method public.transaction_method, p_metadata jsonb DEFAULT '{}'::jsonb) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'auth', 'extensions'
    AS $$
DECLARE
  new_id uuid := p_id;
BEGIN
  -- Basic validations
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;
  IF new_id IS NULL THEN
    new_id := gen_random_uuid();
  END IF;

  -- Insert into transactions
  INSERT INTO public.transactions(id, user_id, amount, type, status, method, metadata, created_at, updated_at)
  VALUES (new_id, p_user_id, p_amount, p_type, p_status, p_method, p_metadata, now(), now());

  -- Log audit
  INSERT INTO public.transactions_audit(transaction_id, changed_by, action, payload)
  VALUES (new_id, current_user, 'insert', jsonb_build_object('user_id', p_user_id, 'amount', p_amount, 'type', p_type, 'method', p_method, 'status', p_status, 'metadata', p_metadata));

  RETURN new_id;
END;
$$;


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


--
-- Name: tg_set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tg_set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


--
-- Name: transactions_insert_audit_trigger(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.transactions_insert_audit_trigger() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'auth', 'extensions'
    AS $$
BEGIN
  INSERT INTO public.transactions_audit(transaction_id, changed_by, action, payload)
  VALUES (NEW.id, current_user, TG_OP, to_jsonb(NEW));
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


--
-- Name: wallet_apply_delta(uuid, numeric, numeric, numeric, text, text, text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.wallet_apply_delta(p_user_id uuid, p_delta_balance numeric, p_delta_bonus numeric DEFAULT 0, p_delta_locked numeric DEFAULT 0, p_reason text DEFAULT 'wallet_delta'::text, p_ref_id text DEFAULT NULL::text, p_method text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'auth', 'extensions'
    AS $$
declare
  v_balance numeric := 0;
  v_bonus numeric := 0;
  v_locked numeric := 0;
  v_currency text := 'MXN';
  v_new_balance numeric := 0;
  v_new_bonus numeric := 0;
  v_new_locked numeric := 0;
  v_tx_id uuid;
  v_type transaction_type;
  v_method transaction_method;
  v_existing_tx uuid;
  v_amount numeric;
begin
  if p_user_id is null then
    raise exception 'USER_REQUIRED';
  end if;

  if p_ref_id is not null then
    select t.id into v_existing_tx
    from public.transactions t
    where t.ref_id = p_ref_id
    limit 1;

    if found then
      select b.balance, b.bonus_balance, b.locked_balance, b.currency
      into v_balance, v_bonus, v_locked, v_currency
      from public.balances b
      where b.user_id = p_user_id;

      return jsonb_build_object(
        'ok', true,
        'idempotent', true,
        'tx_id', v_existing_tx,
        'balance', coalesce(v_balance, 0),
        'bonus_balance', coalesce(v_bonus, 0),
        'locked_balance', coalesce(v_locked, 0),
        'currency', coalesce(v_currency, 'MXN')
      );
    end if;
  end if;

  insert into public.balances(
    user_id,
    balance,
    bonus_balance,
    locked_balance,
    commission_balance,
    currency
  )
  values (p_user_id, 0, 0, 0, 0, 'MXN')
  on conflict (user_id) do nothing;

  select b.balance, b.bonus_balance, b.locked_balance, b.currency
  into v_balance, v_bonus, v_locked, v_currency
  from public.balances b
  where b.user_id = p_user_id
  for update;

  v_balance := coalesce(v_balance, 0);
  v_bonus := coalesce(v_bonus, 0);
  v_locked := coalesce(v_locked, 0);
  v_currency := coalesce(v_currency, 'MXN');

  v_new_balance := v_balance + coalesce(p_delta_balance, 0);
  v_new_bonus := v_bonus + coalesce(p_delta_bonus, 0);
  v_new_locked := v_locked + coalesce(p_delta_locked, 0);

  if v_new_balance < 0 then
    raise exception 'INSUFFICIENT_BALANCE';
  end if;

  if v_new_bonus < 0 then
    raise exception 'INSUFFICIENT_BONUS';
  end if;

  if v_new_locked < 0 then
    raise exception 'INSUFFICIENT_LOCKED';
  end if;

  v_type :=
    case
      when lower(coalesce(p_reason, '')) like '%deposit%' then 'deposit'::transaction_type
      when lower(coalesce(p_reason, '')) like '%withdraw%' then 'withdraw'::transaction_type
      when lower(coalesce(p_reason, '')) like '%bet%' then 'bet'::transaction_type
      when lower(coalesce(p_reason, '')) like '%win%' then 'win'::transaction_type
      when lower(coalesce(p_reason, '')) like '%cashback%' then 'bonus'::transaction_type
      when lower(coalesce(p_reason, '')) like '%promo%' then 'bonus'::transaction_type
      when lower(coalesce(p_reason, '')) like '%free_round%' then 'bonus'::transaction_type
      when lower(coalesce(p_reason, '')) like '%bonus%' then 'bonus'::transaction_type
      when lower(coalesce(p_reason, '')) like '%release%' then 'bonus'::transaction_type
      else 'adjustment'::transaction_type
    end;

  begin
    v_method := public.pick_transaction_method(coalesce(p_method, 'manual'));
  exception
    when others then
      v_method := 'manual'::transaction_method;
  end;

  update public.balances
  set balance = round(v_new_balance, 2),
      bonus_balance = round(v_new_bonus, 2),
      locked_balance = round(v_new_locked, 2),
      updated_at = now()
  where user_id = p_user_id;

  update public.profiles
  set balance = round(v_new_balance, 2),
      updated_at = now()
  where id = p_user_id;

  v_tx_id := gen_random_uuid();
  v_amount := round(coalesce(nullif(p_delta_balance, 0), nullif(p_delta_bonus, 0), nullif(p_delta_locked, 0), 0), 2);

  insert into public.transactions(
    id,
    user_id,
    amount,
    type,
    status,
    method,
    reason,
    ref_id,
    metadata,
    created_at,
    updated_at
  )
  values (
    v_tx_id,
    p_user_id,
    v_amount,
    v_type,
    'completed'::transaction_status,
    v_method,
    p_reason,
    p_ref_id,
    coalesce(p_metadata, '{}'::jsonb),
    now(),
    now()
  );

  return jsonb_build_object(
    'ok', true,
    'idempotent', false,
    'tx_id', v_tx_id,
    'balance', round(v_new_balance, 2),
    'bonus_balance', round(v_new_bonus, 2),
    'locked_balance', round(v_new_locked, 2),
    'currency', v_currency
  );
end;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: affiliate_clicks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.affiliate_clicks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    affiliate_user_id uuid,
    code text,
    ip_hash text,
    user_agent text,
    referer text,
    metadata jsonb
);


--
-- Name: affiliate_commissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.affiliate_commissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    affiliate_user_id uuid,
    referred_user_id uuid,
    amount numeric(12,2) DEFAULT 0 NOT NULL,
    reason text DEFAULT 'commission'::text NOT NULL,
    ref_id text,
    status text DEFAULT 'credited'::text NOT NULL,
    metadata jsonb,
    CONSTRAINT affiliate_commissions_ref_id_nonempty_chk CHECK (((ref_id IS NULL) OR (btrim(ref_id) <> ''::text)))
);


--
-- Name: affiliate_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.affiliate_profiles (
    user_id uuid NOT NULL,
    kind text DEFAULT 'player'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    commission_rate numeric DEFAULT 0.05 NOT NULL,
    referral_code text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


--
-- Name: affiliate_referrals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.affiliate_referrals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    referrer_id uuid NOT NULL,
    referred_user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    first_deposit_amount numeric,
    first_deposit_at timestamp with time zone,
    status text DEFAULT 'tracked'::text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    affiliate_user_id uuid,
    total_deposited numeric(12,2) DEFAULT 0 NOT NULL,
    total_commission numeric(12,2) DEFAULT 0 NOT NULL
);


--
-- Name: affiliates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.affiliates (
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    code text,
    status text DEFAULT 'active'::text NOT NULL
);


--
-- Name: agent_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id text DEFAULT 'global'::text NOT NULL,
    node_id text NOT NULL,
    agent_name text NOT NULL,
    level text DEFAULT 'info'::text NOT NULL,
    message text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: agis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agis (
    id text NOT NULL,
    name text,
    description text,
    version text,
    tags text[] DEFAULT '{}'::text[] NOT NULL,
    meta jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: balances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.balances (
    user_id uuid NOT NULL,
    balance numeric DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    bonus_balance numeric DEFAULT 0 NOT NULL,
    locked_balance numeric DEFAULT 0 NOT NULL,
    currency text DEFAULT 'MXN'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    commission_balance numeric DEFAULT 0 NOT NULL
);


--
-- Name: bets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    game_id uuid,
    amount numeric(12,2) NOT NULL,
    cashout_point numeric(10,2),
    profit numeric(12,2),
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT bets_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'won'::text, 'lost'::text])))
);


--
-- Name: cashback_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cashback_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    loss_amount numeric NOT NULL,
    rate numeric NOT NULL,
    cashback_amount numeric NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    ref_id text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


--
-- Name: cashback_tiers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cashback_tiers (
    id bigint NOT NULL,
    min_deposit numeric NOT NULL,
    rate numeric NOT NULL,
    label text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: cashback_tiers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cashback_tiers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cashback_tiers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cashback_tiers_id_seq OWNED BY public.cashback_tiers.id;


--
-- Name: casino_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.casino_settings (
    id integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    cashback_daily_cap numeric DEFAULT 200 NOT NULL,
    cashback_weekly_cap numeric DEFAULT 700 NOT NULL,
    cashback_lookback_days integer DEFAULT 7 NOT NULL,
    cashback_wager_multiplier numeric DEFAULT 10 NOT NULL,
    free_rounds_wager_multiplier numeric DEFAULT 35 NOT NULL,
    promo_bonus_wager_multiplier numeric DEFAULT 35 NOT NULL
);


--
-- Name: command_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.command_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    command_id uuid,
    level text DEFAULT 'info'::text,
    message text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: commands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.commands (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id text NOT NULL,
    node_id text NOT NULL,
    command text NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    result jsonb,
    error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    executed_at timestamp with time zone,
    completed_at timestamp with time zone,
    started_at timestamp with time zone,
    finished_at timestamp with time zone
);


--
-- Name: crash_bets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crash_bets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    bet_amount numeric NOT NULL,
    target_multiplier numeric NOT NULL,
    crash_multiplier numeric NOT NULL,
    did_cashout boolean DEFAULT false NOT NULL,
    payout numeric DEFAULT 0 NOT NULL,
    ref_id text,
    server_seed_hash text,
    server_seed text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: deposit_intents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deposit_intents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    provider text DEFAULT 'manual'::text NOT NULL,
    method text,
    amount numeric NOT NULL,
    currency text DEFAULT 'MXN'::text NOT NULL,
    status text DEFAULT 'created'::text NOT NULL,
    external_id text,
    checkout_url text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    intent_id text,
    provider_payload jsonb,
    bonus_applied boolean DEFAULT false NOT NULL,
    free_spins_awarded integer DEFAULT 0 NOT NULL
);


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id text NOT NULL,
    node_id text,
    level text DEFAULT 'info'::text NOT NULL,
    type text NOT NULL,
    message text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: fraud_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fraud_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    event_type text NOT NULL,
    ip_hash text,
    device_hash text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


--
-- Name: free_round_entitlements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.free_round_entitlements (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    game text DEFAULT 'crash'::text NOT NULL,
    remaining integer DEFAULT 0 NOT NULL,
    source text DEFAULT 'deposit'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


--
-- Name: free_round_entitlements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.free_round_entitlements_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: free_round_entitlements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.free_round_entitlements_id_seq OWNED BY public.free_round_entitlements.id;


--
-- Name: free_round_tiers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.free_round_tiers (
    id bigint NOT NULL,
    min_deposit numeric NOT NULL,
    free_rounds integer NOT NULL,
    label text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: free_round_tiers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.free_round_tiers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: free_round_tiers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.free_round_tiers_id_seq OWNED BY public.free_round_tiers.id;


--
-- Name: game_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.game_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    game_type text NOT NULL,
    crash_point numeric(10,2),
    server_seed text NOT NULL,
    client_seed text,
    hash text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: hocker_agent_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hocker_agent_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    node_id text NOT NULL,
    agent_name text NOT NULL,
    level text DEFAULT 'info'::text,
    message text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT hocker_agent_logs_level_check CHECK ((level = ANY (ARRAY['info'::text, 'warning'::text, 'error'::text, 'critical'::text])))
);


--
-- Name: kyc_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kyc_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    reviewed_at timestamp with time zone,
    review_note text,
    id_front_path text,
    id_back_path text,
    selfie_path text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


--
-- Name: manual_deposit_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.manual_deposit_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    folio text DEFAULT public.generate_folio('MD'::text) NOT NULL,
    amount numeric NOT NULL,
    currency text DEFAULT 'MXN'::text NOT NULL,
    method text DEFAULT 'spei'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    receipt_url text,
    instructions jsonb DEFAULT '{}'::jsonb NOT NULL,
    reviewed_at timestamp with time zone,
    reviewed_by text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: node_heartbeats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.node_heartbeats (
    node_id text NOT NULL,
    last_seen_at timestamp with time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'online'::text,
    meta jsonb DEFAULT '{}'::jsonb
);


--
-- Name: nodes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nodes (
    id text NOT NULL,
    project_id text NOT NULL,
    name text,
    type text DEFAULT 'agent'::text NOT NULL,
    status text DEFAULT 'offline'::text NOT NULL,
    last_seen_at timestamp with time zone,
    tags text[] DEFAULT '{}'::text[] NOT NULL,
    meta jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: nova_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nova_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id text NOT NULL,
    thread_id text NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: nova_threads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nova_threads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    thread_id uuid NOT NULL,
    project_id text DEFAULT 'global'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text,
    role text DEFAULT 'user'::text,
    balance numeric(12,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    user_id uuid NOT NULL,
    username text,
    avatar_url text,
    kyc_status text DEFAULT 'unverified'::text NOT NULL,
    vip_level text DEFAULT 'verde'::text NOT NULL,
    xp integer DEFAULT 0 NOT NULL,
    cashback_day date,
    cashback_day_total numeric DEFAULT 0 NOT NULL,
    cashback_week_start date,
    cashback_week_total numeric DEFAULT 0 NOT NULL,
    last_deposit_amount numeric DEFAULT 0 NOT NULL,
    last_deposit_at timestamp with time zone,
    wager_required numeric DEFAULT 0 NOT NULL,
    wager_progress numeric DEFAULT 0 NOT NULL,
    referral_code text,
    referred_by uuid,
    crash_nonce bigint DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    free_spins integer DEFAULT 0 NOT NULL,
    full_name text,
    self_excluded_until timestamp with time zone,
    self_excluded_at timestamp with time zone,
    self_excluded_reason text,
    CONSTRAINT profiles_balance_check CHECK ((balance >= (0)::numeric)),
    CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['user'::text, 'admin'::text])))
);


--
-- Name: project_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id text DEFAULT 'hocker-one'::text,
    user_id uuid,
    role text DEFAULT 'viewer'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id text NOT NULL,
    name text NOT NULL,
    meta jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: promo_claims; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promo_claims (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    offer_id uuid NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    claimed_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,
    bonus_awarded numeric DEFAULT 0 NOT NULL,
    free_rounds_awarded integer DEFAULT 0 NOT NULL,
    wagering_required numeric DEFAULT 0 NOT NULL,
    wagering_progress numeric DEFAULT 0 NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


--
-- Name: promo_offers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promo_offers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    starts_at timestamp with time zone,
    ends_at timestamp with time zone,
    min_deposit numeric DEFAULT 0 NOT NULL,
    bonus_percent numeric DEFAULT 0 NOT NULL,
    max_bonus numeric DEFAULT 0 NOT NULL,
    free_rounds integer DEFAULT 0 NOT NULL,
    wagering_multiplier numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: slot_spins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.slot_spins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    bet_amount numeric NOT NULL,
    payout_amount numeric DEFAULT 0 NOT NULL,
    multiplier numeric DEFAULT 0 NOT NULL,
    reels jsonb,
    server_seed_hash text,
    server_seed text,
    client_seed text,
    nonce bigint,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: supply_order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supply_order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id text NOT NULL,
    order_id uuid NOT NULL,
    product_id uuid,
    qty integer DEFAULT 1 NOT NULL,
    unit_price_cents integer DEFAULT 0 NOT NULL,
    line_total_cents integer DEFAULT 0 NOT NULL,
    currency text DEFAULT 'MXN'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: supply_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supply_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id text NOT NULL,
    customer_name text,
    customer_phone text,
    total_cents integer DEFAULT 0 NOT NULL,
    currency text DEFAULT 'MXN'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    meta jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT supply_orders_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'producing'::text, 'shipped'::text, 'delivered'::text, 'canceled'::text])))
);


--
-- Name: supply_products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supply_products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id text NOT NULL,
    sku text,
    name text NOT NULL,
    description text,
    price_cents integer DEFAULT 0 NOT NULL,
    cost_cents integer DEFAULT 0 NOT NULL,
    currency text DEFAULT 'MXN'::text NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    meta jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: system_controls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_controls (
    id text NOT NULL,
    project_id text NOT NULL,
    kill_switch boolean DEFAULT false NOT NULL,
    allow_write boolean DEFAULT false NOT NULL,
    meta jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    amount numeric(12,2) NOT NULL,
    provider_id text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    type public.transaction_type,
    status public.transaction_status,
    method public.transaction_method,
    reason text,
    ref_id text,
    metadata jsonb
);


--
-- Name: transactions_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_audit (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    transaction_id uuid,
    changed_by text,
    action text,
    payload jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: withdraw_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.withdraw_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    amount numeric NOT NULL,
    currency text DEFAULT 'MXN'::text NOT NULL,
    method text DEFAULT 'spei'::text NOT NULL,
    destination text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    provider text DEFAULT 'manual'::text NOT NULL,
    external_id text,
    clabe text,
    beneficiary text,
    provider_payload jsonb DEFAULT '{}'::jsonb NOT NULL
);


--
-- Name: cashback_tiers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cashback_tiers ALTER COLUMN id SET DEFAULT nextval('public.cashback_tiers_id_seq'::regclass);


--
-- Name: free_round_entitlements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.free_round_entitlements ALTER COLUMN id SET DEFAULT nextval('public.free_round_entitlements_id_seq'::regclass);


--
-- Name: free_round_tiers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.free_round_tiers ALTER COLUMN id SET DEFAULT nextval('public.free_round_tiers_id_seq'::regclass);


--
-- Name: affiliate_clicks affiliate_clicks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affiliate_clicks
    ADD CONSTRAINT affiliate_clicks_pkey PRIMARY KEY (id);


--
-- Name: affiliate_commissions affiliate_commissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affiliate_commissions
    ADD CONSTRAINT affiliate_commissions_pkey PRIMARY KEY (id);


--
-- Name: affiliate_profiles affiliate_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affiliate_profiles
    ADD CONSTRAINT affiliate_profiles_pkey PRIMARY KEY (user_id);


--
-- Name: affiliate_referrals affiliate_referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affiliate_referrals
    ADD CONSTRAINT affiliate_referrals_pkey PRIMARY KEY (id);


--
-- Name: affiliates affiliates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affiliates
    ADD CONSTRAINT affiliates_pkey PRIMARY KEY (user_id);


--
-- Name: agent_logs agent_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_logs
    ADD CONSTRAINT agent_logs_pkey PRIMARY KEY (id);


--
-- Name: agis agis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agis
    ADD CONSTRAINT agis_pkey PRIMARY KEY (id);


--
-- Name: balances balances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.balances
    ADD CONSTRAINT balances_pkey PRIMARY KEY (user_id);


--
-- Name: bets bets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bets
    ADD CONSTRAINT bets_pkey PRIMARY KEY (id);


--
-- Name: cashback_events cashback_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cashback_events
    ADD CONSTRAINT cashback_events_pkey PRIMARY KEY (id);


--
-- Name: cashback_tiers cashback_tiers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cashback_tiers
    ADD CONSTRAINT cashback_tiers_pkey PRIMARY KEY (id);


--
-- Name: casino_settings casino_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.casino_settings
    ADD CONSTRAINT casino_settings_pkey PRIMARY KEY (id);


--
-- Name: command_logs command_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.command_logs
    ADD CONSTRAINT command_logs_pkey PRIMARY KEY (id);


--
-- Name: commands commands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commands
    ADD CONSTRAINT commands_pkey PRIMARY KEY (id);


--
-- Name: crash_bets crash_bets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crash_bets
    ADD CONSTRAINT crash_bets_pkey PRIMARY KEY (id);


--
-- Name: deposit_intents deposit_intents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deposit_intents
    ADD CONSTRAINT deposit_intents_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: fraud_events fraud_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fraud_events
    ADD CONSTRAINT fraud_events_pkey PRIMARY KEY (id);


--
-- Name: free_round_entitlements free_round_entitlements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.free_round_entitlements
    ADD CONSTRAINT free_round_entitlements_pkey PRIMARY KEY (id);


--
-- Name: free_round_tiers free_round_tiers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.free_round_tiers
    ADD CONSTRAINT free_round_tiers_pkey PRIMARY KEY (id);


--
-- Name: game_history game_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_history
    ADD CONSTRAINT game_history_pkey PRIMARY KEY (id);


--
-- Name: hocker_agent_logs hocker_agent_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hocker_agent_logs
    ADD CONSTRAINT hocker_agent_logs_pkey PRIMARY KEY (id);


--
-- Name: kyc_requests kyc_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kyc_requests
    ADD CONSTRAINT kyc_requests_pkey PRIMARY KEY (id);


--
-- Name: manual_deposit_requests manual_deposit_requests_folio_uniq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manual_deposit_requests
    ADD CONSTRAINT manual_deposit_requests_folio_uniq UNIQUE (folio);


--
-- Name: manual_deposit_requests manual_deposit_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manual_deposit_requests
    ADD CONSTRAINT manual_deposit_requests_pkey PRIMARY KEY (id);


--
-- Name: node_heartbeats node_heartbeats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.node_heartbeats
    ADD CONSTRAINT node_heartbeats_pkey PRIMARY KEY (node_id);


--
-- Name: nodes nodes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nodes
    ADD CONSTRAINT nodes_pkey PRIMARY KEY (id);


--
-- Name: nova_messages nova_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nova_messages
    ADD CONSTRAINT nova_messages_pkey PRIMARY KEY (id);


--
-- Name: nova_threads nova_threads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nova_threads
    ADD CONSTRAINT nova_threads_pkey PRIMARY KEY (id);


--
-- Name: nova_threads nova_threads_thread_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nova_threads
    ADD CONSTRAINT nova_threads_thread_id_key UNIQUE (thread_id);


--
-- Name: profiles profiles_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_email_key UNIQUE (email);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: project_members project_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT project_members_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: promo_claims promo_claims_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_claims
    ADD CONSTRAINT promo_claims_pkey PRIMARY KEY (id);


--
-- Name: promo_offers promo_offers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_offers
    ADD CONSTRAINT promo_offers_pkey PRIMARY KEY (id);


--
-- Name: slot_spins slot_spins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.slot_spins
    ADD CONSTRAINT slot_spins_pkey PRIMARY KEY (id);


--
-- Name: supply_order_items supply_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supply_order_items
    ADD CONSTRAINT supply_order_items_pkey PRIMARY KEY (id);


--
-- Name: supply_orders supply_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supply_orders
    ADD CONSTRAINT supply_orders_pkey PRIMARY KEY (id);


--
-- Name: supply_products supply_products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supply_products
    ADD CONSTRAINT supply_products_pkey PRIMARY KEY (id);


--
-- Name: system_controls system_controls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_controls
    ADD CONSTRAINT system_controls_pkey PRIMARY KEY (id);


--
-- Name: transactions_audit transactions_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_audit
    ADD CONSTRAINT transactions_audit_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_new_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_new_pkey PRIMARY KEY (id);


--
-- Name: withdraw_requests withdraw_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.withdraw_requests
    ADD CONSTRAINT withdraw_requests_pkey PRIMARY KEY (id);


--
-- Name: affiliate_clicks_affiliate_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX affiliate_clicks_affiliate_user_idx ON public.affiliate_clicks USING btree (affiliate_user_id);


--
-- Name: affiliate_clicks_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX affiliate_clicks_created_idx ON public.affiliate_clicks USING btree (created_at);


--
-- Name: affiliate_commissions_affiliate_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX affiliate_commissions_affiliate_user_id_idx ON public.affiliate_commissions USING btree (affiliate_user_id);


--
-- Name: affiliate_commissions_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX affiliate_commissions_created_idx ON public.affiliate_commissions USING btree (created_at);


--
-- Name: affiliate_commissions_ref_id_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX affiliate_commissions_ref_id_uidx ON public.affiliate_commissions USING btree (ref_id) WHERE (ref_id IS NOT NULL);


--
-- Name: affiliate_referral_code_uniq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX affiliate_referral_code_uniq ON public.affiliate_profiles USING btree (referral_code);


--
-- Name: affiliate_referrals_affiliate_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX affiliate_referrals_affiliate_user_id_idx ON public.affiliate_referrals USING btree (affiliate_user_id);


--
-- Name: affiliate_referrals_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX affiliate_referrals_created_idx ON public.affiliate_referrals USING btree (created_at);


--
-- Name: affiliate_referrals_pair_uniq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX affiliate_referrals_pair_uniq ON public.affiliate_referrals USING btree (affiliate_user_id, referred_user_id) WHERE ((affiliate_user_id IS NOT NULL) AND (referred_user_id IS NOT NULL));


--
-- Name: affiliate_referrals_referred_uniq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX affiliate_referrals_referred_uniq ON public.affiliate_referrals USING btree (referred_user_id);


--
-- Name: affiliate_referrals_referred_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX affiliate_referrals_referred_user_id_idx ON public.affiliate_referrals USING btree (referred_user_id);


--
-- Name: affiliate_referrals_referrer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX affiliate_referrals_referrer_id_idx ON public.affiliate_referrals USING btree (referrer_id);


--
-- Name: affiliates_code_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX affiliates_code_uidx ON public.affiliates USING btree (code);


--
-- Name: agent_logs_node_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agent_logs_node_created_idx ON public.agent_logs USING btree (node_id, created_at DESC);


--
-- Name: agent_logs_project_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agent_logs_project_created_idx ON public.agent_logs USING btree (project_id, created_at DESC);


--
-- Name: balances_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX balances_updated_at_idx ON public.balances USING btree (updated_at);


--
-- Name: bets_game_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX bets_game_id_idx ON public.bets USING btree (game_id);


--
-- Name: bets_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX bets_user_id_idx ON public.bets USING btree (user_id);


--
-- Name: cashback_events_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cashback_events_user_id_idx ON public.cashback_events USING btree (user_id);


--
-- Name: cashback_tiers_min_deposit_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cashback_tiers_min_deposit_idx ON public.cashback_tiers USING btree (min_deposit);


--
-- Name: crash_bets_user_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX crash_bets_user_created_idx ON public.crash_bets USING btree (user_id, created_at DESC);


--
-- Name: deposit_intents_intent_id_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX deposit_intents_intent_id_uidx ON public.deposit_intents USING btree (intent_id);


--
-- Name: deposit_intents_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX deposit_intents_status_idx ON public.deposit_intents USING btree (status);


--
-- Name: deposit_intents_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX deposit_intents_user_idx ON public.deposit_intents USING btree (user_id);


--
-- Name: fraud_events_user_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fraud_events_user_created_idx ON public.fraud_events USING btree (user_id, created_at DESC);


--
-- Name: free_round_entitlements_game_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX free_round_entitlements_game_idx ON public.free_round_entitlements USING btree (game);


--
-- Name: free_round_entitlements_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX free_round_entitlements_user_id_idx ON public.free_round_entitlements USING btree (user_id);


--
-- Name: idx_commands_node; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_commands_node ON public.commands USING btree (node_id);


--
-- Name: idx_commands_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_commands_project ON public.commands USING btree (project_id);


--
-- Name: idx_commands_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_commands_status ON public.commands USING btree (status);


--
-- Name: idx_messages_project_thread; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_project_thread ON public.nova_messages USING btree (project_id, thread_id);


--
-- Name: idx_profiles_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_created_at ON public.profiles USING btree (created_at);


--
-- Name: idx_transactions_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_type ON public.transactions USING btree (type);


--
-- Name: kyc_requests_user_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX kyc_requests_user_created_idx ON public.kyc_requests USING btree (user_id, created_at DESC);


--
-- Name: manual_deposit_requests_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX manual_deposit_requests_user_idx ON public.manual_deposit_requests USING btree (user_id);


--
-- Name: manual_deposit_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX manual_deposit_status_idx ON public.manual_deposit_requests USING btree (status);


--
-- Name: nodes_project_id_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX nodes_project_id_id_idx ON public.nodes USING btree (project_id, id);


--
-- Name: profiles_referral_code_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX profiles_referral_code_uidx ON public.profiles USING btree (referral_code) WHERE (referral_code IS NOT NULL);


--
-- Name: profiles_referral_code_uniq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX profiles_referral_code_uniq ON public.profiles USING btree (referral_code) WHERE (referral_code IS NOT NULL);


--
-- Name: profiles_referred_by_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX profiles_referred_by_idx ON public.profiles USING btree (referred_by);


--
-- Name: profiles_user_id_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX profiles_user_id_uidx ON public.profiles USING btree (user_id);


--
-- Name: promo_claims_offer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX promo_claims_offer_id_idx ON public.promo_claims USING btree (offer_id);


--
-- Name: promo_claims_one_active_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX promo_claims_one_active_uidx ON public.promo_claims USING btree (user_id) WHERE (status = ANY (ARRAY['active'::text, 'applied'::text]));


--
-- Name: promo_claims_user_claimed_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX promo_claims_user_claimed_idx ON public.promo_claims USING btree (user_id, claimed_at DESC);


--
-- Name: promo_claims_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX promo_claims_user_idx ON public.promo_claims USING btree (user_id);


--
-- Name: promo_offers_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX promo_offers_active_idx ON public.promo_offers USING btree (active);


--
-- Name: promo_offers_slug_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX promo_offers_slug_uidx ON public.promo_offers USING btree (slug);


--
-- Name: slot_spins_user_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX slot_spins_user_created_idx ON public.slot_spins USING btree (user_id, created_at DESC);


--
-- Name: transactions_ref_id_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX transactions_ref_id_uidx ON public.transactions USING btree (ref_id) WHERE (ref_id IS NOT NULL);


--
-- Name: transactions_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_user_id_created_at_idx ON public.transactions USING btree (user_id, created_at DESC);


--
-- Name: withdraw_requests_external_id_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX withdraw_requests_external_id_uidx ON public.withdraw_requests USING btree (external_id) WHERE (external_id IS NOT NULL);


--
-- Name: withdraw_requests_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX withdraw_requests_status_idx ON public.withdraw_requests USING btree (status);


--
-- Name: withdraw_requests_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX withdraw_requests_user_id_created_at_idx ON public.withdraw_requests USING btree (user_id, created_at DESC);


--
-- Name: affiliate_profiles trg_affiliate_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_affiliate_profiles_updated_at BEFORE UPDATE ON public.affiliate_profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();


--
-- Name: transactions trg_audit_transactions; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_audit_transactions AFTER INSERT ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.audit_transaction_trigger();


--
-- Name: balances trg_balances_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_balances_updated_at BEFORE UPDATE ON public.balances FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: casino_settings trg_casino_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_casino_settings_updated_at BEFORE UPDATE ON public.casino_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: deposit_intents trg_deposit_intents_normalize_ids; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_deposit_intents_normalize_ids BEFORE INSERT OR UPDATE ON public.deposit_intents FOR EACH ROW EXECUTE FUNCTION public.deposit_intents_normalize_ids();


--
-- Name: deposit_intents trg_deposit_intents_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_deposit_intents_updated_at BEFORE UPDATE ON public.deposit_intents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: kyc_requests trg_kyc_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_kyc_requests_updated_at BEFORE UPDATE ON public.kyc_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: manual_deposit_requests trg_manual_deposit_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_manual_deposit_requests_updated_at BEFORE UPDATE ON public.manual_deposit_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: profiles trg_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: casino_settings trg_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_settings_updated_at BEFORE UPDATE ON public.casino_settings FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();


--
-- Name: transactions trg_transactions_insert_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_transactions_insert_audit AFTER INSERT ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.transactions_insert_audit_trigger();


--
-- Name: withdraw_requests trg_withdraw_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_withdraw_requests_updated_at BEFORE UPDATE ON public.withdraw_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: transactions update_transactions_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_transactions_timestamp BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: affiliate_profiles affiliate_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affiliate_profiles
    ADD CONSTRAINT affiliate_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: affiliate_referrals affiliate_referrals_referred_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affiliate_referrals
    ADD CONSTRAINT affiliate_referrals_referred_user_id_fkey FOREIGN KEY (referred_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: affiliate_referrals affiliate_referrals_referrer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affiliate_referrals
    ADD CONSTRAINT affiliate_referrals_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: affiliates affiliates_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affiliates
    ADD CONSTRAINT affiliates_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: balances balances_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.balances
    ADD CONSTRAINT balances_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: bets bets_game_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bets
    ADD CONSTRAINT bets_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.game_history(id);


--
-- Name: bets bets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bets
    ADD CONSTRAINT bets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: cashback_events cashback_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cashback_events
    ADD CONSTRAINT cashback_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: command_logs command_logs_command_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.command_logs
    ADD CONSTRAINT command_logs_command_id_fkey FOREIGN KEY (command_id) REFERENCES public.commands(id) ON DELETE CASCADE;


--
-- Name: deposit_intents deposit_intents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deposit_intents
    ADD CONSTRAINT deposit_intents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: events events_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_node_id_fkey FOREIGN KEY (node_id) REFERENCES public.nodes(id) ON DELETE SET NULL;


--
-- Name: events events_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: free_round_entitlements free_round_entitlements_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.free_round_entitlements
    ADD CONSTRAINT free_round_entitlements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: manual_deposit_requests manual_deposit_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manual_deposit_requests
    ADD CONSTRAINT manual_deposit_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: nodes nodes_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nodes
    ADD CONSTRAINT nodes_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_referred_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_referred_by_fkey FOREIGN KEY (referred_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: project_members project_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT project_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: promo_claims promo_claims_offer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_claims
    ADD CONSTRAINT promo_claims_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES public.promo_offers(id) ON DELETE CASCADE;


--
-- Name: promo_claims promo_claims_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_claims
    ADD CONSTRAINT promo_claims_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: supply_order_items supply_order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supply_order_items
    ADD CONSTRAINT supply_order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.supply_orders(id) ON DELETE CASCADE;


--
-- Name: supply_order_items supply_order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supply_order_items
    ADD CONSTRAINT supply_order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.supply_products(id) ON DELETE SET NULL;


--
-- Name: supply_order_items supply_order_items_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supply_order_items
    ADD CONSTRAINT supply_order_items_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: supply_orders supply_orders_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supply_orders
    ADD CONSTRAINT supply_orders_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: supply_products supply_products_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supply_products
    ADD CONSTRAINT supply_products_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: system_controls system_controls_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_controls
    ADD CONSTRAINT system_controls_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_new_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_new_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: withdraw_requests withdraw_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.withdraw_requests
    ADD CONSTRAINT withdraw_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: hocker_agent_logs Agents Full Access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Agents Full Access" ON public.hocker_agent_logs TO service_role USING (true) WITH CHECK (true);


--
-- Name: game_history Public Game History; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public Game History" ON public.game_history FOR SELECT USING (true);


--
-- Name: bets User Bets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "User Bets" ON public.bets FOR SELECT TO authenticated USING ((user_id = ( SELECT auth.uid() AS uid)));


--
-- Name: bets User Insert Bets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "User Insert Bets" ON public.bets FOR INSERT TO authenticated WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));


--
-- Name: affiliate_clicks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

--
-- Name: affiliate_clicks affiliate_clicks_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY affiliate_clicks_select_own ON public.affiliate_clicks FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = affiliate_user_id));


--
-- Name: affiliate_clicks affiliate_clicks_service_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY affiliate_clicks_service_all ON public.affiliate_clicks TO service_role USING (true) WITH CHECK (true);


--
-- Name: affiliate_commissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;

--
-- Name: affiliate_commissions affiliate_commissions_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY affiliate_commissions_select_own ON public.affiliate_commissions FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = affiliate_user_id));


--
-- Name: affiliate_commissions affiliate_commissions_service_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY affiliate_commissions_service_all ON public.affiliate_commissions TO service_role USING (true) WITH CHECK (true);


--
-- Name: affiliate_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.affiliate_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: affiliate_profiles affiliate_profiles_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY affiliate_profiles_select_own ON public.affiliate_profiles FOR SELECT USING ((user_id = ( SELECT auth.uid() AS uid)));


--
-- Name: affiliate_profiles affiliate_profiles_service_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY affiliate_profiles_service_all ON public.affiliate_profiles TO service_role USING (true) WITH CHECK (true);


--
-- Name: affiliate_referrals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;

--
-- Name: affiliate_referrals affiliate_referrals_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY affiliate_referrals_select_own ON public.affiliate_referrals FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = affiliate_user_id));


--
-- Name: affiliate_referrals affiliate_referrals_service_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY affiliate_referrals_service_all ON public.affiliate_referrals TO service_role USING (true) WITH CHECK (true);


--
-- Name: affiliates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

--
-- Name: affiliates affiliates_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY affiliates_select_own ON public.affiliates FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: affiliates affiliates_service_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY affiliates_service_all ON public.affiliates TO service_role USING (true) WITH CHECK (true);


--
-- Name: agis; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agis ENABLE ROW LEVEL SECURITY;

--
-- Name: agis agis_insert_authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY agis_insert_authenticated ON public.agis FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: agis agis_select_authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY agis_select_authenticated ON public.agis FOR SELECT TO authenticated USING (true);


--
-- Name: agis agis_update_authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY agis_update_authenticated ON public.agis FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: commands allow_all_commands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_all_commands ON public.commands USING (true);


--
-- Name: node_heartbeats allow_all_heartbeats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_all_heartbeats ON public.node_heartbeats USING (true);


--
-- Name: balances; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.balances ENABLE ROW LEVEL SECURITY;

--
-- Name: balances balances_select_owner; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY balances_select_owner ON public.balances FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: balances balances_service_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY balances_service_all ON public.balances TO service_role USING (true) WITH CHECK (true);


--
-- Name: balances balances_update_owner; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY balances_update_owner ON public.balances FOR UPDATE TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: bets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;

--
-- Name: transactions block_delete_for_authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY block_delete_for_authenticated ON public.transactions FOR DELETE TO authenticated USING (false);


--
-- Name: transactions block_insert_for_authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY block_insert_for_authenticated ON public.transactions FOR INSERT TO authenticated WITH CHECK (false);


--
-- Name: transactions block_update_for_authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY block_update_for_authenticated ON public.transactions FOR UPDATE TO authenticated USING (false) WITH CHECK (false);


--
-- Name: cashback_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cashback_events ENABLE ROW LEVEL SECURITY;

--
-- Name: cashback_events cashback_events_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cashback_events_select_own ON public.cashback_events FOR SELECT USING ((user_id = ( SELECT auth.uid() AS uid)));


--
-- Name: cashback_events cashback_events_service_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cashback_events_service_all ON public.cashback_events TO service_role USING (true) WITH CHECK (true);


--
-- Name: cashback_tiers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cashback_tiers ENABLE ROW LEVEL SECURITY;

--
-- Name: cashback_tiers cashback_tiers_read_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cashback_tiers_read_all ON public.cashback_tiers FOR SELECT USING (true);


--
-- Name: cashback_tiers cashback_tiers_service_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cashback_tiers_service_all ON public.cashback_tiers TO service_role USING (true) WITH CHECK (true);


--
-- Name: casino_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.casino_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: casino_settings casino_settings_service_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY casino_settings_service_all ON public.casino_settings TO service_role USING (true) WITH CHECK (true);


--
-- Name: command_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.command_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: commands; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.commands ENABLE ROW LEVEL SECURITY;

--
-- Name: crash_bets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.crash_bets ENABLE ROW LEVEL SECURITY;

--
-- Name: crash_bets crash_bets_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY crash_bets_select_own ON public.crash_bets FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: crash_bets crash_bets_service_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY crash_bets_service_all ON public.crash_bets TO service_role USING (true) WITH CHECK (true);


--
-- Name: deposit_intents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.deposit_intents ENABLE ROW LEVEL SECURITY;

--
-- Name: deposit_intents deposit_intents_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY deposit_intents_select_own ON public.deposit_intents FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: deposit_intents deposit_intents_service_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY deposit_intents_service_all ON public.deposit_intents TO service_role USING (true) WITH CHECK (true);


--
-- Name: fraud_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fraud_events ENABLE ROW LEVEL SECURITY;

--
-- Name: fraud_events fraud_events_service_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fraud_events_service_all ON public.fraud_events TO service_role USING (true) WITH CHECK (true);


--
-- Name: free_round_entitlements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.free_round_entitlements ENABLE ROW LEVEL SECURITY;

--
-- Name: free_round_tiers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.free_round_tiers ENABLE ROW LEVEL SECURITY;

--
-- Name: free_round_tiers free_round_tiers_read_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY free_round_tiers_read_all ON public.free_round_tiers FOR SELECT USING (true);


--
-- Name: free_round_tiers free_round_tiers_service_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY free_round_tiers_service_all ON public.free_round_tiers TO service_role USING (true) WITH CHECK (true);


--
-- Name: free_round_entitlements free_rounds_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY free_rounds_select_own ON public.free_round_entitlements FOR SELECT USING ((user_id = ( SELECT auth.uid() AS uid)));


--
-- Name: free_round_entitlements free_rounds_service_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY free_rounds_service_all ON public.free_round_entitlements TO service_role USING (true) WITH CHECK (true);


--
-- Name: game_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.game_history ENABLE ROW LEVEL SECURITY;

--
-- Name: hocker_agent_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hocker_agent_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: kyc_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kyc_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: kyc_requests kyc_requests_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kyc_requests_insert_own ON public.kyc_requests FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: kyc_requests kyc_requests_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kyc_requests_select_own ON public.kyc_requests FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: kyc_requests kyc_requests_service_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kyc_requests_service_all ON public.kyc_requests TO service_role USING (true) WITH CHECK (true);


--
-- Name: kyc_requests kyc_requests_update_own_pending; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kyc_requests_update_own_pending ON public.kyc_requests FOR UPDATE TO authenticated USING (((( SELECT auth.uid() AS uid) = user_id) AND (status = 'pending'::text))) WITH CHECK (((( SELECT auth.uid() AS uid) = user_id) AND (status = 'pending'::text)));


--
-- Name: manual_deposit_requests manual_deposit_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY manual_deposit_insert_own ON public.manual_deposit_requests FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: manual_deposit_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.manual_deposit_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: manual_deposit_requests manual_deposit_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY manual_deposit_select_own ON public.manual_deposit_requests FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: manual_deposit_requests manual_deposit_service_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY manual_deposit_service_all ON public.manual_deposit_requests TO service_role USING (true) WITH CHECK (true);


--
-- Name: manual_deposit_requests mdr_service_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY mdr_service_all ON public.manual_deposit_requests TO service_role USING (true) WITH CHECK (true);


--
-- Name: node_heartbeats; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.node_heartbeats ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles profiles_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: profiles profiles_select_owner; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_select_owner ON public.profiles FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: profiles profiles_service_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_service_all ON public.profiles TO service_role USING (true) WITH CHECK (true);


--
-- Name: profiles profiles_service_full; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_service_full ON public.profiles TO service_role USING (true) WITH CHECK (true);


--
-- Name: profiles profiles_update_owner; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_update_owner ON public.profiles FOR UPDATE TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: promo_claims; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.promo_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: promo_claims promo_claims_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY promo_claims_insert_own ON public.promo_claims FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: promo_claims promo_claims_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY promo_claims_select_own ON public.promo_claims FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: promo_claims promo_claims_service_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY promo_claims_service_all ON public.promo_claims TO service_role USING (true) WITH CHECK (true);


--
-- Name: promo_claims promo_claims_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY promo_claims_update_own ON public.promo_claims FOR UPDATE TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: promo_offers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.promo_offers ENABLE ROW LEVEL SECURITY;

--
-- Name: promo_offers promo_offers_select_window; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY promo_offers_select_window ON public.promo_offers FOR SELECT TO authenticated, anon USING (((starts_at <= now()) AND ((ends_at IS NULL) OR (ends_at > now()))));


--
-- Name: promo_offers promo_offers_service_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY promo_offers_service_all ON public.promo_offers TO service_role USING (true) WITH CHECK (true);


--
-- Name: transactions_audit service_role_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY service_role_all ON public.transactions_audit TO service_role USING (true) WITH CHECK (true);


--
-- Name: slot_spins; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.slot_spins ENABLE ROW LEVEL SECURITY;

--
-- Name: slot_spins slot_spins_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY slot_spins_select_own ON public.slot_spins FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: slot_spins slot_spins_service_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY slot_spins_service_all ON public.slot_spins TO service_role USING (true) WITH CHECK (true);


--
-- Name: transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: transactions_audit; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.transactions_audit ENABLE ROW LEVEL SECURITY;

--
-- Name: transactions_audit transactions_audit_service_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY transactions_audit_service_all ON public.transactions_audit TO service_role USING (true) WITH CHECK (true);


--
-- Name: transactions transactions_select_owner; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY transactions_select_owner ON public.transactions FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: transactions transactions_service_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY transactions_service_all ON public.transactions TO service_role USING (true) WITH CHECK (true);


--
-- Name: withdraw_requests withdraw_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY withdraw_insert_own ON public.withdraw_requests FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: withdraw_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.withdraw_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: withdraw_requests withdraw_service_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY withdraw_service_all ON public.withdraw_requests TO service_role USING (true) WITH CHECK (true);


--
-- Name: withdraw_requests withdraws_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY withdraws_select_own ON public.withdraw_requests FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: withdraw_requests withdraws_service_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY withdraws_service_all ON public.withdraw_requests TO service_role USING (true) WITH CHECK (true);


--
-- Name: withdraw_requests wr_service_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY wr_service_all ON public.withdraw_requests TO service_role USING (true) WITH CHECK (true);


--
-- PostgreSQL database dump complete
--

\unrestrict Ygcq9STfsnyUCLCl9hleuHLRMouM7Ezn0G9TgIAk5aWb9UzgEoBjndE2OVraGkH

