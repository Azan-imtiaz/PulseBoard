import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FileText, Paperclip, X } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { fileSize } from '@/lib/format';
import { upsertTask } from '@/features/boards/api';

// fetch() can't report upload progress, so the PUT to storage goes through XHR.
function putFile(url, file, headers, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    Object.entries(headers).forEach(([name, value]) => xhr.setRequestHeader(name, value));
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new Error('Upload failed. Check your connection and try again.'));
    xhr.send(file);
  });
}

// Matches the server's limit; checked here so big files fail before uploading.
const MAX_BYTES = 25 * 1024 * 1024;

export function Attachments({ task }) {
  const queryClient = useQueryClient();
  const input = useRef(null);
  const [uploads, setUploads] = useState([]);
  const [dragOver, setDragOver] = useState(false);

  const setProgress = (id, progress) => setUploads((all) => all.map((u) => (u.id === id ? { ...u, progress } : u)));

  async function upload(file) {
    if (file.size > MAX_BYTES) {
      toast.error(`${file.name} is too big. Files can be up to 25 MB.`);
      return;
    }
    const id = crypto.randomUUID();
    setUploads((all) => [...all, { id, name: file.name, progress: 0 }]);
    try {
      const target = await api(`/tasks/${task.id}/attachments/upload-url`, {
        method: 'POST',
        body: { name: file.name, contentType: file.type || 'application/octet-stream', size: file.size },
      });
      await putFile(target.uploadUrl, file, target.headers, (p) => setProgress(id, p));
      const { task: updated } = await api(`/tasks/${task.id}/attachments`, {
        method: 'POST',
        body: { key: target.key, name: file.name },
      });
      upsertTask(queryClient, updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploads((all) => all.filter((u) => u.id !== id));
    }
  }

  async function download(attachmentId) {
    try {
      const { url } = await api(`/tasks/${task.id}/attachments/${attachmentId}/url`);
      window.open(url, '_blank', 'noopener');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Download failed');
    }
  }

  async function removeAttachment(attachmentId) {
    try {
      const { task: updated } = await api(`/tasks/${task.id}/attachments/${attachmentId}`, { method: 'DELETE' });
      upsertTask(queryClient, updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not remove attachment');
    }
  }

  return (
    <section
      className={cn('-mx-2 mt-4 rounded-lg p-2 transition-colors', dragOver && 'bg-accent-soft')}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        Array.from(e.dataTransfer.files).forEach(upload);
      }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-fg-muted">
          Attachments {task.attachments.length > 0 && <span className="text-fg-faint">{task.attachments.length}</span>}
        </h3>
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="inline-flex h-6 items-center gap-1 rounded-md px-1.5 text-xs text-fg-muted hover:bg-hover hover:text-fg"
        >
          <Paperclip className="size-3" />
          Attach file
        </button>
        <input
          ref={input}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            Array.from(e.target.files ?? []).forEach(upload);
            e.target.value = '';
          }}
        />
      </div>

      {task.attachments.length === 0 && uploads.length === 0 && (
        <p className="mt-1 text-xs text-fg-faint">Drop files here, up to 25 MB each.</p>
      )}

      <ul className="mt-1.5 space-y-1">
        {task.attachments.map((attachment) => (
          <li
            key={attachment.id}
            className="group flex h-9 items-center gap-2.5 rounded-md border border-line px-2.5 hover:border-line-strong"
          >
            <FileText className="size-4 shrink-0 text-fg-faint" />
            <button
              type="button"
              onClick={() => download(attachment.id)}
              className="min-w-0 flex-1 truncate text-left text-sm hover:underline"
            >
              {attachment.name}
            </button>
            <span className="text-xs text-fg-faint">{fileSize(attachment.size)}</span>
            <button
              type="button"
              aria-label={`Remove ${attachment.name}`}
              onClick={() => removeAttachment(attachment.id)}
              className="text-fg-faint opacity-0 group-hover:opacity-100 hover:text-fg"
            >
              <X className="size-3.5" />
            </button>
          </li>
        ))}
        {uploads.map((u) => (
          <li
            key={u.id}
            className="relative flex h-9 items-center gap-2.5 overflow-hidden rounded-md border border-line px-2.5"
          >
            <span
              className="absolute inset-y-0 left-0 bg-accent-soft transition-[width] duration-200"
              style={{ width: `${u.progress * 100}%` }}
            />
            <FileText className="relative size-4 shrink-0 text-fg-faint" />
            <span className="relative min-w-0 flex-1 truncate text-sm text-fg-muted">{u.name}</span>
            <span className="relative text-xs text-fg-faint tabular-nums">{Math.round(u.progress * 100)}%</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
