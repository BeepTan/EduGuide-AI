import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import mermaid from 'mermaid';
import 'katex/dist/katex.min.css'; // Import KaTeX styles for math rendering

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

const MermaidRender: React.FC<{ chart: string }> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');

  useEffect(() => {
    const renderChart = async () => {
      if (containerRef.current) {
        try {
          const id = `mermaid-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const { svg } = await mermaid.render(id, chart);
          setSvgContent(svg);
        } catch (error) {
          console.error('Mermaid rendering error:', error);
          setSvgContent(`<div class="text-red-500">Error rendering diagram</div>`);
        }
      }
    };
    renderChart();
  }, [chart]);

  return <div ref={containerRef} dangerouslySetInnerHTML={{ __html: svgContent }} className="flex justify-center my-6 overflow-x-auto min-w-full" />;
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`prose prose-sm md:prose-base prose-indigo max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            if (!inline && match && match[1] === 'mermaid') {
              return <MermaidRender chart={String(children).replace(/\n$/, '')} />;
            }
            return !inline ? (
              <div className="bg-gray-800 text-gray-100 rounded-md p-3 my-2 overflow-x-auto text-sm">
                <code className={className} {...props}>{children}</code>
              </div>
            ) : (
              <code className="bg-gray-200 text-red-600 rounded px-1 py-0.5 text-sm" {...props}>
                {children}
              </code>
            );
          },
          ul({ children }) { return <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul> },
          ol({ children }) { return <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol> },
          h1({ children }) { return <h1 className="text-2xl font-bold mt-4 mb-2 text-indigo-700">{children}</h1> },
          h2({ children }) { return <h2 className="text-xl font-bold mt-3 mb-2 text-indigo-600">{children}</h2> },
          h3({ children }) { return <h3 className="text-lg font-semibold mt-2 mb-1 text-indigo-500">{children}</h3> },
          p({ children }) { return <p className="mb-2 leading-relaxed text-gray-700">{children}</p> },
          blockquote({ children }) { return <blockquote className="border-l-4 border-indigo-300 pl-4 italic text-gray-600 my-2">{children}</blockquote> },
          table({ children }) { return <div className="overflow-x-auto my-2"><table className="min-w-full divide-y divide-gray-200 border">{children}</table></div> },
          th({ children }) { return <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{children}</th> },
          td({ children }) { return <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 border-t">{children}</td> }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;