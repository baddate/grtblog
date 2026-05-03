<script lang="ts">
	import FriendTimelineList from '$lib/features/friend-timeline/components/FriendTimelineList.svelte';
	import { friendTimelineListCtx } from '$lib/features/friend-timeline/context';
	import PageHeader from '$lib/ui/common/PageHeader.svelte';
	import { t } from '$lib/i18n/client';

	let { data } = $props();

	friendTimelineListCtx.mountModelData(() => ({
		items: data.items,
		total: data.pagination.total,
		page: data.pagination.page,
		size: data.pagination.size
	}));
</script>

<div class="max-w-5xl mx-auto py-10">
	<PageHeader
		title={t('web.seo.friends_timeline.title')}
		tag="Friend Timeline"
		subtitle={t('web.friends_timeline.subtitle')}
		description={t('web.seo.friends_timeline.desc')}
	/>
	<FriendTimelineList />
</div>
