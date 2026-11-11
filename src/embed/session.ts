/** The session in the embed: no one signed in, nothing is anyone's to edit here */
export const auth = {
	ready: true,
	me: undefined,
	local: undefined,
	did: undefined,
	owns: () => false
}
