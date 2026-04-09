import { EQUIPMENT_GROUPS } from '@/lib/translations'

export type EquipmentSelection = Record<string, 'all' | string[]>

function normalize(values: string[]): string[] {
    return [...new Set(values.map((v) => v.toLowerCase()))].sort((a, b) =>
        a.localeCompare(b),
    )
}

export function isEquipmentSelectionEmpty(sel: EquipmentSelection): boolean {
    return Object.keys(sel).length === 0
}

export function buildEquipmentByParent(
    parentOptions: string[],
    availableRawEquipment: string[],
): Record<string, string[]> {
    const rawSet = new Set(availableRawEquipment.map((e) => e.toLowerCase()))
    const out: Record<string, string[]> = {}

    for (const parent of parentOptions) {
        const p = parent.toLowerCase()
        const group = EQUIPMENT_GROUPS[p]
        if (group) {
            const children = normalize(group.ids.filter((id) => rawSet.has(id)))
            if (children.length > 0) out[p] = children
        } else if (rawSet.has(p)) {
            out[p] = [p]
        }
    }
    return out
}

export function exerciseMatchesEquipmentSelection(
    exEquipment: string | undefined,
    selection: EquipmentSelection,
): boolean {
    if (isEquipmentSelectionEmpty(selection)) return true
    if (!exEquipment) return false
    const eq = exEquipment.toLowerCase()

    for (const [parent, value] of Object.entries(selection)) {
        if (value === 'all') {
            const group = EQUIPMENT_GROUPS[parent]
            if (group ? group.ids.includes(eq) : parent === eq) return true
            continue
        }
        if (value.some((v) => v.toLowerCase() === eq)) return true
    }
    return false
}

/** `parent::*` ou `parent::c1,c2`; parents séparés par `;;` */
export function serializeEquipmentSelection(sel: EquipmentSelection): string {
    const entries = Object.entries(sel)
        .filter(([, v]) => v === 'all' || (Array.isArray(v) && v.length > 0))
        .sort(([a], [b]) => a.localeCompare(b))
    if (entries.length === 0) return ''
    return entries
        .map(([p, v]) => `${p}::${v === 'all' ? '*' : (v as string[]).join(',')}`)
        .join(';;')
}

export function parseEquipmentSelection(raw: string | null): EquipmentSelection {
    if (!raw?.trim()) return {}
    const trimmed = raw.trim()
    if (!trimmed.includes('::')) return { [trimmed.toLowerCase()]: 'all' }

    let decoded = trimmed
    try {
        decoded = decodeURIComponent(trimmed)
    } catch {
        return {}
    }

    const out: EquipmentSelection = {}
    for (const block of decoded.split(';;')) {
        const idx = block.indexOf('::')
        if (idx <= 0) continue
        const parent = block.slice(0, idx).trim().toLowerCase()
        const spec = block.slice(idx + 2).trim()
        if (!parent) continue
        if (spec === '*') out[parent] = 'all'
        else {
            const children = normalize(spec.split(',').map((c) => c.trim()))
            if (children.length > 0) out[parent] = children
        }
    }
    return out
}

export function sanitizeEquipmentSelection(
    sel: EquipmentSelection,
    tree: Record<string, string[]>,
): EquipmentSelection {
    const next: EquipmentSelection = {}
    for (const [parent, value] of Object.entries(sel)) {
        const children = tree[parent]
        if (!children?.length) continue
        if (value === 'all') {
            next[parent] = 'all'
            continue
        }
        const filtered = value.filter((v) => children.includes(v.toLowerCase()))
        if (filtered.length === 0) continue
        if (filtered.length >= children.length) next[parent] = 'all'
        else next[parent] = normalize(filtered)
    }
    return next
}
