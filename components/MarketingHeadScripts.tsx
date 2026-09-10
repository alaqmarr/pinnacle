import React from 'react';

interface MarketingHeadScriptsProps {
  scripts?: string | null;
}

function parseAttrs(rawAttrs: string): Record<string, any> {
  const attrs: Record<string, any> = {};
  const attrRegex = /([a-zA-Z0-9_:-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let attrMatch: RegExpExecArray | null;
  while ((attrMatch = attrRegex.exec(rawAttrs)) !== null) {
    const name = attrMatch[1];
    if (name.toLowerCase() === 'key') continue;
    const val = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? true;
    attrs[name] = val;
  }
  return attrs;
}

const TAG_REGEX = /<!--[\s\S]*?-->|<script\b([^>]*)>([\s\S]*?)<\/script>|<script\b([^>]*)\/>|<style\b([^>]*)>([\s\S]*?)<\/style>|<style\b([^>]*)\/>|<noscript\b([^>]*)>([\s\S]*?)<\/noscript>|<noscript\b([^>]*)\/>|<meta\b([^>]*?)(?:\/?>|<\/meta>)|<link\b([^>]*?)(?:\/?>|<\/link>)/gi;

export function MarketingHeadScripts({ scripts }: MarketingHeadScriptsProps) {
  if (!scripts || !scripts.trim()) return null;

  const trimmed = scripts.trim();

  // If plain JS code without HTML tags
  const hasHtmlTags = /<\s*(script|noscript|style|meta|link|!--)\b/i.test(trimmed) || trimmed.startsWith('<');
  if (!hasHtmlTags) {
    return (
      <script
        id="marketing-head-scripts"
        type="text/javascript"
        dangerouslySetInnerHTML={{ __html: trimmed }}
      />
    );
  }

  const elements: React.ReactNode[] = [];
  let match: RegExpExecArray | null;
  let index = 0;
  TAG_REGEX.lastIndex = 0;

  while ((match = TAG_REGEX.exec(trimmed)) !== null) {
    const full = match[0];
    if (full.startsWith('<!--')) continue;

    if (full.toLowerCase().startsWith('<script')) {
      const rawAttrs = match[1] ?? match[3] ?? '';
      const innerContent = match[2] ?? '';
      const attrs = parseAttrs(rawAttrs);
      elements.push(
        <script
          key={`head-script-${index++}`}
          {...attrs}
          dangerouslySetInnerHTML={innerContent ? { __html: innerContent } : undefined}
        />
      );
    } else if (full.toLowerCase().startsWith('<style')) {
      const rawAttrs = match[4] ?? match[6] ?? '';
      const innerContent = match[5] ?? '';
      const attrs = parseAttrs(rawAttrs);
      elements.push(
        <style
          key={`head-style-${index++}`}
          {...attrs}
          dangerouslySetInnerHTML={innerContent ? { __html: innerContent } : undefined}
        />
      );
    } else if (full.toLowerCase().startsWith('<noscript')) {
      const rawAttrs = match[7] ?? match[9] ?? '';
      const innerContent = match[8] ?? '';
      const attrs = parseAttrs(rawAttrs);
      elements.push(
        <noscript
          key={`head-noscript-${index++}`}
          {...attrs}
          dangerouslySetInnerHTML={innerContent ? { __html: innerContent } : undefined}
        />
      );
    } else if (full.toLowerCase().startsWith('<meta')) {
      const rawAttrs = match[10] ?? '';
      const attrs = parseAttrs(rawAttrs);
      elements.push(
        <meta
          key={`head-meta-${index++}`}
          {...attrs}
        />
      );
    } else if (full.toLowerCase().startsWith('<link')) {
      const rawAttrs = match[11] ?? '';
      const attrs = parseAttrs(rawAttrs);
      elements.push(
        <link
          key={`head-link-${index++}`}
          {...attrs}
        />
      );
    }
  }

  if (elements.length === 0) {
    return null;
  }

  return <>{elements}</>;
}
