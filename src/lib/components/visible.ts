/** Calls back once, when an element first comes near the viewport, so links resolve lazily */
import type {Attachment} from 'svelte/attachments'

/** How far outside the viewport an element counts as visible, to resolve it just in time */
const MARGIN = '200px'

export function whenVisible(onVisible: () => void): Attachment {
	return (element) => {
		if (typeof IntersectionObserver === 'undefined') {
			onVisible()
			return
		}
		const observer = new IntersectionObserver(
			(entries) => {
				if (!entries.some((entry) => entry.isIntersecting)) return
				observer.disconnect()
				onVisible()
			},
			{rootMargin: MARGIN}
		)
		observer.observe(element)
		return () => observer.disconnect()
	}
}
