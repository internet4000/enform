<script lang="ts">
	import * as m from '#lib/paraglide/messages.js'
	import ActorSearch from '#lib/components/ActorSearch.svelte'
</script>

<section>
	<h1>{m.app_tagline()}</h1>
	<p>{m.app_intro()}</p>
</section>
<ActorSearch />
