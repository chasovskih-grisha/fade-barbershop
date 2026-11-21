/* eslint-disable max-lines, complexity -- cohesive module (295 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 4 functions with inherent domain branching (worst: evaluateNode, complexity 18 vs 10); refactor tracked in T-2500f */
/** Rule types that can be configured and evaluated by the RuleEngine. */
export type RuleType =
  | 'booking'
  | 'cancellation'
  | 'loyalty'
  | 'pricing'
  | 'deposit'
  | 'no-show'
  | 'rescheduling'
  | 'notification'
  | 'commission';

/** Rule definition parsed from JSON Logic expression. */
export interface RuleDefinition {
  id: string;
  type: RuleType;
  name: string;
  expression: string; // JSON Logic expression
  /** За замовчуванням 1, якщо не вказано. */
  version?: number;
  /** За замовчуванням — дата створення правила. */
  activeFrom?: Date;
  activeUntil?: Date;
  /** За замовчуванням false (правило одразу активне). */
  draft?: boolean;
}

/** Context available to all rule evaluations. */
export interface RuleContext {
  appointmentId?: string;
  clientId?: string;
  barberId?: string;
  locationId?: string;
  serviceId?: string;
  policyId?: string;
  /** Hours until the appointment starts */
  hoursUntilSlot?: number;
  /** Client's no-show count in the policy window */
  clientNoShowCount?: number;
  /** Whether deposit has been paid */
  depositPaid?: boolean;
  /** Policy configuration */
  policyConfig?: unknown;
  /** Appointment start time */
  appointmentStart?: Date;
  /** Current time (injected via clock) */
  now?: Date;
  /** Additional rule-specific fields */
  [key: string]: unknown;
}

/** Rule evaluation result. */
export interface RuleResult {
  /** Whether the rule allows the operation */
  allowed: boolean;
  /** Human-readable reason if disallowed */
  reason?: string;
  /** Optional modifications to the context */
  modifications?: Partial<RuleContext>;
  /** Rule version that was evaluated */
  ruleVersion: number;
}

/** JSON Logic operator handlers. */
export const JSON_LOGIC_OPERATORS: Record<string, (args: any[]) => unknown> = {
  and: (args: any[]) => args.every((a: any) => a === true),
  or: (args: any[]) => args.some((a: any) => a === true),
  not: (args: any[]) => !(args[0] === true),
  add: (args: any[]) => {
    const nums = args.map((a: any) => Number(a)).filter((a: any) => !isNaN(a));
    return nums.reduce((sum: number, n: number) => sum + n, 0);
  },
  subtract: (args: any[]) => {
    const nums = args.map((a: any) => Number(a)).filter((a: any) => !isNaN(a));
    return nums.length > 0 ? nums.reduce((a: number, n: number) => a - n, 0) : 0;
  },
  multiply: (args: any[]) => {
    const nums = args.map((a: any) => Number(a)).filter((a: any) => !isNaN(a));
    return nums.reduce((product: number, n: number) => product * n, 1);
  },
  divide: (args: any[]) => {
    const nums = args.map((a: any) => Number(a)).filter((a: any) => !isNaN(a));
    return nums.length > 0 ? nums.reduce((a: number, n: number) => a / n, 0) : 0;
  },
  greaterThan: (args: any[]) => Number(args[0]) > Number(args[1]),
  lessThan: (args: any[]) => Number(args[0]) < Number(args[1]),
  greaterOrEqual: (args: any[]) => Number(args[0]) >= Number(args[1]),
  greaterThanOrEqual: (args: any[]) => Number(args[0]) >= Number(args[1]),
  lessOrEqual: (args: any[]) => Number(args[0]) <= Number(args[1]),
  lessThanOrEqual: (args: any[]) => Number(args[0]) <= Number(args[1]),
  equal: (args: any[]) => String(args[0]) === String(args[1]),
  notEqual: (args: any[]) => String(args[0]) !== String(args[1]),
};

