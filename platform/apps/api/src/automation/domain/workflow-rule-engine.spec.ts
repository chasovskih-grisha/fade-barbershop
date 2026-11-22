import {
  evaluateWorkflow,
  matchesCondition,
  validateWorkflowRule,
  type WorkflowRule,
} from './workflow-rule-engine';

const winback: WorkflowRule = {
  id: 'winback-60',
  name: 'Win back inactive clients',
  trigger: 'client_inactive',
  conditions: [
    { field: 'client.daysSinceVisit', operator: 'gte', value: 60 },
    { field: 'client.phone', operator: 'exists' },
  ],
  actions: [
    { type: 'send_sms', params: { template: 'winback' } },
    { type: 'award_points', params: { points: 50 } },
  ],
  enabled: true,
};

const lowStock: WorkflowRule = {
  id: 'low-stock',
  name: 'Notify manager about low stock',
  trigger: 'inventory_low',
  conditions: [{ field: 'item.supplierId', operator: 'eq', value: 'supplier-1' }],
  actions: [{ type: 'assign_task', params: { title: 'Reorder pomade' } }],
  enabled: true,
};

describe('workflow rule engine (T-5020)', () => {
  it('matches an event whose conditions all pass', () => {
    const run = evaluateWorkflow([winback], {
      trigger: 'client_inactive',
      data: { client: { daysSinceVisit: 74, phone: '+380501112233' } },
    });
    expect(run.evaluated).toBe(1);
    expect(run.matched).toEqual([
      {
        ruleId: 'winback-60',
        name: 'Win back inactive clients',
        actions: winback.actions,
      },
    ]);
  });

  it('ignores rules for other triggers, disabled rules and failing conditions', () => {
    const disabled = { ...lowStock, enabled: false };
    const run = evaluateWorkflow([winback, lowStock, disabled], {
      trigger: 'client_inactive',
      data: { client: { daysSinceVisit: 10, phone: '+380501112233' } },
    });
    expect(run.matched).toEqual([]);
    expect(run.evaluated).toBe(1);
    expect(run.skippedDisabled).toBe(1);
  });

  it('supports comparison, membership and existence operators', () => {
    const data = { count: '12', status: 'vip', tags: ['fade', 'beard'] };
    expect(matchesCondition({ field: 'count', operator: 'gte', value: 10 }, data)).toBe(true);
    expect(matchesCondition({ field: 'count', operator: 'lt', value: 10 }, data)).toBe(false);
    expect(matchesCondition({ field: 'status', operator: 'eq', value: 'vip' }, data)).toBe(true);
    expect(matchesCondition({ field: 'status', operator: 'includes', value: 'vi' }, data)).toBe(true);
    expect(matchesCondition({ field: 'tags', operator: 'includes', value: 'beard' }, data)).toBe(true);
    expect(matchesCondition({ field: 'missing.path', operator: 'exists' }, data)).toBe(false);
  });

  it('reports invalid rules', () => {
    expect(
      validateWorkflowRule({
        id: '',
        name: '',
        trigger: 'review_received',
        conditions: [{ field: '', operator: 'eq', value: 1 }],
        actions: [],
        enabled: true,
      })
    ).toEqual(['id_required', 'name_required', 'actions_required', 'condition_field_required']);
    expect(validateWorkflowRule(winback)).toEqual([]);
  });
});
