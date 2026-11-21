export default function ReviewReplyComposer({
  replyText,
  onAiReply,
  onCancel,
  onChange,
  onSend,
}: {
  replyText: string;
  onAiReply: () => void;
  onCancel: () => void;
  onChange: (value: string) => void;
  onSend: () => void;
}) {
  return (
    <div className="mt-3 space-y-2 bg-surface-raised p-3 rounded-lg border border-line">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-fg">Response Composer</span>
        <button
          onClick={onAiReply}
          className="px-2 py-1 text-xs font-medium bg-accent-blue text-white rounded hover:bg-accent-blue flex items-center gap-1 shadow-sm"
        >
          ✨ AI Auto-Reply Assistant
        </button>
      </div>
      <textarea
        rows={2}
        className="w-full text-xs p-2 rounded border border-line focus:outline-none focus:ring-2 focus:ring-fg"
        placeholder="Write a professional response or click AI Auto-Reply Assistant..."
        value={replyText}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-2.5 py-1 text-xs font-medium text-fg-secondary hover:bg-interactive-hover rounded"
        >
          Cancel
        </button>
        <button
          onClick={onSend}
          className="px-3 py-1 text-xs font-medium bg-accent-blue text-white rounded hover:bg-accent-blue"
        >
          Send Response
        </button>
      </div>
    </div>
  );
}
