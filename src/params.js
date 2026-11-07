import {defineParams} from '@sveltejs/kit/params'

export const params = defineParams({
	/** A repo's path segment: @ followed by a handle or a DID */
	/** @param {string} param */
	actor: (param) => (/^@[\w.:%-]+$/.test(param) ? param : undefined),
	/** A collection's path segment: an NSID */
	/** @param {string} param */
	nsid: (param) =>
		/^[a-zA-Z]([a-zA-Z0-9-]*\.)+[a-zA-Z][a-zA-Z0-9]*$/.test(param) ? param : undefined
})
