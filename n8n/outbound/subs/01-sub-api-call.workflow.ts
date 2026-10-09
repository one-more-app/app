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
          { name: 'method', type: 'string' },
          { name: 'path', type: 'string' },
          { name: 'body', type: 'object' },
        ],
      },
    },
    position: [0, 300],
  },
  output: [{ method: 'POST', path: '/internal/outbound/dispatch', body: { segmentKey: 'inactive_since' } }],
});

const config = node({
  type: 'n8n-nodes-base.set',
  version: 3.5,
  config: {
    name: 'Config API One More',
    parameters: {
      mode: 'manual',
      includeOtherFields: true,
      assignments: {
        assignments: [
          { id: 'cfg-base-url', name: 'apiBaseUrl', value: 'https://api.one-more.app', type: 'string' },
          { id: 'cfg-api-key', name: 'outboundApiKey', value: 'TO_CHANGE', type: 'string' },
        ],
      },
    },
    position: [240, 300],
  },
  output: [{ method: 'POST', path: '/internal/outbound/dispatch', body: {}, apiBaseUrl: 'https://api.one-more.app', outboundApiKey: 'TO_CHANGE' }],
});

const isGet = ifElse({
  version: 2.3,
  config: {
    name: 'Méthode GET ?',
    parameters: {
      conditions: {
        combinator: 'and',
        options: { caseSensitive: false, leftValue: '', typeValidation: 'loose', version: 2 },
        conditions: [
          { leftValue: expr('{{ ($json.method || "GET").toUpperCase() }}'), rightValue: 'GET', operator: { type: 'string', operation: 'equals' } },
        ],
      },
    },
    position: [480, 300],
  },
});

const getRequest = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'GET API One More',
    parameters: {
      method: 'GET',
      url: expr('{{ $json.apiBaseUrl }}{{ $json.path }}'),
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: {
        parameters: [
          { name: 'X-Outbound-Api-Key', value: expr('{{ $json.outboundApiKey }}') },
        ],
      },
      options: { timeout: 30000 },
    },
    retryOnFail: true,
    maxTries: 3,
    waitBetweenTries: 2000,
    position: [720, 200],
  },
  output: [{ id: 'dispatch-uuid', status: 'completed', recipientCount: 42, queuedCount: 42 }],
});

const postRequest = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'POST API One More',
    parameters: {
      method: 'POST',
      url: expr('{{ $json.apiBaseUrl }}{{ $json.path }}'),
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: {
        parameters: [
          { name: 'X-Outbound-Api-Key', value: expr('{{ $json.outboundApiKey }}') },
        ],
      },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify($json.body || {}) }}'),
      options: { timeout: 30000 },
    },
    retryOnFail: true,
    maxTries: 3,
    waitBetweenTries: 2000,
    position: [720, 400],
  },
  output: [{ dispatchId: 'dispatch-uuid', recipients: 42 }],
});

const note = sticky(
  '## Clé API outbound\n' +
    'Seul endroit où vivent l\'URL et la clé : node **Config API One More**.\n\n' +
    '- `apiBaseUrl` : `https://api.one-more.app` (staging : `https://api.staging.one-more.app`)\n' +
    '- `outboundApiKey` : remplacer `TO_CHANGE` par `OUTBOUND_API_KEY` (api/.env)\n\n' +
    'Retries sûrs sur POST : même `idempotencyKey` = pas de double envoi côté API.',
  [config],
  { color: 3 },
);

export default workflow('one-more-outbound-sub-api-call', 'One More · Outbound · [Sub] Appel API')
  .add(whenCalled)
  .to(config)
  .to(isGet.onTrue(getRequest).onFalse(postRequest))
  .add(note);
