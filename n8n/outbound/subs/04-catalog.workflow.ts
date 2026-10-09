import { workflow, node, trigger, sticky, expr } from '@n8n/workflow-sdk';

const manualStart = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'Lancer manuellement', position: [0, 300] },
  output: [{}],
});

const fetchCatalog = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.4,
  config: {
    name: 'GET /internal/outbound/catalog',
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
    position: [240, 300],
  },
  output: [{
    segments: [{ key: 'inactive_since', description: 'Inactifs depuis N jours', params: [{ name: 'days', type: 'number', required: false, default: 7 }] }],
    templates: [{ key: 'weekly_recap', category: 'transactional', channel: 'push', variables: ['sessionCount', 'xpTotal', 'streak', 'sessionLabel'], isActive: true, version: 1 }],
    endpoints: {},
  }],
});

const summarize = node({
  type: 'n8n-nodes-base.set',
  version: 3.5,
  config: {
    name: 'Résumer le catalogue',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: {
        assignments: [
          { id: 'sum-segments', name: 'segments', value: expr('{{ $json.segments.map(s => ({ key: s.key, params: s.params.map(p => p.name + (p.required ? "*" : "") + ":" + p.type).join(", ") || "—" })) }}'), type: 'array' },
          { id: 'sum-templates', name: 'templates', value: expr('{{ $json.templates.map(t => ({ key: t.key, category: t.category, channel: t.channel, variables: (t.variables || []).join(", ") || "—", isActive: t.isActive, version: t.version })) }}'), type: 'array' },
          { id: 'sum-dispatchable', name: 'templatesUtilisablesEnDispatch', value: expr('{{ $json.templates.filter(t => t.isActive && (t.variables || []).length === 0).map(t => t.key) }}'), type: 'array' },
          { id: 'sum-marketing-email', name: 'templatesEmailMarketing', value: expr('{{ $json.templates.filter(t => t.isActive && t.category === "marketing" && ["email", "both"].includes(t.channel)).map(t => t.key) }}'), type: 'array' },
          { id: 'sum-fetched-at', name: 'luLe', value: expr('{{ $now.setZone("Europe/Paris").toISO() }}'), type: 'string' },
        ],
      },
    },
    position: [480, 300],
  },
  output: [{ segments: [], templates: [], templatesUtilisablesEnDispatch: ['new_user_d1_morning'], templatesEmailMarketing: [], luLe: '2026-10-07T14:00:00.000+02:00' }],
});

const note = sticky(
  '## Catalogue outbound (lecture seule)\n' +
    'Vérifie la connexion à l\'API et liste segments + templates en base.\n\n' +
    '- `templatesUtilisablesEnDispatch` : actifs **sans variables** (le dispatch n\'en transmet pas)\n' +
    '- `templatesEmailMarketing` : actifs, `category: marketing`, canal email\n\n' +
    'Aucun envoi. À lancer après chaque changement de template ou de clé API.',
  [fetchCatalog, summarize],
  { color: 4 },
);

export default workflow('one-more-outbound-catalog', 'One More · Outbound · Catalogue (manuel)')
  .add(manualStart)
  .to(fetchCatalog)
  .to(summarize)
  .add(note);
