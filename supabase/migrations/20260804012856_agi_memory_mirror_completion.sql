-- Complete Memory Mirror canonical fields, feeds and lifecycle functions.
alter table public.agi_memory_mirror add column if not exists agi_id text;
alter table public.agi_memory_mirror add column if not exists update_type text not null default 'agi_observation';
update public.agi_memory_mirror set agi_id=coalesce(public.canonical_agi_id(target_agi_ids[1]),public.canonical_agi_id(source_agi_id)) where agi_id is null or agi_id='';
update public.agi_memory_mirror set agi_id=public.canonical_agi_id(agi_id) where agi_id<>public.canonical_agi_id(agi_id);
alter table public.agi_memory_mirror drop constraint if exists agi_memory_mirror_update_type_check;
alter table public.agi_memory_mirror add constraint agi_memory_mirror_update_type_check check(update_type in ('policy_update','metric_learning','creative_trend','algorithm_change','error_prevention','platform_rule','internal_result','client_context','agi_observation'));
do $$ begin if not exists(select 1 from pg_constraint where conname='agi_memory_mirror_canonical_agi_id_fkey') then alter table public.agi_memory_mirror add constraint agi_memory_mirror_canonical_agi_id_fkey foreign key(agi_id) references public.agis(id) on update cascade on delete restrict; end if; end $$;
drop trigger if exists normalize_agi_id_before_write on public.agi_memory_mirror;
create trigger normalize_agi_id_before_write before insert or update of agi_id on public.agi_memory_mirror for each row execute function public.normalize_agi_id_before_write();
create unique index if not exists uq_agi_update_sources_project_name on public.agi_update_sources(project_id,source_name);
insert into public.agi_update_sources(project_id,source_name,source_type,source_platform,source_url,official_source,applies_to_agi_ids,applies_to_modules,polling_mode,trust_level,active,last_checked_at) select 'hocker-one','HOCKER AGI Canon 12.6C.1B','official_source','Hocker ONE / GitHub','https://github.com/HockerAGI/hocker.one/blob/main/docs/hocker/AGI_CANON_REAL_CONSOLIDATED.md',true,array_agg(a.id order by a.id),array(select distinct x from public.agis z cross join lateral jsonb_array_elements_text(z.meta->'modules') m(x) where z.id in ('nova','syntia','vertx','jurix','curvewind','numia','nova_ads','candy','pro_ia','hostia','trackhok','nexpa','chido_wins','chido_gerente','shadows','revia') order by x),'manual','official',true,now() from public.agis a where a.id in ('nova','syntia','vertx','jurix','curvewind','numia','nova_ads','candy','pro_ia','hostia','trackhok','nexpa','chido_wins','chido_gerente','shadows','revia') on conflict(project_id,source_name) do update set applies_to_agi_ids=excluded.applies_to_agi_ids,applies_to_modules=excluded.applies_to_modules,active=true,last_checked_at=now(),updated_at=now();
insert into public.agi_memory_mirror(project_id,agi_id,update_type,title,summary,category,source_agi_id,source_agi_name,target_agi_ids,target_modules,memory_payload,usefulness_score,safety_status,approved_by_nova,approved_by_syntia,approved_by_vertx,approved_by_jurix,active,created_by,source_hash,semantic_hash,canonical_memory_key,memory_version,source_type,source_name,source_url,source_platform,profile_id,confidence_score,freshness_score,valid_from,prevents_error,error_pattern,recommended_action,requires_owner_approval,last_seen_at,times_seen,retention_tier) select 'hocker-one',a.id,'internal_result','Perfil canónico · '||a.name,a.description,'agi_canon','syntia','SYNTIA',array[a.id],array(select jsonb_array_elements_text(a.meta->'modules')),a.meta||jsonb_build_object('agi_id',a.id,'agi_name',a.name,'canon_version','12.6C.1B','source_of_truth',true),5,'safe',true,true,true,true,true,'hocker-agi-canon-migration',encode(digest('hocker-agi-canon-12.6C.1B:'||a.id,'sha256'),'hex'),encode(digest(a.description||':'||a.meta::text,'sha256'),'hex'),'canon.profile.'||a.id||'.12_6c_1b',1,'official_source','HOCKER AGI Canon 12.6C.1B','https://github.com/HockerAGI/hocker.one/blob/main/docs/hocker/AGI_CANON_REAL_CONSOLIDATED.md','Hocker ONE / GitHub',a.id,5,5,now(),true,'profile_drift_or_alias_duplication','Use canonical profile, ID and specialized feed.',false,now(),1,'hot' from public.agis a where a.id in ('nova','syntia','vertx','jurix','curvewind','numia','nova_ads','candy','pro_ia','hostia','trackhok','nexpa','chido_wins','chido_gerente','shadows','revia') on conflict(project_id,canonical_memory_key) where canonical_memory_key is not null do update set agi_id=excluded.agi_id,update_type=excluded.update_type,title=excluded.title,summary=excluded.summary,target_agi_ids=excluded.target_agi_ids,target_modules=excluded.target_modules,memory_payload=excluded.memory_payload,approved_by_nova=true,approved_by_syntia=true,approved_by_vertx=true,approved_by_jurix=true,active=true,source_hash=excluded.source_hash,semantic_hash=excluded.semantic_hash,profile_id=excluded.profile_id,confidence_score=5,freshness_score=5,last_seen_at=now(),times_seen=agi_memory_mirror.times_seen+1,updated_at=now();
insert into public.agi_update_feed(project_id,agi_id,source_id,memory_mirror_id,title,summary,update_type,priority,status,profile_id,source_hash,semantic_hash,canonical_memory_key,valid_from,confidence_score,freshness_score,prevents_error,error_pattern,recommended_action,requires_owner_approval,retention_tier,seen_by_agi,applied_by_agi,applied_at,result_note,times_seen,last_seen_at) select 'hocker-one',m.agi_id,s.id,m.id,'Canon operativo · '||a.name,'Feed especializado: '||array_to_string(array(select jsonb_array_elements_text(a.meta->'memory_feed')),', '),'internal_result','high','active',m.agi_id,m.source_hash,m.semantic_hash,m.canonical_memory_key,now(),5,5,true,'profile_drift_or_alias_duplication','Apply only the specialized canonical profile.',false,'hot',true,true,now(),'Canon 12.6C.1B applied.',1,now() from public.agi_memory_mirror m join public.agis a on a.id=m.agi_id cross join lateral(select id from public.agi_update_sources where project_id='hocker-one' and source_name='HOCKER AGI Canon 12.6C.1B' limit 1)s where m.project_id='hocker-one' and m.canonical_memory_key like 'canon.profile.%.12_6c_1b' on conflict(project_id,agi_id,canonical_memory_key) where canonical_memory_key is not null do update set source_id=excluded.source_id,memory_mirror_id=excluded.memory_mirror_id,title=excluded.title,summary=excluded.summary,status='active',profile_id=excluded.profile_id,source_hash=excluded.source_hash,semantic_hash=excluded.semantic_hash,confidence_score=5,freshness_score=5,seen_by_agi=true,applied_by_agi=true,applied_at=now(),result_note=excluded.result_note,times_seen=agi_update_feed.times_seen+1,last_seen_at=now(),updated_at=now();

