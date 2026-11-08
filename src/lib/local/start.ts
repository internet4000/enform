/** Starting on this device: the first local profile, else a new one, acted as */
import {auth} from '#lib/auth/session.svelte'
import {createProfile, listProfiles, type LocalProfile} from './store'

export async function startOnDevice(name: string): Promise<LocalProfile> {
	const profile = (await listProfiles())[0] ?? (await createProfile(name))
	await auth.useLocal(profile)
	return profile
}
