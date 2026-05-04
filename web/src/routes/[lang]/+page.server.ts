import { getHomeActivityPulse, getHomeInspirationStats } from '$lib/features/home/api';
import type { HomeActivityPulseData, HomeInspirationStatsData } from '$lib/features/home/types';
import { resolveHomeThemeConfig } from '$lib/features/home/theme';
import { getRecentPosts } from '$lib/features/post/api';
import type { PostListResponse } from '$lib/features/post/types';
import { getRecentMoments } from '$lib/features/moment/api';
import type { MomentListResponse } from '$lib/features/moment/types';
import { trackISRDeps } from '$lib/server/isr-deps';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { fetch } = event;
	const parentData = await event.parent();
	const homeTheme = resolveHomeThemeConfig(parentData.websiteInfo);
	const configuredRangeDays = homeTheme.activityPulse?.rangeDays;
	const activityDays =
		configuredRangeDays === 'all'
			? 'all'
			: configuredRangeDays && configuredRangeDays > 0
				? configuredRangeDays
				: 365;

	trackISRDeps(
		event,
		'home:recent-posts',
		'home:recent-moments',
		'home:activity-pulse',
		'home:inspiration-stats'
	);

	let recentPosts: PostListResponse = { items: [], total: 0, page: 1, size: 10 };
	let recentMoments: MomentListResponse = { items: [], total: 0, page: 1, size: 10 };
	let activityPulse: HomeActivityPulseData = {
		days: 365,
		startDate: '',
		endDate: '',
		totalPosts: 0,
		totalMoments: 0,
		statusLabel: 'Quiet',
		points: []
	};
	let inspirationStats: HomeInspirationStatsData = {
		words: { total: 0, articles: 0, moments: 0, pages: 0, thinkings: 0 }
	};

	try {
		[recentPosts, recentMoments, activityPulse, inspirationStats] = await Promise.all([
			getRecentPosts(fetch),
			getRecentMoments(fetch),
			getHomeActivityPulse(fetch, { days: activityDays }),
			getHomeInspirationStats(fetch, { githubUsername: homeTheme.inspiration?.github?.username })
		]);
	} catch (error) {
		console.error(
			`[renderer][home-page] Failed to load home page data: ${error instanceof Error ? error.message : String(error)}`
		);
	}

	return {
		recentPosts,
		recentMoments,
		activityPulse,
		inspirationStats,
		homeTheme
	};
};