create or replace function public.distribute_agi_memory(p_memory_id uuid)
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare m public.agi_memory_mirror%rowtype; target text; affected integer:=0;
begin
 select * into m from public.agi_memory_mirror where id=p_memory_id for update;
 if not found then raise exception 'MEMORY_NOT_FOUND'; end if;
 if not m.active or m.safety_status='blocked' or not(m.approved_by_nova and m.approved_by_syntia and m.approved_by_vertx and m.approved_by_jurix) then raise exception 'MEMORY_NOT_APPROVED'; end if;
 foreach target in array m.target_agi_ids loop
  target:=public.canonical_agi_id(target);
  if target='' then continue; end if;
  insert into public.agi_update_feed(project_id,agi_id,memory_mirror_id,title,summary,update_type,priority,status,client_id,brand_id,campaign_id,content_id,profile_id,source_hash,semantic_hash,canonical_memory_key,valid_from,expires_at,confidence_score,freshness_score,prevents_error,error_pattern,recommended_action,requires_owner_approval,retention_tier,last_seen_at)
  values(m.project_id,target,m.id,m.title,m.summary,m.update_type,case when m.requires_owner_approval then 'high' else 'medium' end,'active',m.client_id,m.brand_id,m.campaign_id,m.content_id,m.profile_id,m.source_hash,m.semantic_hash,m.canonical_memory_key,m.valid_from,m.expires_at,m.confidence_score,m.freshness_score,m.prevents_error,m.error_pattern,m.recommended_action,m.requires_owner_approval,m.retention_tier,now())
  on conflict(project_id,agi_id,canonical_memory_key) where canonical_memory_key is not null do update set memory_mirror_id=excluded.memory_mirror_id,title=excluded.title,summary=excluded.summary,update_type=excluded.update_type,status='active',expires_at=excluded.expires_at,confidence_score=excluded.confidence_score,freshness_score=excluded.freshness_score,times_seen=agi_update_feed.times_seen+1,last_seen_at=now(),updated_at=now();
  affected:=affected+1;
 end loop;
 return affected;
end; $$;

create or replace function public.expire_agi_memory(p_project_id text default 'hocker-one')
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare affected integer;
begin
 update public.agi_memory_mirror set active=false,retention_tier='archive',archived_at=coalesce(archived_at,now()),updated_at=now() where project_id=p_project_id and active and expires_at is not null and expires_at<=now();
 get diagnostics affected=row_count;
 update public.agi_update_feed set status='expired',retention_tier='archive',updated_at=now() where project_id=p_project_id and status='active' and expires_at is not null and expires_at<=now();
 return affected;
end; $$;
revoke all on function public.distribute_agi_memory(uuid) from public,anon,authenticated;
revoke all on function public.expire_agi_memory(text) from public,anon,authenticated;
grant execute on function public.distribute_agi_memory(uuid) to service_role;
grant execute on function public.expire_agi_memory(text) to service_role;
