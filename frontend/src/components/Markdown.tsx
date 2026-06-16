'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Theme-styled markdown renderer for article posts. Uses react-markdown
 * (no raw HTML → XSS-safe) with remark-gfm for tables/strikethrough/task-lists.
 * Component overrides give headings/lists/quotes/code/images the app's look.
 */
export default function Markdown({ children }: { children: string }) {
  return (
    <div className="text-sm leading-relaxed text-[--foreground]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="mb-2 mt-4 text-xl font-bold text-[--foreground] first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-2 mt-4 text-lg font-bold text-[--foreground] first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-1.5 mt-3 text-base font-semibold text-[--foreground] first:mt-0">{children}</h3>,
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-[--accent] underline underline-offset-2">
              {children}
            </a>
          ),
          strong: ({ children }) => <strong className="font-bold text-[--foreground]">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => <ul className="mb-3 ml-5 list-disc space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="mb-3 ml-5 list-decimal space-y-1">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="mb-3 border-l-2 border-[--accent] pl-3 italic text-[--muted]">{children}</blockquote>
          ),
          code: ({ children }) => (
            <code className="rounded bg-[--surface-secondary] px-1.5 py-0.5 font-mono text-[0.85em] text-[--foreground]">{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="mb-3 overflow-x-auto rounded-lg bg-[--surface-secondary] p-3 text-xs">{children}</pre>
          ),
          hr: () => <hr className="my-4 border-[--surface-secondary]" />,
          img: ({ src, alt }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={typeof src === 'string' ? src : ''} alt={alt ?? ''} className="my-3 max-h-[28rem] w-full rounded-lg object-cover" />
          ),
          table: ({ children }) => (
            <div className="mb-3 overflow-x-auto"><table className="w-full border-collapse text-left">{children}</table></div>
          ),
          th: ({ children }) => <th className="border border-[--surface-secondary] px-2 py-1 font-semibold">{children}</th>,
          td: ({ children }) => <td className="border border-[--surface-secondary] px-2 py-1">{children}</td>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
