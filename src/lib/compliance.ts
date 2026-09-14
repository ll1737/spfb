import { ContentPayload, PlatformId } from '../types';
import { PLATFORMS_META } from '../data/defaultData';

export interface ComplianceIssue {
  id: string;
  type: 'danger' | 'warning' | 'info';
  category: 'sensitive_words' | 'character_limit' | 'media_rules' | 'formatting';
  platform?: PlatformId;
  title: string;
  message: string;
  suggestion?: string;
  highlightWords?: string[];
}

export interface ComplianceCheckResult {
  score: number; // 0 ~ 100
  level: 'safe' | 'warning' | 'risk';
  issues: ComplianceIssue[];
  sensitiveWordCount: number;
  wordCount: number;
  platformSummary: Record<PlatformId, {
    passed: boolean;
    issuesCount: number;
    platformName: string;
  }>;
}

// 常见新广告法与平台违规/极限词库 (含建议替换词)
export const SENSITIVE_WORDS_DICT: Record<string, { category: string; suggestion: string }> = {
  '全网第一': { category: '广告法极限词', suggestion: '备受推崇 / 人气之选' },
  '第一': { category: '广告法极限词', suggestion: '前列 / 先行者' },
  '顶级': { category: '广告法极限词', suggestion: '高规格 / 旗舰水准' },
  '最顶级': { category: '广告法极限词', suggestion: '旗舰' },
  '最佳': { category: '广告法极限词', suggestion: '优选 / 推荐' },
  '最高': { category: '广告法极限词', suggestion: '高水准' },
  '极致': { category: '广告法极限词', suggestion: '细致 / 匠心' },
  '绝无仅有': { category: '广告法极限词', suggestion: '难得一见 / 稀缺' },
  '独一无二': { category: '广告法极限词', suggestion: '别具一格' },
  '国家级': { category: '合规禁限词', suggestion: '规范化' },
  '永久': { category: '夸大承诺词', suggestion: '长期 / 持续' },
  '100%': { category: '绝对化表述', suggestion: '高概率 / 深度' },
  '百分之百': { category: '绝对化表述', suggestion: '几乎 / 普遍' },
  '治愈': { category: '医疗禁限词', suggestion: '改善 / 缓解' },
  '保本': { category: '金融合规词', suggestion: '稳健' },
  '躺赚': { category: '平台严打暴富词', suggestion: '副业增收 / 效率变现' },
  '暴富': { category: '平台严打暴富词', suggestion: '商业成长' },
  '秒杀': { category: '虚假促销词', suggestion: '限时特惠' },
  '零风险': { category: '夸大宣传词', suggestion: '低门槛' }
};

