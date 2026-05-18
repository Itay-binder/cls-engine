'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Video,
  File,
  Trash2,
  Copy,
  Check,
  Eye,
  ChevronDown,
  X,
  Loader2,
  ImageOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { getOrCreateWorkspace } from '@/lib/workspace';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

// ─── Types ────────────────────────────────────────────────────────────────────

type CreativeStatus = 'draft' | 'ready' | 'published';

interface CreativeAsset {
  id: string;
  workspace_id: string;
  title: string | null;
  hook: string | null;
  script: string | null;
  caption: string | null;
  visual_prompt: string | null;
  production_notes: string[] | null;
  creative_type: string | null;
  platform: string | null;
  format: string | null;
  language: string | null;
  cta: string | null;
  status: CreativeStatus | null;
  created_at: string;
}

interface StorageFile {
  name: string;
  id: string;
  created_at: string;
  metadata: {
    size: number;
    mimetype: string;
  } | null;
  publicUrl?: string;
}

// ─── Concept badge color map ──────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  ugc: 'bg-[#7C3AED]/15 text-[#8B5CF6] border-[#7C3AED]/20',
  founder: 'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/20',
  authority: 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/20',
  problem: 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/20',
  comparison: 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/20',
  testimonial: 'bg-[#EC4899]/15 text-[#EC4899] border-[#EC4899]/20',
  story: 'bg-[#6366F1]/15 text-[#6366F1] border-[#6366F1]/20',
};

