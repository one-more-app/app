import { workflow, node, trigger, sticky, ifElse, expr } from '@n8n/workflow-sdk';

const manualStart = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'Lancer manuellement (une fois)', position: [0, 300] },
  output: [{}],
});

const campaignParams = node({
  type: 'n8n-nodes-base.set',
  version: 3.5,
  config: {
    name: 'Paramètres campagne',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: {
        assignments: [
          { id: 'cp-segment', name: 'segmentKey', value: 'active_with_email', type: 'string' },
          { id: 'cp-params', name: 'params', value: expr('{{ {} }}'), type: 'object' },
          { id: 'cp-template', name: 'templateKey', value: 'cgu_update_emails_notice', type: 'string' },
          { id: 'cp-channel', name: 'channel', value: 'email', type: 'string' },
          { id: 'cp-campaign', name: 'campaignKey', value: 'cgu-update-2026-10', type: 'string' },
          { id: 'cp-idempotency', name: 'idempotencyKey', value: 'n8n:cgu-update:2026-10', type: 'string' },
          { id: 'cp-confirm', name: 'confirmLargeAudience', value: true, type: 'boolean' },
        ],
      },
    },
    position: [240, 300],
  },
  output: [{ segmentKey: 'active_with_email', params: {}, templateKey: 'cgu_update_emails_notice', channel: 'email', campaignKey: 'cgu-update-2026-10', idempotencyKey: 'n8n:cgu-update:2026-10', confirmLargeAudience: true }],
});

const fetchCatalog = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.4,
  config: {
    name: 'Lire le catalogue',
    parameters: {
      mode: 'once',
      source: 'database',
      workflowId: { __rl: true, mode: 'id', value: 'iQYqQdhUqtZuw4gA', cachedResultName: 'One More · Outbound · [Sub] Appel API' },
      workflowInputs: {
        mappingMode: 'defineBelow',
        value: {
          method: 'GET',
          path: '/internal/outbound/catalog',
          body: expr('{{ {} }}'),
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
    position: [480, 300],
  },
  output: [{ segments: [{ key: 'active_with_email' }], templates: [{ key: 'cgu_update_emails_notice', category: 'transactional', channel: 'email', variables: [], isActive: true, version: 1 }], endpoints: {} }],
});

const templateReady = ifElse({
  version: 2.3,
  config: {
    name: 'Template prêt pour le dispatch ?',
    parameters: {
      conditions: {
        combinator: 'and',
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 },
        conditions: [
          {
            leftValue: expr('{{ $json.templates.some(t => t.key === $("Paramètres campagne").first().json.templateKey && t.isActive && t.category === "transactional" && ["email", "both"].includes(t.channel) && (t.variables || []).length === 0) }}'),
            rightValue: true,
            operator: { type: 'boolean', operation: 'true', singleValue: true },
          },
        ],
      },
    },
    position: [720, 300],
  },
});

const runDispatch = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.4,
  config: {
    name: 'Dispatch CGU + emails One More',
    parameters: {
      mode: 'once',
      source: 'database',
      workflowId: { __rl: true, mode: 'id', value: 'b0KcWFM96bSwLfQL', cachedResultName: 'One More · Outbound · [Sub] Dispatch segment' },
      workflowInputs: {
        mappingMode: 'defineBelow',
        value: {
          segmentKey: expr('{{ $("Paramètres campagne").first().json.segmentKey }}'),
          params: expr('{{ $("Paramètres campagne").first().json.params }}'),
          templateKey: expr('{{ $("Paramètres campagne").first().json.templateKey }}'),
          channel: expr('{{ $("Paramètres campagne").first().json.channel }}'),
          campaignKey: expr('{{ $("Paramètres campagne").first().json.campaignKey }}'),
          idempotencyKey: expr('{{ $("Paramètres campagne").first().json.idempotencyKey }}'),
          confirmLargeAudience: expr('{{ $("Paramètres campagne").first().json.confirmLargeAudience }}'),
        },
        matchingColumns: [],
        schema: [
          { id: 'segmentKey', displayName: 'segmentKey', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' },
          { id: 'params', displayName: 'params', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'object' },
          { id: 'templateKey', displayName: 'templateKey', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' },
          { id: 'channel', displayName: 'channel', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' },
          { id: 'campaignKey', displayName: 'campaignKey', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' },
          { id: 'idempotencyKey', displayName: 'idempotencyKey', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' },
          { id: 'confirmLargeAudience', displayName: 'confirmLargeAudience', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'boolean' },
        ],
        attemptToConvertTypes: false,
      },
      options: { waitForSubWorkflow: true },
    },
    position: [960, 200],
  },
  output: [{ dispatchId: 'dispatch-uuid', status: 'completed', segmentKey: 'active_with_email', templateKey: 'cgu_update_emails_notice', recipientCount: 42, queuedCount: 42 }],
});

const templateMissing = node({
  type: 'n8n-nodes-base.stopAndError',
  version: 1,
  config: {
    name: 'Erreur : template non prêt',
    parameters: {
      errorType: 'errorMessage',
      errorMessage: expr('Template "{{ $("Paramètres campagne").first().json.templateKey }}" absent, inactif, non transactionnel, sans canal email ou avec des variables. Déployer la migration 2140 puis relancer « Catalogue (manuel) ».'),
    },
    position: [960, 400],
  },
});

const note = sticky(
  '## Mise à jour CGU + info emails (one-shot)\n' +
    'Segment `active_with_email` → template **transactionnel** `cgu_update_emails_notice`.\n\n' +
    'Transactionnel : **pas** de filtre `marketingEmail` (tous les comptes avec email). Lien CGU : https://one-more.app/legal/conditions-generales\n\n' +
    '`confirmLargeAudience: true` (audience potentiellement > 5000). Clé unique `n8n:cgu-update:2026-10` : un envoi max, même si tu relances.',
  [campaignParams, templateReady],
  { color: 6 },
);

export default workflow('one-more-outbound-campaign-cgu-update', 'One More · Outbound · Campagne · Mise à jour CGU (email)')
  .add(manualStart)
  .to(campaignParams)
  .to(fetchCatalog)
  .to(templateReady.onTrue(runDispatch).onFalse(templateMissing))
  .add(note);
