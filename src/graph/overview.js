import { escapeHtml } from '../core/reference-data.js';

// These lines indicate category membership, NOT tool alternatives or a syllabus.
export function overviewHtml(groups, expanded, zoom = 1, columns = 3) {
  columns = Math.max(1, Math.min(3, columns));
  const cardWidth = 232, gap = 24, padding = 24;
  const width = padding * 2 + columns * cardWidth + (columns - 1) * gap;
  let top = 126, lines = '', cards = '';
  for (let row = 0; row < groups.length; row += columns) {
    const batch = groups.slice(row, row + columns);
    for (const [column, group] of batch.entries()) {
      const x = padding + column * (cardWidth + gap), open = expanded.has(group.id);
      const height = open ? 102 + group.categories.length * 38 : 90;
      const children = open ? group.categories.map((category, index) => {
        const y = 102 + index * 38;
        const name = category.name.length > 25 ? category.name.slice(0, 24) + '…' : category.name;
        return `<g class="dk-overview-category" data-category="${escapeHtml(category.id)}" role="button" tabindex="0" aria-label="${escapeHtml(category.name)} 관계도 보기" transform="translate(12,${y - 20})"><title>${escapeHtml(category.name)}</title><rect width="208" height="32" rx="5"/><text x="10" y="21">${escapeHtml(name)}</text></g>`;
      }).join('') : '';
      lines += `<path d="M${width / 2},88 V106 H8 V${top - 16} H${x + cardWidth / 2} V${top}"/>`;
      cards += `<g class="dk-overview-card" transform="translate(${x},${top})"><rect class="dk-overview-frame" width="${cardWidth}" height="${height}" rx="12"/>
        <g class="dk-overview-toggle" data-expand="${group.id}" role="button" tabindex="0" aria-expanded="${open}" aria-label="${group.name} 세부 분류 ${open ? '접기' : '펼치기'}"><rect width="${cardWidth}" height="56" rx="12"/><text class="dk-overview-title" x="16" y="25">${group.name}</text><text class="dk-overview-sign" x="206" y="26">${open ? '−' : '+'}</text><text class="dk-overview-meta" x="16" y="44">${group.tools.size}개 도구 · ${group.categories.length}개 분류</text></g>
        <g class="dk-overview-jump" data-category="${group.id}" role="button" tabindex="0" aria-label="${group.name} 전체 관계도 보기" transform="translate(12,58)"><rect width="208" height="28" rx="4"/><text x="10" y="19">분야 전체 관계도 →</text></g>${children}</g>`;
    }
    top += Math.max(...batch.map(group => expanded.has(group.id) ? 102 + group.categories.length * 38 : 90)) + 32;
  }
  const height = top + padding;
  return `<svg class="dk-overview" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width * zoom}" height="${height * zoom}" data-width="${width}" data-height="${height}" role="group" aria-label="개발 도구 전체 조망"><g class="dk-overview-lines">${lines}</g><rect class="dk-overview-root" x="${width / 2 - 120}" y="24" width="240" height="64" rx="12"/><text class="dk-overview-root-title" x="${width / 2}" y="50" text-anchor="middle">Developer Tools</text><text class="dk-overview-root-hint" x="${width / 2}" y="70" text-anchor="middle">분야를 펼쳐서 탐색하세요</text>${cards}</svg>`;
}
