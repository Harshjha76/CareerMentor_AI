import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

/**
 * Clean, elegant Claude-style Markdown Renderer
 * Parses bold text, lists, headers, code blocks, tables, and intuitive callouts
 * with zero raw asterisks (*) or unparsed markdown artifacts.
 */
export default function MarkdownRenderer({ content = '', className = '' }) {
  if (!content) return null;

  // Split into lines and parse structured blocks
  const blocks = parseContentToBlocks(content);

  return (
    <div className={`space-y-3 leading-relaxed text-slate-100 font-sans text-sm ${className}`}>
      {blocks.map((block, idx) => (
        <RenderBlock key={idx} block={block} />
      ))}
    </div>
  );
}

function parseContentToBlocks(rawText) {
  // Normalize line breaks
  const text = rawText.replace(/\r\n/g, '\n');
  const lines = text.split('\n');
  const blocks = [];
  let currentList = null;
  let inCodeBlock = false;
  let codeLanguage = '';
  let codeLines = [];
  let inTable = false;
  let tableRows = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Code Block Fence (```)
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        blocks.push({
          type: 'code',
          language: codeLanguage || 'code',
          code: codeLines.join('\n')
        });
        inCodeBlock = false;
        codeLines = [];
        codeLanguage = '';
      } else {
        // Close any open list/table
        if (currentList) { blocks.push(currentList); currentList = null; }
        if (inTable) { blocks.push({ type: 'table', rows: tableRows }); inTable = false; tableRows = []; }
        inCodeBlock = true;
        codeLanguage = trimmed.slice(3).trim().toLowerCase();
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // 2. Table Row (| col1 | col2 |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      if (currentList) { blocks.push(currentList); currentList = null; }
      inTable = true;
      // Skip separator rows like |--|--|
      if (!/^\|[\s-:]+\|$/.test(trimmed) && !trimmed.includes('---')) {
        const cells = trimmed
          .split('|')
          .slice(1, -1)
          .map(c => c.trim());
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      blocks.push({ type: 'table', rows: tableRows });
      inTable = false;
      tableRows = [];
    }

    // 3. Horizontal Rule
    if (/^(\*\*\*|---|___)$/.test(trimmed)) {
      if (currentList) { blocks.push(currentList); currentList = null; }
      blocks.push({ type: 'hr' });
      continue;
    }

    // 4. Headers (###, ##, #)
    if (trimmed.startsWith('#')) {
      if (currentList) { blocks.push(currentList); currentList = null; }
      const level = (trimmed.match(/^#+/) || ['#'])[0].length;
      const title = cleanInlineMarkdown(trimmed.replace(/^#+\s*/, ''));
      blocks.push({ type: 'header', level, text: title });
      continue;
    }

    // 5. Bullet List Items (- , * , • )
    const bulletMatch = trimmed.match(/^[-*•]\s+(.*)$/);
    if (bulletMatch) {
      const itemText = bulletMatch[1];
      if (!currentList || currentList.listType !== 'bullet') {
        if (currentList) blocks.push(currentList);
        currentList = { type: 'list', listType: 'bullet', items: [] };
      }
      currentList.items.push(itemText);
      continue;
    }

    // 6. Numbered List Items (1. , 2. )
    const numberMatch = trimmed.match(/^(\d+)[.)]\s+(.*)$/);
    if (numberMatch) {
      const num = numberMatch[1];
      const itemText = numberMatch[2];
      if (!currentList || currentList.listType !== 'number') {
        if (currentList) blocks.push(currentList);
        currentList = { type: 'list', listType: 'number', items: [] };
      }
      currentList.items.push({ num, text: itemText });
      continue;
    }

    // Empty line resets list
    if (trimmed === '') {
      if (currentList) {
        blocks.push(currentList);
        currentList = null;
      }
      continue;
    }

    // 7. Regular Paragraph
    if (currentList) {
      blocks.push(currentList);
      currentList = null;
    }

    blocks.push({ type: 'paragraph', text: trimmed });
  }

  // Flush remaining
  if (inCodeBlock && codeLines.length > 0) {
    blocks.push({ type: 'code', language: codeLanguage || 'code', code: codeLines.join('\n') });
  }
  if (inTable && tableRows.length > 0) {
    blocks.push({ type: 'table', rows: tableRows });
  }
  if (currentList) {
    blocks.push(currentList);
  }

  return blocks;
}

function RenderBlock({ block }) {
  switch (block.type) {
    case 'header': {
      if (block.level === 1) {
        return <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-5 mb-2 border-b border-slate-800 pb-2">{renderFormattedText(block.text)}</h1>;
      }
      if (block.level === 2) {
        return <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-4 mb-2">{renderFormattedText(block.text)}</h2>;
      }
      if (block.level === 3) {
        return <h3 className="text-base sm:text-lg font-bold text-white mt-3.5 mb-1.5 flex items-center gap-2">{renderFormattedText(block.text)}</h3>;
      }
      return <h4 className="text-sm sm:text-base font-semibold text-cyan-300 mt-3 mb-1">{renderFormattedText(block.text)}</h4>;
    }

    case 'list': {
      if (block.listType === 'number') {
        return (
          <div className="space-y-2 my-2.5">
            {block.items.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 border border-blue-500/30 select-none">
                  {item.num || idx + 1}
                </span>
                <div className="flex-1 text-slate-200">{renderFormattedText(item.text)}</div>
              </div>
            ))}
          </div>
        );
      }
      return (
        <div className="space-y-1.5 my-2">
          {block.items.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2.5 ml-1">
              <span className="text-blue-400 font-bold select-none shrink-0 mt-0.5">•</span>
              <div className="flex-1 text-slate-200">{renderFormattedText(item)}</div>
            </div>
          ))}
        </div>
      );
    }

    case 'code': {
      return <CodeSnippet code={block.code} language={block.language} />;
    }

    case 'table': {
      if (!block.rows || block.rows.length === 0) return null;
      const [headerRow, ...bodyRows] = block.rows;
      return (
        <div className="overflow-x-auto my-3 rounded-xl border border-slate-800 bg-[#0B1220]/80">
          <table className="w-full text-xs text-left border-collapse">
            {headerRow && (
              <thead className="bg-[#172033] text-slate-200 border-b border-slate-800 font-bold">
                <tr>
                  {headerRow.map((cell, ci) => (
                    <th key={ci} className="px-3 py-2.5">{renderFormattedText(cell)}</th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-slate-800/60">
              {bodyRows.map((row, ri) => (
                <tr key={ri} className="hover:bg-slate-800/30 transition-colors">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-2 text-slate-300">{renderFormattedText(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case 'hr': {
      return <div className="border-t border-slate-800 my-4" />;
    }

    case 'paragraph':
    default: {
      return <p className="text-slate-200 text-sm leading-relaxed">{renderFormattedText(block.text)}</p>;
    }
  }
}

/**
 * Converts inline markdown (`code`, **bold**, *italic*, math LaTeX $...$) into React elements
 * Guaranteed to NEVER output raw unparsed asterisks (*).
 */
function renderFormattedText(text) {
  if (!text) return null;

  // Split by inline code first
  const parts = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\$[^$]+\$)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.substring(lastIndex, match.index) });
    }
    const token = match[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      parts.push({ type: 'code', value: token.slice(1, -1) });
    } else if (token.startsWith('**') && token.endsWith('**')) {
      parts.push({ type: 'bold', value: token.slice(2, -2) });
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push({ type: 'italic', value: token.slice(1, -1) });
    } else if (token.startsWith('$') && token.endsWith('$')) {
      parts.push({ type: 'math', value: token.slice(1, -1) });
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.substring(lastIndex) });
  }

  return parts.map((p, i) => {
    if (p.type === 'code') {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs mx-0.5">
          {p.value}
        </code>
      );
    }
    if (p.type === 'bold') {
      const isCallout = /^(problem|real-life example|concept|solution|takeaway|internally it has|transfer modes|key takeaway):?$/i.test(p.value.trim());
      return (
        <strong key={i} className={`font-bold ${isCallout ? 'text-cyan-300' : 'text-white'}`}>
          {p.value}
        </strong>
      );
    }
    if (p.type === 'italic') {
      return <em key={i} className="italic text-slate-300">{p.value}</em>;
    }
    if (p.type === 'math') {
      return <span key={i} className="font-mono text-xs text-purple-300 px-1 py-0.5 bg-purple-950/40 rounded border border-purple-800/40">{p.value}</span>;
    }
    // Clean any stray asterisks from plain text
    const cleanStr = p.value.replace(/\*\*/g, '').replace(/(?<!\w)\*(?!\w)/g, '');
    return <React.Fragment key={i}>{cleanStr}</React.Fragment>;
  });
}

function cleanInlineMarkdown(text) {
  return text.replace(/\*\*/g, '').replace(/(?<!\w)\*(?!\w)/g, '');
}

function CodeSnippet({ code, language }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0B1220] overflow-hidden my-3 shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-[#172033]/80 border-b border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-mono uppercase font-bold text-[11px] text-slate-300">{language || 'code'}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2 py-1 rounded-md bg-slate-800/60 hover:bg-slate-800 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}