/** Символьні оператори порівняння у JSON Logic: [">", a, b]. */
const COMPARISON_OPERATORS = new Set(['>', '<', '>=', '<=', '==', '!=']);

/** Rule engine that evaluates JSON Logic expressions over rule context. */
export class RuleEngine {
  private readonly ruleDefinitions: Map<string, RuleDefinition> = new Map();

  constructor(rules?: RuleDefinition[]) {
    if (rules) {
      for (const rule of rules) {
        this.ruleDefinitions.set(rule.id, rule);
      }
    }
  }

  /** Evaluate a rule by type over the given context. */
  evaluate(type: RuleType, context: RuleContext): RuleResult {
    const ruleId = this.findRuleByType(type);
    if (!ruleId) {
      return { allowed: true, ruleVersion: 0 };
    }
    const rule = this.ruleDefinitions.get(ruleId);
    if (!rule) {
      return { allowed: true, ruleVersion: 0 };
    }
    const evaluated = this.evaluateExpression(rule.expression, {
      ...context,
      true: true,
      false: false,
      null: null,
    });
    const allowed = this.isAllowed(evaluated);
    const reason = this.extractReason(evaluated);
    return {
      allowed,
      ...(reason === undefined ? {} : { reason }),
      ruleVersion: rule?.version ?? 1,
    };
  }

  /** Find the rule definition by type. */
  private findRuleByType(type: RuleType): string | undefined {
    for (const [id, rule] of this.ruleDefinitions) {
      if (rule.type === type) {
        return id;
      }
    }
    return undefined;
  }

  /** Evaluate a JSON Logic expression with the given primitives. */
  evaluateExpression(expr: string, context: Record<string, unknown>): unknown {
    try {
      const parsed = this.parseJSONLogic(expr);
      return this.evaluateNode(parsed, context);
    } catch {
      return false;
    }
  }

  /** Parse a JSON Logic expression into an AST. */
  private parseJSONLogic(expr: string): unknown {
    const trimmed = expr.trim();

    // Handle function call syntax: greaterThan([hoursUntilSlot], 24)
    // Pattern: name(args1, arg2, ...)
    const funcMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\((.*)\)$/);
    if (funcMatch) {
      const name = funcMatch[1] ?? '';
      const argsStr = funcMatch[2] ?? '';
      const args = this.parseArgs(argsStr);
      return { __fn__: name, __args__: args };
    }

    // Handle JSON Logic array format: [operator, arg1, arg2, ...]
    if (trimmed.startsWith('[')) {
      return this.parseArrayJSONLogic(trimmed);
    }