export function checkContentCompliance(content: ContentPayload): ComplianceCheckResult {
  const issues: ComplianceIssue[] = [];
  const fullText = `${content.title} ${content.content} ${content.summary || ''} ${content.tags.join(' ')}`;
  const foundSensitiveWords: string[] = [];

  // 1. 敏感词 & 极限词排查
  Object.entries(SENSITIVE_WORDS_DICT).forEach(([word, meta]) => {
    if (fullText.includes(word)) {
      foundSensitiveWords.push(word);
      issues.push({
        id: `sens_${word}`,
        type: 'danger',
        category: 'sensitive_words',
        title: `检测到禁止/高风险词汇【${word}】`,
        message: `触发《${meta.category}》风控审查，可能导致平台限流、审核驳回或封号风险。`,
        suggestion: `建议替换为：“${meta.suggestion}”`,
        highlightWords: [word]
      });
    }
  });

  // 2. 基础素材完整度排查
  if (!content.title.trim()) {
    issues.push({
      id: 'no_title',
      type: 'danger',
      category: 'character_limit',
      title: '缺少作品标题',
      message: '所有内容平台均强制要求填写标题，请完善标题后再提交。'
    });
  }

  if (content.contentType === 'note' && content.images.length === 0) {
    issues.push({
      id: 'no_images_note',
      type: 'warning',
      category: 'media_rules',
      title: '图文动态缺少配图',
      message: '小红书、微博图文模式要求至少 1 张图片，无图可能被转为纯文本或无法发布。',
      suggestion: '建议至少上传 1~3 张高清配图或精美封面'
    });
  }

  if (content.contentType === 'video' && !content.videoUrl) {
    issues.push({
      id: 'no_video_url',
      type: 'danger',
      category: 'media_rules',
      title: '视频发布缺少视频源文件',
      message: '当前选择了视频发布模式，但未提供视频文件 URL 或本地路径。'
    });
  }

  // 3. 各平台特异性规则深度校验
  const platforms: PlatformId[] = ['xiaohongshu', 'weibo', 'wechat_mp', 'douyin', 'toutiao', 'zhihu', 'bilibili', 'kuaishou'];
  const platformSummary: Record<PlatformId, { passed: boolean; issuesCount: number; platformName: string }> = {} as any;

  platforms.forEach((p) => {
    const meta = PLATFORMS_META[p];
    let pIssues = 0;
    const pTitle = content.overrides?.[p]?.title || content.title;

    // 小红书特异性
    if (p === 'xiaohongshu') {
      if (pTitle.length > 20) {
        pIssues++;
        issues.push({
          id: 'xhs_title_len',
          type: 'warning',
          platform: 'xiaohongshu',
          category: 'character_limit',
          title: '小红书标题超过 20 字',
          message: `当前标题长度为 ${pTitle.length} 字。小红书官方推荐标题控制在 20 字以内，超长将被截断展示。`,
          suggestion: '可在「平台定制」中为小红书单独设置 20 字内的爆款精炼标题'
        });
      }
      if (content.tags.length > 10) {
        pIssues++;
        issues.push({
          id: 'xhs_tags_count',
          type: 'warning',
          platform: 'xiaohongshu',
          category: 'formatting',
          title: '小红书标签超过 10 个',
          message: `小红书单篇笔记最多支持 10 个话题标签，当前已添加 ${content.tags.length} 个。`,
          suggestion: '请精简保留 3~6 个最核心的高热度垂直话题'
        });
      }
    }

    // 微博特异性
    if (p === 'weibo') {
      const invalidTags = content.tags.filter((t) => t.includes('#'));
      if (invalidTags.length > 0) {
        issues.push({
          id: 'weibo_tag_format',
          type: 'info',
          platform: 'weibo',
          category: 'formatting',
          title: '微博话题标签格式提示',
          message: '系统将在分发至微博时自动规范为 #话题名称# 格式，无需重复输入双井号。'
        });
      }
    }

    // 微信公众号特异性
    if (p === 'wechat_mp') {
      if (pTitle.length > 64) {
        pIssues++;
        issues.push({
          id: 'wechat_title_len',
          type: 'danger',
          platform: 'wechat_mp',
          category: 'character_limit',
          title: '微信公众号标题超过 64 字',
          message: `微信公众号图文标题最大上限为 64 字，当前已达到 ${pTitle.length} 字。`,
          suggestion: '请缩减标题字数以满足微信公众号规范'
        });
      }
      if (!content.coverUrl && content.images.length === 0) {
        pIssues++;
        issues.push({
          id: 'wechat_no_cover',
          type: 'danger',
          platform: 'wechat_mp',
          category: 'media_rules',
          title: '微信公众号缺少封面图',
          message: '微信公众号发表图文时封面图为必填项，缺少封面将导致草稿箱保存失败。',
          suggestion: '请在右侧栏上传封面图'
        });
      }
    }

    // 抖音特异性
    if (p === 'douyin' && pTitle.length > 30) {
      pIssues++;
      issues.push({
        id: 'douyin_title_len',
        type: 'warning',
        platform: 'douyin',
        category: 'character_limit',
        title: '抖音标题建议控制在 30 字内',
        message: `当前标题为 ${pTitle.length} 字，超出 30 字在抖音移动端播放界面会被折叠隐藏。`
      });
    }

    platformSummary[p] = {
      passed: pIssues === 0,
      issuesCount: pIssues,
      platformName: meta.name
    };
  });

  // 计算健康评分 (满分 100)
  let score = 100;
  score -= foundSensitiveWords.length * 15;
  const dangerCount = issues.filter((i) => i.type === 'danger').length;
  const warningCount = issues.filter((i) => i.type === 'warning').length;
  score -= dangerCount * 12;
  score -= warningCount * 5;
  if (score < 0) score = 0;

  const level = score >= 85 ? 'safe' : score >= 60 ? 'warning' : 'risk';

  return {
    score,
    level,
    issues,
    sensitiveWordCount: foundSensitiveWords.length,
    wordCount: fullText.length,
    platformSummary
  };
}
