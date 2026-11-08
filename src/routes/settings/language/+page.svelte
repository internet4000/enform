<script lang="ts">
	// Each language named in itself, one tap each
	import * as m from '#lib/paraglide/messages.js'
	import {getLocale, locales, setLocale} from '#lib/paraglide/runtime.js'
	import SettingsHeader from '#lib/components/SettingsHeader.svelte'
</script>

<enform-page>
	<SettingsHeader title={m.locale_label()} />
	<fieldset>
		<legend>{m.locale_label()}</legend>
		{#each locales as locale (locale)}
			<label lang={locale}>
				<input
					type="radio"
					name="locale"
					value={locale}
					checked={getLocale() === locale}
					onchange={() => setLocale(locale)}
				/>
				{new Intl.DisplayNames([locale], {type: 'language'}).of(locale)}
			</label>
		{/each}
	</fieldset>
</enform-page>
