<script lang="ts">
	import {page} from '$app/state'
	import {inApp} from '#lib/paths'
	import * as m from '#lib/paraglide/messages.js'
</script>

<enform-page>
	<section>
		<h1>{page.status === 404 ? m.error_not_found() : m.error_title()}</h1>
		{#if page.error?.message}<p>{page.error.message}</p>{/if}
		<p><a href={inApp('/')}>{m.error_back_home()}</a></p>
	</section>
</enform-page>
