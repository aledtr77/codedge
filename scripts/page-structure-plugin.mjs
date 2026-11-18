import { createHash } from 'node:crypto';

// Inline prose can be rearranged by a translation. Block structure cannot:
// the runtime text walker cannot create a missing lesson or remove an old one.
const INLINE = new Set(['a', 'abbr', 'b', 'bdi', 'bdo', 'br', 'cite', 'code', 'del', 'dfn', 'em', 'i', 'ins', 'kbd', 'mark', 'q', 's', 'samp', 'small', 'span', 'strong', 'sub', 'sup', 'time', 'u', 'var', 'wbr']);

export function pageStructure(html) {
  const markup = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  const body = /<body\b[^>]*>([\s\S]*?)<\/body>/i.exec(markup)?.[1] || '';
  const slots = [];
  for (const [, closing, tag, attributes] of body.matchAll(/<(\/?)([a-z][a-z0-9-]*)\b([^>]*)>/gi)) {
    if (INLINE.has(tag.toLowerCase())) continue;
    const id = /(?:^|\s)id\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attributes);
    const classes = /(?:^|\s)class\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attributes);
    const classNames = (classes?.[1] || classes?.[2] || classes?.[3] || '').split(/\s+/).filter(Boolean).sort().join('.');
    slots.push(`${closing}${tag.toLowerCase()}#${id?.[1] || id?.[2] || id?.[3] || ''}.${classNames}`);
  }
  return createHash('sha256').update(slots.join('\n')).digest('hex').slice(0, 16);
}

export default function pageStructurePlugin() {
  return {
    name: 'page-translation-structure',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return html.replace('</head>', `<meta name="codedge-page-structure" content="${pageStructure(html)}"></head>`);
      }
    }
  };
}
