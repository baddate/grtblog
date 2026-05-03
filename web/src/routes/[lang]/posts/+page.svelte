<script lang="ts">
	import PostList from '$lib/features/post/components/PostList.svelte';
	import { postListCtx } from '$lib/features/post/context';
	import PageHeader from '$lib/ui/common/PageHeader.svelte';
	import { t } from '$lib/i18n/client';

	let { data } = $props();

	postListCtx.mountModelData(() => data);
</script>

<div class="max-w-5xl mx-auto py-10">
	<PageHeader
		title={t('web.seo.posts.title')}
		tag="Archive"
		subtitle={t('web.posts.subtitle')}
		description={t('web.seo.posts.desc')}
	/>
	<PostList />
</div>
