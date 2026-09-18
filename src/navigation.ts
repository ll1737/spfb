import { AppRouteId } from './appRoutes';

export interface ProductNavItem {
  id: AppRouteId;
  label: string;
  beta?: boolean;
}

export interface ProductNavSection {
  title: string;
  items: ProductNavItem[];
}

export const PRODUCT_NAVIGATION: ProductNavSection[] = [
  { title: '概览', items: [{ id: 'workspace', label: '工作台' }] },
  {
    title: '智能创作',
    items: [
      { id: 'creators', label: 'AI内容生产者' },
      { id: 'creator-workspace', label: '创作者工作台' },
      { id: 'topics', label: 'AI选题' },
      { id: 'content-pack', label: '智能内容包' },
      { id: 'studio', label: '文案创作' },
      { id: 'images', label: 'AI 图片', beta: true },
      { id: 'videos', label: 'AI 视频', beta: true },
      { id: 'series', label: '内容系列', beta: true }
    ]
  },
  { title: '内容资产', items: [{ id: 'contents', label: '内容中心' }, { id: 'assets', label: '素材中心' }] },
  { title: '内容运营', items: [{ id: 'calendar', label: '内容日历' }, { id: 'publish', label: '发布中心' }, { id: 'analytics', label: '数据分析' }] },
  { title: '知识与记忆', items: [{ id: 'knowledge', label: '品牌知识库', beta: true }, { id: 'memory', label: 'AI记忆中心' }, { id: 'learning', label: 'AI学习中心', beta: true }] },
  { title: '管理', items: [{ id: 'accounts', label: '平台账号' }, { id: 'enterprise', label: '企业与团队' }, { id: 'billing', label: '套餐与用量' }] }
];
