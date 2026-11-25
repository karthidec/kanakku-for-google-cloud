import { describe, expect, it } from 'vitest';
import {
  buildProjectOverviewParameters,
  buildProjectOverviewQuery,
  buildQueryParameters,
  buildResourceCostQuery,
  buildServiceBreakdownParameters,
  buildServiceBreakdownQuery,
  SERVICE_DESCRIPTION_MAP,
} from '../src/core/billing/query';
import type { ResourceIdentity } from '../src/core/url/types';

describe('SERVICE_DESCRIPTION_MAP', () => {
  it('maps supported v1 services to Cloud Billing service descriptions', () => {
    expect(SERVICE_DESCRIPTION_MAP['cloud-run']).toBe('Cloud Run');
    expect(SERVICE_DESCRIPTION_MAP['compute-engine']).toBe('Compute Engine');
    expect(SERVICE_DESCRIPTION_MAP['cloud-storage']).toBe('Cloud Storage');
  });
});

describe('buildResourceCostQuery', () => {
  const target = {
    billingProjectId: 'my-billing-proj',
    datasetName: 'billing_ds',
    summaryTableName: 'daily_resource_costs',
  };

  it('builds a parameterized resource-level query against the summary table', () => {
    const sql = buildResourceCostQuery(target, true);

    expect(sql).toContain(
      'FROM `my-billing-proj.billing_ds.daily_resource_costs`',
    );
    expect(sql).toContain('project_id = @projectId');
    expect(sql).toContain('service_description = @serviceDescription');
    expect(sql).toContain('resource_name = @resourceName');
    expect(sql).toContain('ENDS_WITH(resource_global_name');
    expect(sql).toContain('cud_credits');
    expect(sql).toContain('other_credits');
    expect(sql).toContain('cost_at_list');
    expect(sql).toContain('usage_date >= DATE_SUB');
  });

  it('builds a project-level query when resourceLevel is false', () => {
    const sql = buildResourceCostQuery(target, false);

    expect(sql).toContain('project_id = @projectId');
    expect(sql).toContain('service_description = @serviceDescription');
    expect(sql).not.toContain('@resourceName');
  });
});

describe('buildQueryParameters', () => {
  it('creates BigQuery NAMED string parameters', () => {
    const resource: ResourceIdentity = {
      projectId: 'demo-proj',
      serviceType: 'cloud-run',
      regionOrZone: 'us-central1',
      resourceName: 'checkout-api',
    };

    expect(buildQueryParameters(resource, true)).toEqual([
      {
        name: 'projectId',
        parameterType: { type: 'STRING' },
        parameterValue: { value: 'demo-proj' },
      },
      {
        name: 'serviceDescription',
        parameterType: { type: 'STRING' },
        parameterValue: { value: 'Cloud Run' },
      },
      {
        name: 'resourceName',
        parameterType: { type: 'STRING' },
        parameterValue: { value: 'checkout-api' },
      },
    ]);
  });
});

describe('buildServiceBreakdownQuery', () => {
  it('groups current month costs by resource for a project and service', () => {
    const sql = buildServiceBreakdownQuery({
      billingProjectId: 'my-billing-proj',
      datasetName: 'billing_ds',
      summaryTableName: 'daily_resource_costs',
    });

    expect(sql).toContain(
      'FROM `my-billing-proj.billing_ds.daily_resource_costs`',
    );
    expect(sql).toContain('GROUP BY resource_label');
    expect(sql).toContain('ORDER BY cost_after_credits DESC');
    expect(sql).toContain('LIMIT 25');
  });

  it('creates parameters for service breakdown query', () => {
    expect(
      buildServiceBreakdownParameters({
        projectId: 'demo-proj',
        serviceType: 'cloud-run',
      }),
    ).toEqual([
      {
        name: 'projectId',
        parameterType: { type: 'STRING' },
        parameterValue: { value: 'demo-proj' },
      },
      {
        name: 'serviceDescription',
        parameterType: { type: 'STRING' },
        parameterValue: { value: 'Cloud Run' },
      },
    ]);
  });
});

describe('buildProjectOverviewQuery', () => {
  it('groups current month spend by service_description for a project', () => {
    const sql = buildProjectOverviewQuery({
      billingProjectId: 'my-billing-proj',
      datasetName: 'billing_ds',
      summaryTableName: 'daily_resource_costs',
    });

    expect(sql).toContain('GROUP BY service_description');
    expect(sql).toContain('project_id = @projectId');
    expect(buildProjectOverviewParameters('demo-proj')).toEqual([
      {
        name: 'projectId',
        parameterType: { type: 'STRING' },
        parameterValue: { value: 'demo-proj' },
      },
    ]);
  });
});
