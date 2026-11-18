// eslint-plugin-uuid-keys (T-4300f)
//
// Гейт політики ADR 0021 «UUID only». Дві заборони:
//
//  1) `no-random-uuid` — id доменних об'єктів генерує shared kernel
//     (`uuidv7()` з @fade/domain-shared), а не `crypto.randomUUID()` і не
//     `v4()` з пакета `uuid`. v4 не сортується за часом (втрата index locality)
//     і не несе часу створення; різні генератори в різних шарах — це ще й
//     різні формати в одній таблиці.
//
//  2) `no-readable-id` — читабельний id (`loc-1`, `loc_KYY_01`, `comp-2`),
//     захардкоджений у коді, потрапляє в БД/відповідь і ламає uuid-колонку
//     (T-4300b). Дозволені лише UUID-рядки; для навмисних винятків
//     (Swagger-приклад, статична демо-мапа) є опція `allow`.
//
// Обидва правила — `error` в apps/api/.eslintrc.js; тести — index.test.mjs
// (`pnpm --filter eslint-plugin-uuid-keys test`). Той самий контракт перевіряє
// CI-гейт scripts/check-uuid-keys.mjs, щоб політика не залежала від ESLint.

/** Значення, що виглядає як UUID (v1–v8, variant RFC 9562) — дзеркало @fade/contracts. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Читабельний id: латинський слаг із розділювачем — `loc-1`, `loc_KYY_01`, `comp-2`. */
const READABLE_ID_RE = /^[a-z][a-z0-9]*(?:[-_][A-Za-z0-9]+)+$/;

/** Ключі, що тримають ідентифікатор: id, userId, aggregateId, client_id. */
const ID_KEY_RE = /^(?:id|[a-z][a-z0-9]*(?:_?Id|_id))$/;

const isIdKey = (name) => typeof name === 'string' && ID_KEY_RE.test(name);

/** Дістає рядковий літерал із вузла, розгортаючи `as Type` / `<Type>`. */
function stringLiteral(node) {
  let current = node;
  while (
    current &&
    (current.type === 'TSAsExpression' ||
      current.type === 'TSTypeAssertion' ||
      current.type === 'ChainExpression')
  ) {
    current = current.expression;
  }
  if (current && current.type === 'Literal' && typeof current.value === 'string') {
    return current.value;
  }
  return null;
}

const noRandomUuid = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Forbid crypto.randomUUID()/uuid.v4() — domain ids come from uuidv7() in @fade/domain-shared (ADR 0021)',
      category: 'Best Practices',
      recommended: false,
    },
    fixable: null,
    schema: [],
    messages: {
      randomUuid:
        'id генерує лише shared kernel: `uuidv7()` з @fade/domain-shared (ADR 0021). ' +
        '`{{name}}()` не сортується за часом і розходиться з форматом БД.',
    },
  },

  create(context) {
    const cryptoBinds = new Set();
    const uuidBinds = new Set();
    let uuidNamespace = null;

    return {
      ImportDeclaration(node) {
        const source = node.source.value;
        if (source === 'node:crypto' || source === 'crypto') {
          for (const spec of node.specifiers) {
            if (spec.type === 'ImportSpecifier' && spec.imported.name === 'randomUUID') {
              cryptoBinds.add(spec.local.name);
            }
          }
          return;
        }
        if (source !== 'uuid') return;
        for (const spec of node.specifiers) {
          if (spec.type === 'ImportSpecifier' && spec.imported.name === 'v4') {
            uuidBinds.add(spec.local.name);
          } else if (
            spec.type === 'ImportDefaultSpecifier' ||
            spec.type === 'ImportNamespaceSpecifier'
          ) {
            // `import uuid from 'uuid'` — той самий об'єкт із .v4().
            uuidNamespace = spec.local.name;
          }
        }
      },
      CallExpression(node) {
        const callee = node.callee;

        // randomUUID() — named import з node:crypto.
        if (callee.type === 'Identifier' && cryptoBinds.has(callee.name)) {
          context.report({ node, messageId: 'randomUuid', data: { name: callee.name } });
          return;
        }

        // crypto.randomUUID() — глобальний crypto.
        if (
          callee.type === 'MemberExpression' &&
          !callee.computed &&
          callee.property.type === 'Identifier' &&
          callee.property.name === 'randomUUID'
        ) {
          context.report({ node, messageId: 'randomUuid', data: { name: 'randomUUID' } });
          return;
        }

        // v4() — named import з `uuid`.
        if (callee.type === 'Identifier' && uuidBinds.has(callee.name)) {
          context.report({ node, messageId: 'randomUuid', data: { name: callee.name } });
          return;
        }

        // uuid.v4() — default або namespace import `uuid`.
        if (
          callee.type === 'MemberExpression' &&
          !callee.computed &&
          callee.object.type === 'Identifier' &&
          callee.object.name === uuidNamespace &&
          callee.property.type === 'Identifier' &&
          callee.property.name === 'v4'
        ) {
          context.report({ node, messageId: 'randomUuid', data: { name: 'v4' } });
        }
      },
    };
  },
};

const noReadableId = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Forbid hardcoded readable ids (`loc-1`, `comp-2`) — ids must be UUIDs (ADR 0021)',
      category: 'Best Practices',
      recommended: false,
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          allow: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      readableId:
        '"{{value}}" — читабельний id, а не UUID. Доменні id — UUID v7 (ADR 0021); ' +
        'для сід/тестів використовуйте seedUuid()/uuidv7(), для навмисного винятку — allow у конфігу.',
    },
  },

  create(context) {
    const allow = new Set((context.options[0] && context.options[0].allow) || []);

    return {
      Property(node) {
        if (node.computed || node.key.type !== 'Identifier') return;
        if (!isIdKey(node.key.name)) return;
        const value = stringLiteral(node.value);
        if (value === null || allow.has(value)) return;
        if (UUID_RE.test(value)) return;
        if (!READABLE_ID_RE.test(value)) return;
        context.report({ node, messageId: 'readableId', data: { value } });
      },
    };
  },
};

module.exports = {
  name: 'uuid-keys',
  rules: {
    'no-random-uuid': noRandomUuid,
    'no-readable-id': noReadableId,
  },
};
