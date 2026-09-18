export type AppRouteId =
  | 'workspace'
  | 'creators'
  | 'creator-workspace'
  | 'topics'
  | 'content-pack'
  | 'studio'
  | 'images'
  | 'videos'
  | 'series'
  | 'contents'
  | 'assets'
  | 'calendar'
  | 'publish'
  | 'analytics'
  | 'knowledge'
  | 'memory'
  | 'learning'
  | 'accounts'
  | 'enterprise'
  | 'billing'
  | 'onboarding';

export interface AppRouteDefinition {
  id: AppRouteId;
  path: string;
  label: string;
}

export const APP_ROUTES: AppRouteDefinition[] = [
  { id: 'workspace', path: '/dashboard', label: '工作台' },
  { id: 'creators', path: '/creators', label: 'AI内容生产者' },
  { id: 'creator-workspace', path: '/creators/:creatorId', label: '创作者工作台' },
  { id: 'topics', path: '/topics', label: 'AI选题' },
  { id: 'content-pack', path: '/content-pack', label: '智能内容包' },
  { id: 'studio', path: '/studio', label: '文案创作' },
  { id: 'images', path: '/ai-images', label: 'AI 图片' },
  { id: 'videos', path: '/ai-videos', label: 'AI 视频' },
  { id: 'series', path: '/series', label: '内容系列' },
  { id: 'contents', path: '/contents', label: '内容中心' },
  { id: 'assets', path: '/assets', label: '素材中心' },
  { id: 'calendar', path: '/calendar', label: '内容日历' },
  { id: 'publish', path: '/publish', label: '发布中心' },
  { id: 'analytics', path: '/analytics', label: '数据分析' },
  { id: 'knowledge', path: '/knowledge', label: '品牌知识库' },
  { id: 'memory', path: '/memory', label: 'AI记忆中心' },
  { id: 'learning', path: '/learning', label: 'AI学习中心' },
  { id: 'accounts', path: '/accounts', label: '平台账号' },
  { id: 'enterprise', path: '/enterprise', label: '企业与团队' },
  { id: 'billing', path: '/billing', label: '套餐与用量' },
  { id: 'onboarding', path: '/onboarding', label: '新手引导' }
];

export function getRouteById(id: string): AppRouteDefinition | undefined {
  return APP_ROUTES.find((route) => route.id === id);
}

export function getRouteIdFromPath(pathname: string): AppRouteId {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (/^\/creators\/[^/]+$/.test(normalized)) return 'creator-workspace';
  return APP_ROUTES.find((route) => route.path === normalized)?.id ?? 'workspace';
}
