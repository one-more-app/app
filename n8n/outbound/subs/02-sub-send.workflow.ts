import { workflow, node, trigger, sticky, ifElse, expr } from '@n8n/workflow-sdk';

const whenCalled = trigger({
  type: 'n8n-nodes-base.executeWorkflowTrigger',
  version: 1.2,
  config: {
    name: 'Appel depuis un workflow',
    parameters: {
      inputSource: 'workflowInputs',
      workflowInputs: {
        values: [
          { name: 'userId', type: 'string' },
          { name: 'templateKey', type: 'string' },
          { name: 'channel', type: 'string' },
          { name: 'variables', type: 'object' },
          { name: 'idempotencyKey', type: 'string' },
        ],
      },
    },
    position: [0, 300],
  },
  output: [{ userId: '00000000-0000-0000-0000-000000000000', templateKey: 'training_reminder', channel: 'push', variables: { today: '2026-10-07' }, idempotencyKey: 'n8n:test:2026-10-07' }],
});

const isValid = ifElse({
  version: 2.3,
  config: {
    name: 'Champs obligatoires présents ?',
    parameters: {
      conditions: {
        combinator: 'and',
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 },
        conditions: [
          { leftValue: expr('{{ $json.userId }}'), rightValue: '', operator: { type: 'string', operation: 'notEmpty', singleValue: true } },
          { leftValue: expr('{{ $json.templateKey }}'), rightValue: '', operator: { type: 'string', operation: 'notEmpty', singleValue: true } },
          { leftValue: expr('{{ $json.idempotencyKey }}'), rightValue: '', operator: { type: 'string', operation: 'notEmpty', singleValue: true } },
        ],
      },
    },
    position: [240, 300],
  },
});

const callApi = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.4,
  config: {
    name: 'POST /internal/outbound/send',
    parameters: {
      mode: 'once',
      source: 'database',
      workflowId: { __rl: true, mode: 'id', value: 'iQYqQdhUqtZuw4gA', cachedResultName: 'One More · Outbound · [Sub] Appel API' },
      workflowInputs: {
        mappingMode: 'defineBelow',
        value: {
          method: 'POST',
          path: '/internal/outbound/send',
          body: expr('{{ { userId: $json.userId, templateKey: $json.templateKey, channel: $json.channel || "auto", variables: $json.variables || {}, idempotencyKey: $json.idempotencyKey } }}'),
        },
        matchingColumns: [],
        schema: [
          { id: 'method', displayName: 'method', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' },
          { id: 'path', displayName: 'path', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' },
          { id: 'body', displayName: 'body', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'object' },
        ],
        attemptToConvertTypes: false,
      },
      options: { waitForSubWorkflow: true },
    },
    position: [480, 200],
  },
  output: [{ messageId: 'message-uuid', status: 'pending', created: true }],
});

const rejectInput = node({
  type: 'n8n-nodes-base.stopAndError',
  version: 1,
  config: {
    name: 'Refuser : entrée incomplète',
    parameters: {
      errorType: 'errorMessage',
      errorMessage: expr('Envoi unitaire refusé : userId, templateKey et idempotencyKey sont obligatoires (reçu : {{ JSON.stringify($json) }})'),
    },
    position: [480, 400],
  },
});

const note = sticky(
  '## Envoi unitaire\n' +
    'Entrées : `userId` (uuid), `templateKey`, `channel` (`email` | `push` | `auto`, défaut `auto`), `variables` (objet), `idempotencyKey`.\n\n' +
    '`variables` doit contenir **toutes** les clés déclarées par le template (voir catalogue), sinon le message passe en `failed`.\n\n' +
    'Sortie : `{ messageId, status, created }`. `created: false` = déjà envoyé avec cette clé.',
  [isValid],
  { color: 5 },
);

export default workflow('one-more-outbound-sub-send', 'One More · Outbound · [Sub] Envoi unitaire')
  .add(whenCalled)
  .to(isValid.onTrue(callApi).onFalse(rejectInput))
  .add(note);
