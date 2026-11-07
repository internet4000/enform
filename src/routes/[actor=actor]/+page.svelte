<script lang="ts">
	// Nothing chosen yet: on wide screens, the space where a collection opens
	import * as m from '#lib/paraglide/messages.js'
	import Pane from '#lib/components/pane/Pane.svelte'
</script>

<Pane title={m.pane_pick_title()} placeholder>
	<p>{m.pane_pick_collection()}</p>
</Pane>
