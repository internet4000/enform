/** What every field of a RecordForm shares */
import {createContext} from 'svelte'
import {SvelteMap, SvelteSet} from 'svelte/reactivity'
import type {LexNode} from '#lib/lexicons/types'

export type UploadBlob = (file: File) => Promise<unknown>

export class FormState {
	/** Show every field's errors, not only those of fields already visited */
	revealed = $state(false)
	/** Someone has been through a field, so the form may say what's left to do */
	visited = $state(false)
	/** Fields with errors of their own making (bad JSON, a file refused), by id */
	problems = new SvelteMap<string, (string | number)[]>()
	/** Fields still working (uploading, fetching), by id */
	busy = new SvelteSet<string>()
	/** Images chosen in blob fields, their size, by field id: for siblings to use */
	images = new SvelteMap<string, {width: number; height: number}>()

	constructor(
		/** Prefix of field ids, unique to the form */
		readonly id: string,
		readonly uploadBlob?: UploadBlob
	) {}

	/** A field's element id, from its path in the record */
	fieldId(path: (string | number)[]): string {
		return [this.id, ...path].join('-')
	}
}

export const [getForm, setForm] = createContext<FormState>()

/** How a field's control ties to its label, hint and errors */
export type Control = {
	id: string
	describedby: string | undefined
	invalid: true | undefined
}

/** The props every field kind takes */
export type FieldProps = {
	node: LexNode
	value: unknown
	/** NSID of the lexicon `node` is in, for relative refs */
	base: string
	/** The field's label: its property name */
	name: string
	path: (string | number)[]
	required: boolean
	/** An item of a list, which has its own controls and no "optional" mark */
	item?: boolean
}

/** Focus a field (or the first control of a group of them) by its id */
export function focusField(id: string): void {
	const element = document.getElementById(id)
	const controls = 'input:not([disabled]), select, textarea, button:not([disabled])'
	const target = element?.matches(controls) ? element : element?.querySelector(controls)
	if (target instanceof HTMLElement) target.focus()
}

/** Focus a field that may still be on its way (its ref resolving), for a moment */
export function focusFieldSoon(id: string, frames = 60): void {
	const element = document.getElementById(id)
	if (element && (element.matches('input, select, textarea') || element.querySelector('input'))) {
		focusField(id)
	} else if (frames > 0) {
		requestAnimationFrame(() => focusFieldSoon(id, frames - 1))
	}
}

/** A field's path as people read it: list items counted from 1 */
export function pathLabel(path: (string | number)[]): string {
	return path.map((part) => (typeof part === 'number' ? part + 1 : part)).join(' › ')
}
