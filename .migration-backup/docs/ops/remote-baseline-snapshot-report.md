# Remote Baseline SQL Snapshot Report - Hocker ONE

Date: 2026-05-09T11:26:24-07:00
Remote project ref: yvuibbcuntqpyqiuqggd
Snapshot file: supabase/baseline-audit/20260509_112357_remote_public_schema.sql

## Scope

- Schema-only dump.
- Public schema only.
- No data exported.
- No database mutation executed.
- No db push, no migration repair, no db reset.

## Snapshot counts

CREATE TABLE:
50
CREATE FUNCTION:
36
CREATE POLICY:
117
ENABLE RLS:
50
CREATE TRIGGER:
14
GRANT/REVOKE:
247

## Security scan note

Initial scan produced false positives for schema terms such as service_role and token-like column names.
No runtime secrets or data rows were exported because the dump is schema-only.

## Purpose

This snapshot captures the current remote production schema as evidence for future Supabase baseline adoption.

## Rule

This file is evidence only. It is not yet authorized as an executable migration.
