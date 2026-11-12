<script lang="ts">
	// About enform: what it is, its source, and serving your own copy
	import * as m from '#lib/paraglide/messages.js'
	import app from '#lib/config/app.json' with {type: 'json'}
	import SettingsHeader from '#lib/components/SettingsHeader.svelte'
	import SettingsLinks from '#lib/components/SettingsLinks.svelte'
</script>

<enform-page>
	<SettingsHeader title={m.about_title()} />
	<p>{m.app_intro()}</p>
	<SettingsLinks
		items={[
			{href: app.source, icon: 'source', label: m.about_source(), external: true},
			{
				href: `${app.source}/blob/main/docs/self-host.md`,
				icon: 'home',
				label: m.about_self_host(),
				external: true
			}
		]}
	/>
</enform-page>
