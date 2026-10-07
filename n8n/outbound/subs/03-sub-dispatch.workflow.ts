import { workflow, node, trigger, sticky, ifElse, switchCase, expr } from '@n8n/workflow-sdk';

const whenCalled = trigger({
  type: 'n8n-nodes-base.executeWorkflowTrigger',
  version: 1.2,
  config: {
    name: 'Appel depuis un workflow',
    parameters: {
      inputSource: 'workflowInputs',
      workflowInputs: {
        values: [
          { name: 'segmentKey', type: 'string' },
          { name: 'params', type: 'object' },
          { name: 'templateKey', type: 'string' },
          { name: 'channel', type: 'string' },
          { name: 'campaignKey', type: 'string' },
          { name: 'idempotencyKey', type: 'string' },
          { name: 'confirmLargeAudience', type: 'boolean' },
        ],
      },
    },
    position: [0, 300],
  },
  output: [{ segmentKey: 'inactive_since', params: { days: 14 }, templateKey: 'winback_inactive_14d', channel: 'email', campaignKey: 'winback-14d', idempotencyKey: 'n8n:winback-14d:2026-10', confirmLargeAudience: false }],
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
          { leftValue: expr('{{ $json.segmentKey }}'), rightValue: '', operator: { type: 'string', operation: 'notEmpty', singleValue: true } },
          { leftValue: expr('{{ $json.templateKey }}'), rightValue: '', operator: { type: 'string', operation: 'notEmpty', singleValue: true } },
          { leftValue: expr('{{ $json.idempotencyKey }}'), rightValue: '', operator: { type: 'string', operation: 'notEmpty', singleValue: true } },
        ],
      },
    },
    position: [240, 300],
  },
});

const rejectInput = node({
  type: 'n8n-nodes-base.stopAndError',
  version: 1,
  config: {
    name: 'Refuser : entrée incomplète',
    parameters: {
      errorType: 'errorMessage',
      errorMessage: expr('Dispatch refusé : segmentKey, templateKey et idempotencyKey sont obligatoires (reçu : {{ JSON.stringify($json) }})'),
    },
    position: [480, 500],
  },
});

const apiSchema = [
  { id: 'method', displayName: 'method', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' },
  { id: 'path', displayName: 'path', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' },
  { id: 'body', displayName: 'body', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'object' },
];

const createDispatch = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.4,
  config: {
    name: 'Créer le dispatch',
    parameters: {
      mode: 'once',
      source: 'database',
      workflowId: { __rl: true, mode: 'id', value: 'iQYqQdhUqtZuw4gA', cachedResultName: 'One More · Outbound · [Sub] Appel API' },
      workflowInputs: {
        mappingMode: 'defineBelow',
        value: {
          method: 'POST',
          path: '/internal/outbound/dispatch',
          body: expr('{{ { segmentKey: $json.segmentKey, params: $json.params || {}, templateKey: $json.templateKey, channel: $json.channel || "auto", campaignKey: $json.campaignKey || undefined, idempotencyKey: $json.idempotencyKey, confirmLargeAudience: $json.confirmLargeAudience === true } }}'),
        },
        matchingColumns: [],
        schema: apiSchema,
        attemptToConvertTypes: false,
      },
      options: { waitForSubWorkflow: true },
    },
    position: [480, 200],
  },
  output: [{ dispatchId: 'dispatch-uuid', recipients: 42 }],
});

const hasRecipients = ifElse({
  version: 2.3,
  config: {
    name: 'Audience non vide ?',
    parameters: {
      conditions: {
        combinator: 'and',
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 },
        conditions: [
          { leftValue: expr('{{ $json.recipients }}'), rightValue: 0, operator: { type: 'number', operation: 'gt' } },
        ],
      },
    },
    position: [720, 200],
  },
});

const emptyAudience = node({
  type: 'n8n-nodes-base.set',
  version: 3.5,
  config: {
    name: 'Résultat : audience vide',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: {
        assignments: [
          { id: 'res-empty-dispatch', name: 'dispatchId', value: expr('{{ $json.dispatchId }}'), type: 'string' },
          { id: 'res-empty-status', name: 'status', value: 'completed', type: 'string' },
          { id: 'res-empty-recipients', name: 'recipientCount', value: 0, type: 'number' },
          { id: 'res-empty-queued', name: 'queuedCount', value: 0, type: 'number' },
        ],
      },
    },
    position: [960, 400],
  },
  output: [{ dispatchId: 'dispatch-uuid', status: 'completed', recipientCount: 0, queuedCount: 0 }],
});

const waitBeforePoll = node({
  type: 'n8n-nodes-base.wait',
  version: 1.1,
  config: {
    name: 'Attendre 10 s',
    parameters: { resume: 'timeInterval', amount: 10, unit: 'seconds' },
    position: [960, 100],
  },
  output: [{ dispatchId: 'dispatch-uuid', recipients: 42 }],
});

const pollStatus = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.4,
  config: {
    name: 'Lire le statut du dispatch',
    parameters: {
      mode: 'once',
      source: 'database',
      workflowId: { __rl: true, mode: 'id', value: 'iQYqQdhUqtZuw4gA', cachedResultName: 'One More · Outbound · [Sub] Appel API' },
      workflowInputs: {
        mappingMode: 'defineBelow',
        value: {
          method: 'GET',
          path: expr('/internal/outbound/dispatch/{{ $("Créer le dispatch").first().json.dispatchId }}'),
          body: expr('{{ {} }}'),
        },
        matchingColumns: [],
        schema: apiSchema,
        attemptToConvertTypes: false,
      },
      options: { waitForSubWorkflow: true },
    },
    position: [1200, 100],
  },
  output: [{ id: 'dispatch-uuid', status: 'completed', segmentKey: 'inactive_since', templateKey: 'winback_inactive_14d', recipientCount: 42, queuedCount: 42, errorMessage: null }],
});

