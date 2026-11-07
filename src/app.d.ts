// See https://svelte.dev/docs/kit/types#app
declare global {
	namespace App {
		interface PageState {
			/** Fields to start a new record's form with (copying a record to another type) */
			prefill?: Record<string, unknown>
		}
	}
}

export {}
