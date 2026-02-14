import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  children: string;
  className?: string;
}

export function MarkdownRenderer({ children, className }: Props) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ ...props }) => (
            <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />
          ),
          h2: ({ ...props }) => (
            <h2
              className="text-xl font-bold mt-5 mb-3 border-b pb-1"
              {...props}
            />
          ),
          h3: ({ ...props }) => (
            <h3 className="text-lg font-bold mt-4 mb-2" {...props} />
          ),
          ul: ({ ...props }) => (
            <ul className="list-disc pl-6 mb-4 space-y-1" {...props} />
          ),
          ol: ({ ...props }) => (
            <ol className="list-decimal pl-6 mb-4 space-y-1" {...props} />
          ),
          li: ({ ...props }) => <li className="leading-relaxed" {...props} />,
          table: ({ ...props }) => (
            <div className="overflow-x-auto my-4 border rounded-lg">
              <table
                className="min-w-full divide-y divide-gray-200"
                {...props}
              />
            </div>
          ),
          th: ({ ...props }) => (
            <th
              className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              {...props}
            />
          ),
          td: ({ ...props }) => (
            <td
              className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 border-t"
              {...props}
            />
          ),
          blockquote: ({ ...props }) => (
            <blockquote
              className="border-l-4 border-blue-500 pl-4 py-1 my-4 bg-blue-50 italic text-gray-700"
              {...props}
            />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
