import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface KnowledgeItem {
  id: string;
  type: 'formula' | 'course' | 'lesson';
  title: string;
  content: string;
  category: string;
  keywords: string[];
}

@Injectable()
export class KnowledgeService {
  private cache: KnowledgeItem[] | null = null;
  private cacheTime = 0;

  constructor(private prisma: PrismaService) {}

  /** Build the full knowledge index from DB */
  async buildIndex(): Promise<KnowledgeItem[]> {
    // Cache for 5 minutes
    if (this.cache && Date.now() - this.cacheTime < 300000) return this.cache;

    const items: KnowledgeItem[] = [];

    // Index formulas
    const formulas = await this.prisma.formula.findMany({
      where: { published: true },
      select: { id: true, name: true, description: true, moves: true, mainCategory: true, category: true, level: true },
    });
    for (const f of formulas) {
      items.push({
        id: f.id, type: 'formula',
        title: f.name,
        content: `【${f.name}】(${f.mainCategory}/${f.category}/${f.level})\n公式: ${f.moves}\n说明: ${f.description || '暂无'}`,
        category: f.mainCategory || '',
        keywords: [f.name, f.mainCategory, f.category, f.level].filter(Boolean) as string[],
      });
    }

    // Index courses
    const courses = await this.prisma.course.findMany({
      where: { published: true },
      select: { id: true, title: true, summary: true, mainCategory: true, category: true, level: true },
    });
    for (const c of courses) {
      items.push({
        id: c.id, type: 'course',
        title: c.title,
        content: `【课程】${c.title} (${c.mainCategory || '三阶'}/${c.category}/${c.level})\n简介: ${c.summary || '暂无'}`,
        category: c.mainCategory || '',
        keywords: [c.title, c.mainCategory, c.category, c.level].filter(Boolean) as string[],
      });
    }

    this.cache = items;
    this.cacheTime = Date.now();
    return items;
  }

  /** Search knowledge base by query */
  async search(query: string, topK = 5): Promise<KnowledgeItem[]> {
    const index = await this.buildIndex();
    const qLower = query.toLowerCase();
    const qWords = qLower.split(/\s+/);

    // Score each item
    const scored = index.map(item => {
      let score = 0;
      const contentLower = item.content.toLowerCase();

      // Exact match in title
      if (item.title.toLowerCase().includes(qLower)) score += 10;

      // Keyword matches
      for (const kw of item.keywords) {
        if (qLower.includes(kw.toLowerCase())) score += 8;
        if (kw.toLowerCase().includes(qLower)) score += 5;
      }

      // Word-level content matches
      for (const w of qWords) {
        if (w.length < 2) continue;
        const re = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const matches = contentLower.match(re);
        if (matches) score += matches.length * 2;
      }

      // Bonus for formula moves matching
      if (item.type === 'formula' && qLower.match(/[RULDFBMruldbxyz'2\s]+/)) {
        const queryMoves = qLower.replace(/[^RULDFBMruldbxyz'2\s]/g, '').trim();
        const itemMoves = item.content.replace(/[^RULDFBMruldbxyz'2\s]/g, '').trim();
        if (queryMoves && itemMoves.includes(queryMoves)) score += 15;
      }

      return { item, score };
    });

    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(s => s.item);
  }

  /** Format search results into prompt context */
  async searchContext(query: string): Promise<string> {
    const results = await this.search(query, 3);
    if (!results.length) return '';

    return `\n\n【知识库检索结果 — 以下内容来自CubeQuest官方公式库和课程库，确保准确】\n${results.map(r => `---\n${r.content}\n---`).join('\n')}\n\n请基于以上官方资料回答用户问题。如需引用公式，请确保公式原文完全匹配。如果知识库中没有相关信息，请明确告知用户"这个我暂时不确定，建议查阅官方教程"。\n`;
  }
}