const routeStatus = switchCase({
  version: 3.4,
  config: {
    name: 'Router selon le statut',
    parameters: {
      mode: 'rules',
      rules: {
        values: [
          {
            renameOutput: true,
            outputKey: 'Terminé',
            conditions: {
              combinator: 'and',
              options: { caseSensitive: false, leftValue: '', typeValidation: 'loose' },
              conditions: [{ leftValue: expr('{{ $json.status }}'), rightValue: 'completed', operator: { type: 'string', operation: 'equals' } }],
            },
          },
          {
            renameOutput: true,
            outputKey: 'Échec',
            conditions: {
              combinator: 'and',
              options: { caseSensitive: false, leftValue: '', typeValidation: 'loose' },
              conditions: [{ leftValue: expr('{{ $json.status }}'), rightValue: 'failed', operator: { type: 'string', operation: 'equals' } }],
            },
          },
          {
            renameOutput: true,
            outputKey: 'En cours',
            conditions: {
              combinator: 'and',
              options: { caseSensitive: false, leftValue: '', typeValidation: 'loose' },
              conditions: [
                { leftValue: expr('{{ $json.status }}'), rightValue: 'processing', operator: { type: 'string', operation: 'equals' } },
                { leftValue: expr('{{ $runIndex }}'), rightValue: 60, operator: { type: 'number', operation: 'lt' } },
              ],
            },
          },
        ],
      },
      options: { fallbackOutput: 'extra', renameFallbackOutput: 'Timeout' },
    },
    position: [1440, 100],
  },
});

const summary = node({
  type: 'n8n-nodes-base.set',
  version: 3.5,
  config: {
    name: 'Résultat : dispatch terminé',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: {
        assignments: [
          { id: 'res-dispatch', name: 'dispatchId', value: expr('{{ $json.id }}'), type: 'string' },
          { id: 'res-status', name: 'status', value: expr('{{ $json.status }}'), type: 'string' },
          { id: 'res-segment', name: 'segmentKey', value: expr('{{ $json.segmentKey }}'), type: 'string' },
          { id: 'res-template', name: 'templateKey', value: expr('{{ $json.templateKey }}'), type: 'string' },
          { id: 'res-recipients', name: 'recipientCount', value: expr('{{ $json.recipientCount }}'), type: 'number' },
          { id: 'res-queued', name: 'queuedCount', value: expr('{{ $json.queuedCount }}'), type: 'number' },
        ],
      },
    },
    position: [1680, 0],
  },
  output: [{ dispatchId: 'dispatch-uuid', status: 'completed', segmentKey: 'inactive_since', templateKey: 'winback_inactive_14d', recipientCount: 42, queuedCount: 42 }],
});

const dispatchFailed = node({
  type: 'n8n-nodes-base.stopAndError',
  version: 1,
  config: {
    name: 'Erreur : dispatch en échec',
    parameters: {
      errorType: 'errorMessage',
      errorMessage: expr('Dispatch {{ $json.id }} en échec après {{ $json.queuedCount }}/{{ $json.recipientCount }} messages : {{ $json.errorMessage }}'),
    },
    position: [1680, 150],
  },
});

const dispatchTimeout = node({
  type: 'n8n-nodes-base.stopAndError',
  version: 1,
  config: {
    name: 'Erreur : dispatch trop long',
    parameters: {
      errorType: 'errorMessage',
      errorMessage: expr('Dispatch {{ $json.id }} toujours "{{ $json.status }}" après ~10 min ({{ $json.queuedCount }}/{{ $json.recipientCount }}). Vérifier les logs API.'),
    },
    position: [1680, 450],
  },
});

const note = sticky(
  '## Dispatch segment + suivi\n' +
    'Une campagne par appel (1 item). Entrées : `segmentKey`, `params`, `templateKey`, `channel`, `campaignKey`, `idempotencyKey`, `confirmLargeAudience`.\n\n' +
    'Le dispatch ne transmet **aucune variable** : le template doit avoir `variables: []`.\n\n' +
    'Sondage toutes les 10 s, 60 tours max (~10 min). `queuedCount` = messages mis en file, le worker API les envoie ensuite.',
  [isValid, createDispatch],
  { color: 5 },
);

export default workflow('one-more-outbound-sub-dispatch', 'One More · Outbound · [Sub] Dispatch segment')
  .add(whenCalled)
  .to(
    isValid
      .onTrue(
        createDispatch.to(
          hasRecipients
            .onTrue(
              waitBeforePoll.to(
                pollStatus.to(
                  routeStatus
                    .onCase(0, summary)
                    .onCase(1, dispatchFailed)
                    .onCase(2, waitBeforePoll)
                    .onCase(3, dispatchTimeout),
                ),
              ),
            )
            .onFalse(emptyAudience),
        ),
      )
      .onFalse(rejectInput),
  )
  .add(note)
  .group('Validation et création', [isValid, rejectInput, createDispatch], {
    description: 'Vérifie les champs obligatoires puis crée le dispatch côté API (POST /internal/outbound/dispatch)',
  })
  .group('Suivi du statut', [hasRecipients, emptyAudience, waitBeforePoll, pollStatus, routeStatus, summary, dispatchFailed, dispatchTimeout], {
    description: 'Audience vide = fin. Sinon sonde GET /dispatch/:id toutes les 10 s (60 tours max), renvoie le résumé ou une erreur',
  });
