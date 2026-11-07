<script lang="ts">
	import {auth} from '#lib/auth/session.svelte'
	import AppView from '#lib/components/AppView.svelte'
	import Breadcrumbs from '#lib/components/Breadcrumbs.svelte'
	import {actorName} from '#lib/paths'

	let {data} = $props()
	let actor = $derived(actorName(data.repo))
	let owner = $derived(auth.session?.did === data.repo.did)
</script>

<Breadcrumbs {actor} />
<h1>{data.app.app}</h1>
<AppView repo={data.repo} {actor} app={data.app} {owner} />
