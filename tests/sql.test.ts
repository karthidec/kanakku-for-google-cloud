import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('sql/create_daily_summary.sql', () => {
  const sqlPath = resolve(process.cwd(), 'sql/create_daily_summary.sql');
  const sql = readFileSync(sqlPath, 'utf8');

  it('uses placeholders and no real billing account IDs', () => {
    expect(sql).toContain('YOUR_BILLING_PROJECT_ID');
    expect(sql).toContain('YOUR_DATASET_NAME');
    expect(sql).toContain(
      'gcp_billing_export_resource_v1_YOUR_BILLING_ACCOUNT_ID',
    );
    expect(sql).not.toMatch(/gcp_billing_export_resource_v1_[0-9A-F]{6}_/);
  });

  it('configures lookback_days with default 3 and creates a partitioned summary table', () => {
    expect(sql).toContain('DECLARE lookback_days INT64 DEFAULT 3;');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS');
    expect(sql).toContain('PARTITION BY usage_date');
    expect(sql).toContain(
      'CLUSTER BY project_id, service_description, resource_name',
    );
  });

  it('includes required cost, credit, currency, and freshness columns', () => {
    for (const column of [
      'usage_date',
      'project_id',
      'service_description',
      'resource_name',
      'cost_before_discounts',
      'cud_credits',
      'other_credits',
      'credits_total',
      'cost_after_credits',
      'cost_at_list',
      'currency',
      'latest_usage_time',
    ]) {
      expect(sql).toContain(column);
    }
    expect(sql).toContain('COMMITTED_USAGE_DISCOUNT');
    expect(sql).toContain('UNNEST(credits)');
    expect(sql).toContain('MERGE');
  });
});