const STATUS_CONFIG: Record<CreativeStatus, { label: string; class: string }> = {
  draft: { label: 'Draft', class: 'bg-[var(--color-border)] text-[var(--color-text-muted)]' },
  ready: { label: 'Ready', class: 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/20' },
  published: { label: 'Published', class: 'bg-[#7C3AED]/15 text-[#8B5CF6] border-[#7C3AED]/20' },
};

const STATUS_CYCLE: Record<CreativeStatus, CreativeStatus> = {
  draft: 'ready',
  ready: 'published',
  published: 'draft',
};

// ─── Format helpers ───────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Copy Button ──────────────────────────────────────────────────────────────

function CopyButton({ text, label = 'Copy Script' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={handle}>
      {copied ? <Check className="w-3 h-3 text-[var(--color-success)]" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied!' : label}
    </Button>
  );
}

// ─── Full Brief Dialog ────────────────────────────────────────────────────────

function BriefDialog({ asset, open, onClose }: { asset: CreativeAsset; open: boolean; onClose: () => void }) {
  const sections = [
    { label: 'Hook', content: asset.hook },
    { label: 'Script', content: asset.script },
    { label: 'Caption', content: asset.caption },
    { label: 'Visual Prompt', content: asset.visual_prompt },
  ].filter((s) => s.content);

  const notes = asset.production_notes ?? [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-[var(--color-card)] border-[var(--color-border)]">
        <DialogHeader>
          <DialogTitle className="text-[var(--color-text)]">
            {asset.title ?? asset.hook ?? 'Creative Brief'}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-5 mt-2">
          {/* Meta row */}
          <div className="flex flex-wrap gap-2">
            {asset.creative_type && (
              <span className={cn('px-2 py-0.5 rounded-full text-xs border font-medium', TYPE_COLORS[asset.creative_type] ?? 'bg-[var(--color-border)] text-[var(--color-text-muted)]')}>
                {asset.creative_type}
              </span>
            )}
            {asset.platform && <Badge variant="outline" className="text-xs">{asset.platform}</Badge>}
            {asset.format && <Badge variant="outline" className="text-xs">{asset.format}</Badge>}
            {asset.language && <Badge variant="outline" className="text-xs">{asset.language}</Badge>}
            {asset.cta && <Badge variant="secondary" className="text-xs">CTA: {asset.cta}</Badge>}
          </div>

          {sections.map((s) => (
            <div key={s.label} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{s.label}</p>
                <CopyButton text={s.content!} label="Copy" />
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-line leading-relaxed bg-[var(--color-background)] rounded-lg p-4 border border-[var(--color-border-subtle)]">
                {s.content}
              </p>
            </div>
          ))}

          {notes.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Production Notes</p>
              <ul className="flex flex-col gap-1.5">
                {notes.map((note, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
                    <span className="w-5 h-5 rounded-full bg-[var(--color-accent-dim)] text-[var(--color-accent-light)] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Creative Card ────────────────────────────────────────────────────────────

function CreativeCard({ asset, onStatusChange }: { asset: CreativeAsset; onStatusChange: (id: string, status: CreativeStatus) => void }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toggling, setToggling] = useState(false);
  const status = (asset.status as CreativeStatus) ?? 'draft';
  const statusCfg = STATUS_CONFIG[status];
  const typeColor = asset.creative_type ? (TYPE_COLORS[asset.creative_type] ?? 'bg-[var(--color-border)] text-[var(--color-text-muted)]') : null;
  const preview = asset.script ? asset.script.slice(0, 100) : (asset.hook ?? '');

  const handleToggle = async () => {
    setToggling(true);
    const next = STATUS_CYCLE[status];
    const supabase = createClient();
    await supabase.from('creative_assets').update({ status: next }).eq('id', asset.id);
    onStatusChange(asset.id, next);
    setToggling(false);
  };

  return (
    <>
      <Card className="flex flex-col hover:border-[var(--color-accent)]/30 transition-all duration-200 overflow-hidden">
        <CardContent className="p-4 flex flex-col gap-3 h-full">
          {/* Top: type badge + status */}
          <div className="flex items-center justify-between gap-2">
            {typeColor ? (
              <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold border', typeColor)}>
                {asset.creative_type}
              </span>
            ) : (
              <span />
            )}
            <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold border', statusCfg.class)}>
              {statusCfg.label}
            </span>
          </div>

          {/* Title */}
          <p className="text-sm font-semibold text-[var(--color-text)] leading-snug line-clamp-2">
            {asset.title ?? asset.hook ?? '—'}
          </p>

          {/* Angle chips */}
          <div className="flex flex-wrap gap-1">
            {asset.platform && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
                {asset.platform}
              </span>
            )}
            {asset.format && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
                {asset.format}
              </span>
            )}
            {asset.language && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
                {asset.language}
              </span>
            )}
          </div>

          {/* Preview */}
          {preview && (
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed line-clamp-3 flex-1">
              {preview}{asset.script && asset.script.length > 100 ? '…' : ''}
            </p>
          )}

          {/* Bottom row */}
          <div className="flex items-center gap-2 pt-1 mt-auto border-t border-[var(--color-border-subtle)]">
            {asset.script && <CopyButton text={asset.script} />}
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 h-7 text-xs ml-auto"
              onClick={() => setDialogOpen(true)}
            >
              <Eye className="w-3 h-3" />
              View Full
            </Button>
            <button
              onClick={handleToggle}
              disabled={toggling}
              className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              title="Cycle status"
            >
              {toggling ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </CardContent>
      </Card>

      {dialogOpen && (
        <BriefDialog asset={asset} open={dialogOpen} onClose={() => setDialogOpen(false)} />
      )}
    </>
  );
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────

function DeleteConfirmDialog({
  fileName,
  open,
  onClose,
  onConfirm,
  deleting,
}: {
  fileName: string;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm bg-[var(--color-card)] border-[var(--color-border)]">
        <DialogHeader>
          <DialogTitle className="text-[var(--color-text)]">Delete file?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          <span className="font-medium text-[var(--color-text)]">{fileName}</span> will be permanently deleted.
        </p>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-[var(--color-danger)] hover:bg-[var(--color-danger)]/80 text-white border-0"
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Upload File Card ─────────────────────────────────────────────────────────

function UploadFileCard({
  file,
  workspaceId,
  onDelete,
}: {
  file: StorageFile;
  workspaceId: string;
  onDelete: (name: string) => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const mime = file.metadata?.mimetype ?? '';
  const isImage = mime.startsWith('image/');
  const isVideo = mime.startsWith('video/');
  const size = file.metadata?.size ?? 0;

  const handleDelete = async () => {
    setDeleting(true);
    const supabase = createClient();
    await supabase.storage.from('media').remove([`${workspaceId}/${file.name}`]);
    setDeleting(false);
    setConfirmOpen(false);
    onDelete(file.name);
  };

  return (
    <>
      <Card className="overflow-hidden hover:border-[var(--color-accent)]/30 transition-all duration-200">
        {/* Thumbnail / Icon */}
        <div className="relative h-36 bg-[var(--color-background)] border-b border-[var(--color-border)] flex items-center justify-center">
          {isImage && file.publicUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={file.publicUrl}
              alt={file.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : isVideo ? (
            <Video className="w-10 h-10 text-[var(--color-text-muted)]" />
          ) : (
            <File className="w-10 h-10 text-[var(--color-text-muted)]" />
          )}
        </div>

        <CardContent className="p-3 flex flex-col gap-2">
          <p className="text-xs font-medium text-[var(--color-text)] truncate" title={file.name}>
            {file.name}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[var(--color-text-muted)]">{formatDate(file.created_at)}</span>
              {size > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
                  {formatBytes(size)}
                </span>
              )}
            </div>
            <button
              onClick={() => setConfirmOpen(true)}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        fileName={file.name}
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MediaLibraryPage() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [creatives, setCreatives] = useState<CreativeAsset[]>([]);
  const [uploads, setUploads] = useState<StorageFile[]>([]);
  const [loadingCreatives, setLoadingCreatives] = useState(true);
  const [loadingUploads, setLoadingUploads] = useState(true);
  const [activeTab, setActiveTab] = useState<'creatives' | 'uploads'>('creatives');
  const [filterStatus, setFilterStatus] = useState<'all' | CreativeStatus>('all');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load workspace + data
  const init = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const wsId = await getOrCreateWorkspace(supabase, user.id);
    setWorkspaceId(wsId);

    // Load creatives
    const { data: creativesData } = await supabase
      .from('creative_assets')
      .select('*')
      .eq('workspace_id', wsId)
      .order('created_at', { ascending: false });

    setCreatives((creativesData as CreativeAsset[]) ?? []);
    setLoadingCreatives(false);

    // Load uploads from storage
    const { data: storageData } = await supabase.storage.from('media').list(wsId, {
      sortBy: { column: 'created_at', order: 'desc' },
    });

    if (storageData) {
      const files: StorageFile[] = storageData
        .filter((f) => f.name !== '.emptyFolderPlaceholder')
        .map((f) => {
          const { data: urlData } = supabase.storage
            .from('media')
            .getPublicUrl(`${wsId}/${f.name}`);
          return {
            ...f,
            publicUrl: urlData?.publicUrl,
          } as StorageFile;
        });
      setUploads(files);
    }
    setLoadingUploads(false);
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  // Handle upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !workspaceId) return;

    // Validate
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!allowedTypes.includes(file.type)) {
      alert('Unsupported file type. Allowed: JPG, PNG, WebP, MP4, MOV');
      return;
    }
    if (file.size > maxSize) {
      alert('File too large. Max size is 50MB.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    // Fake progress while uploading
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 15, 85));
    }, 200);

    const supabase = createClient();
    const path = `${workspaceId}/${file.name}`;
    const { error } = await supabase.storage.from('media').upload(path, file, { upsert: true });

    clearInterval(progressInterval);
    setUploadProgress(100);

    if (!error) {
      // Refresh uploads
      const { data: storageData } = await supabase.storage.from('media').list(workspaceId, {
        sortBy: { column: 'created_at', order: 'desc' },
      });
      if (storageData) {
        const files: StorageFile[] = storageData
          .filter((f) => f.name !== '.emptyFolderPlaceholder')
          .map((f) => {
            const { data: urlData } = supabase.storage
              .from('media')
              .getPublicUrl(`${workspaceId}/${f.name}`);
            return { ...f, publicUrl: urlData?.publicUrl } as StorageFile;
          });
        setUploads(files);
      }
    }

    setTimeout(() => {
      setUploading(false);
      setUploadProgress(0);
    }, 600);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleStatusChange = (id: string, status: CreativeStatus) => {
    setCreatives((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  };

  const handleDeleteUpload = (name: string) => {
    setUploads((prev) => prev.filter((f) => f.name !== name));
  };

  const filteredCreatives = filterStatus === 'all'
    ? creatives
    : creatives.filter((c) => (c.status ?? 'draft') === filterStatus);

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Media Library</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Your creative assets and visuals</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Filter row */}
          <div className="flex items-center gap-1.5 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-1">
            {(['all', 'draft', 'ready', 'published'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                  filterStatus === s
                    ? 'bg-[var(--color-accent-dim)] text-[var(--color-accent-light)] border border-[var(--color-accent)]/20'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                )}
              >
                {s === 'all' ? 'All' : STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>

          {/* Upload button */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.mp4,.mov"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            className="gap-2 gradient-accent border-0 shadow-md shadow-[var(--color-accent)]/20 hover:brightness-110"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Upload
          </Button>
        </div>
      </div>

      {/* Upload Progress Bar */}
      {uploading && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--color-text-muted)]">Uploading...</p>
            <p className="text-xs font-medium text-[var(--color-accent-light)]">{uploadProgress}%</p>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="creatives" className="gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" />
            Creatives
            {!loadingCreatives && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-[var(--color-border)] text-[var(--color-text-muted)]">
                {creatives.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="uploads" className="gap-1.5">
            <Upload className="w-3.5 h-3.5" />
            Uploads
            {!loadingUploads && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-[var(--color-border)] text-[var(--color-text-muted)]">
                {uploads.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Creatives Tab */}
        <TabsContent value="creatives" className="mt-6">
          {loadingCreatives ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="shimmer h-52 rounded-xl" />
              ))}
            </div>
          ) : filteredCreatives.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] flex items-center justify-center">
                <ImageOff className="w-8 h-8 text-[var(--color-text-muted)]" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-semibold text-[var(--color-text)]">
                  {filterStatus === 'all' ? 'No creatives saved yet' : `No ${filterStatus} creatives`}
                </h3>
                <p className="text-sm text-[var(--color-text-muted)] mt-1 max-w-xs">
                  {filterStatus === 'all'
                    ? 'Generate creatives in the Creative Studio and save them to your library.'
                    : 'Change the filter or save more creatives.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredCreatives.map((asset) => (
                <CreativeCard
                  key={asset.id}
                  asset={asset}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Uploads Tab */}
        <TabsContent value="uploads" className="mt-6">
          {loadingUploads ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="shimmer h-48 rounded-xl" />
              ))}
            </div>
          ) : uploads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] flex items-center justify-center">
                <Upload className="w-8 h-8 text-[var(--color-text-muted)]" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-semibold text-[var(--color-text)]">No files uploaded yet</h3>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">
                  Upload images or videos using the Upload button above.
                </p>
              </div>
              <Button
                className="gap-2 gradient-accent border-0"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4" />
                Upload your first file
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {workspaceId && uploads.map((file) => (
                <UploadFileCard
                  key={file.id ?? file.name}
                  file={file}
                  workspaceId={workspaceId}
                  onDelete={handleDeleteUpload}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