    // Handle JSON Literal
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    if (trimmed === 'null') return null;
    // Handle string
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      return trimmed.slice(1, -1);
    }
    // Handle number
    if (!isNaN(Number(trimmed))) {
      return Number(trimmed);
    }
    // Handle variable reference (looked up in context)
    return trimmed;
  }

  /** Parse comma-separated arguments, respecting nested brackets. */
  private parseArgs(argsStr: string): any[] {
    const args: any[] = [];
    let depth = 0;
    let current = '';
    for (const char of argsStr) {
      if (char === '[') {
        depth++;
        current += char;
      } else if (char === ']') {
        depth--;
        current += char;
      } else if (char === ',' && depth === 0) {
        args.push(this.parseJSONLogic(current.trim()));
        current = '';
      } else {
        current += char;
      }
    }
    if (current.trim()) {
      args.push(this.parseJSONLogic(current.trim()));
    }
    return args;
  }

  /** Evaluate a single node value in context. */
  private evaluateValue(value: unknown, context: Record<string, unknown>): unknown {
    if (value === true || value === false) return value;
    if (value === null) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      // Variable lookup in context
      return context[value] ?? value;
    }
    if (Array.isArray(value)) {
      return value.map((v: any) => this.evaluateValue(v, context));
    }
    if (typeof value === 'object' && value !== null) {
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value)) {
        result[key] = this.evaluateValue(val, context);
      }
      return result;
    }
    return value;
  }

  /** Parse JSON Logic in array format [operator, arg1, arg2, ...] */
  private parseArrayJSONLogic(expr: string): unknown {
    const inner = expr.slice(1, -1).trim();
    const parts: string[] = [];
    let depth = 0;
    let current = '';
    for (const char of inner) {
      if (char === '[') {
        depth++;
        current += char;
      } else if (char === ']') {
        depth--;
        current += char;
      } else if (char === ',' && depth === 0) {
        parts.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    if (current.trim()) parts.push(current.trim());

    if (parts.length === 0) return null;

    const operator = String(parts[0]).trim();
    const isCall = operator in JSON_LOGIC_OPERATORS || COMPARISON_OPERATORS.has(operator);
    // `[hoursUntilSlot]` / `[true, true]` — літерал масиву, а не виклик.
    if (!isCall) {
      return parts.map((p: string) => this.parseJSONLogic(p));
    }

    return {
      __fn__: operator,
      __args__: parts.slice(1).map((p: string) => this.parseJSONLogic(p)),
    };
  }

  /** Evaluate a parsed JSON Logic node. */
  private evaluateNode(node: unknown, context: Record<string, unknown>): unknown {
    if (node === true || node === false) return node;
    if (node === null) return null;
    if (typeof node === 'number') return node;
    if (typeof node === 'string') {
      // Could be a variable reference or a __fn__ name
      // Check if it's a known function name
      if (node.startsWith('__fn__')) return node;
      return context[node] ?? node;
    }
    if (Array.isArray(node)) {
      const operator = typeof node[0] === 'string' ? node[0] : null;
      if (operator && (operator in JSON_LOGIC_OPERATORS || COMPARISON_OPERATORS.has(operator))) {
        return this.applyOperator(
          operator,
          node.slice(1).map((arg: unknown) => this.evaluateNode(arg, context))
        );
      }
      return node.map((item: unknown) => this.evaluateNode(item, context));
    }
    if (typeof node === 'object') {
      const record = node as Record<string, unknown>;
      if (typeof record['__var__'] === 'string') {
        return context[record['__var__']];
      }
      if (typeof record['__fn__'] === 'string') {
        const rawArgs = Array.isArray(record['__args__']) ? record['__args__'] : [];
        return this.applyOperator(
          record['__fn__'],
          rawArgs.map((arg: unknown) => this.evaluateNode(arg, context))
        );
      }
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(node)) {
        result[key] = this.evaluateValue(value, context);
      }
      return result;
    }
    return node;
  }

  /** Apply a JSON Logic operator to evaluated arguments. */
  private applyOperator(operator: string, rawArgs: unknown[]): unknown {
    // JSON Logic передає список як єдиний аргумент: and([a, b]).
    const args =
      (operator === 'and' || operator === 'or' || operator === 'not') &&
      rawArgs.length === 1 &&
      Array.isArray(rawArgs[0])
        ? (rawArgs[0] as unknown[])
        : rawArgs;
    const handler = JSON_LOGIC_OPERATORS[operator];
    if (handler) {
      return handler(args);
    }

    // Binary comparison operators
    if (args.length >= 2) {
      const left = Number(args[0]);
      const right = Number(args[1]);
      switch (operator) {
        case '>':
          return left > right;
        case '<':
          return left < right;
        case '>=':
          return left >= right;
        case '<=':
          return left <= right;
        case '==':
          return left === right;
        case '!=':
          return left !== right;
      }
    }
    return false;
  }

  /** Check if the evaluated result indicates the rule is allowed. */
  private isAllowed(evaluated: unknown): boolean {
    if (evaluated === true) return true;
    if (evaluated === false) return false;
    return !!evaluated;
  }

  /** Extract a human-readable reason from the evaluated expression. */
  private extractReason(evaluated: unknown): string | undefined {
    if (typeof evaluated === 'string') return evaluated;
    if (evaluated === false) return 'Rule condition not met';
    return undefined;
  }
}
