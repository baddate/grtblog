<script lang="ts">
	import PostList from '$lib/features/post/components/PostList.svelte';
	import { postListCtx } from '$lib/features/post/context';
	import { t } from '$lib/i18n/client';

	let { data } = $props();

	postListCtx.mountModelData(() => data);
</script>

<PostList
	basePath="/categories/{data.categorySlug}"
	title={data.categoryName}
	description={t('web.seo.category.desc', { name: data.categoryName })}
/>
