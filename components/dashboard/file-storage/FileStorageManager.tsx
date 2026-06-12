"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/site/Button";
import { Card } from "@/components/site/Card";
import {
  AlertBanner,
  EmptyState,
  FormField,
  InfoBanner,
  Input,
  ListToolbar,
  Modal,
  SkeletonCardList,
} from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import {
  browseStorage,
  createStorageFolder,
  deleteStorageFile,
  deleteStorageFolder,
  fetchStorageTree,
  migrateLegacyStorageFiles,
  moveStorageFile,
  moveStorageFolder,
  renameStorageFile,
  renameStorageFolder,
  searchStorage,
  uploadStorageFiles,
} from "@/lib/file-storage/client";
import type {
  StorageBrowseResult,
  StorageFileRecord,
  StorageFolderRecord,
  StorageFolderTreeNode,
  StorageSearchResult,
  StorageSortDirection,
  StorageSortField,
} from "@/lib/file-storage/types";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: unknown): string {
  if (typeof value !== "string") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function fileTypeLabel(file: StorageFileRecord): string {
  const ext = file.fileExtension.replace(".", "").toUpperCase();
  if (ext) return ext;
  if (file.mimeType === "application/pdf") return "PDF";
  if (file.mimeType.startsWith("image/")) return "Image";
  if (file.mimeType.startsWith("video/")) return "Video";
  if (file.mimeType.includes("word")) return "Word";
  if (file.mimeType.includes("sheet") || file.mimeType.includes("excel")) return "Excel";
  if (file.mimeType.includes("presentation") || file.mimeType.includes("powerpoint")) return "PPT";
  return "File";
}

function FolderIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
    </svg>
  );
}

function FileIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

type MoveTarget = { type: "folder" | "file"; item: StorageFolderRecord | StorageFileRecord };

function FolderTreeNode({
  node,
  currentFolderId,
  onSelect,
  depth = 0,
}: {
  node: StorageFolderTreeNode;
  currentFolderId: string | null;
  onSelect: (id: string) => void;
  depth?: number;
}) {
  const isActive = currentFolderId === node.id;
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(node.id)}
        className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
          isActive
            ? "bg-brand-blue/10 font-semibold text-brand-blue"
            : "text-brand-charcoal hover:bg-gray-100"
        }`}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
      >
        <FolderIcon className="h-4 w-4 shrink-0 text-gold-500" />
        <span className="truncate">{node.name}</span>
      </button>
      {node.children.length > 0 && (
        <ul className="mt-0.5 space-y-0.5">
          {node.children.map((child) => (
            <FolderTreeNode
              key={child.id}
              node={child}
              currentFolderId={currentFolderId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function FolderPicker({
  tree,
  excludeFolderId,
  value,
  onChange,
}: {
  tree: StorageFolderTreeNode[];
  excludeFolderId?: string;
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  function renderNodes(nodes: StorageFolderTreeNode[], depth = 0): React.ReactNode {
    return nodes.map((node) => {
      if (node.id === excludeFolderId) return null;
      const selected = value === node.id;
      return (
        <div key={node.id}>
          <button
            type="button"
            onClick={() => onChange(node.id)}
            className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm ${
              selected ? "bg-brand-blue/10 font-semibold text-brand-blue" : "hover:bg-gray-100"
            }`}
            style={{ paddingLeft: `${8 + depth * 12}px` }}
          >
            <FolderIcon className="h-4 w-4 text-gold-500" />
            {node.name}
          </button>
          {node.children.length > 0 ? renderNodes(node.children, depth + 1) : null}
        </div>
      );
    });
  }

  return (
    <div className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-gray-200 p-2">
      <button
        type="button"
        onClick={() => onChange(null)}
        className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm ${
          value === null ? "bg-brand-blue/10 font-semibold text-brand-blue" : "hover:bg-gray-100"
        }`}
      >
        <FolderIcon className="h-4 w-4 text-gold-500" />
        File Storage (root)
      </button>
      {renderNodes(tree)}
    </div>
  );
}

export function FileStorageManager() {
  const { isAdmin } = useAuth();
  const canWrite = isAdmin;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tree, setTree] = useState<StorageFolderTreeNode[]>([]);
  const [browse, setBrowse] = useState<StorageBrowseResult | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [b2Configured, setB2Configured] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sortBy, setSortBy] = useState<StorageSortField>("name");
  const [sortDirection, setSortDirection] = useState<StorageSortDirection>("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<StorageSearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [renameTarget, setRenameTarget] = useState<MoveTarget | null>(null);

  const [moveOpen, setMoveOpen] = useState(false);
  const [moveTarget, setMoveTarget] = useState<MoveTarget | null>(null);
  const [moveDestinationId, setMoveDestinationId] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MoveTarget | null>(null);
  const [deleteRecursive, setDeleteRecursive] = useState(true);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function checkB2() {
      try {
        const response = await fetch("/api/health", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { b2Configured?: boolean };
        if (!cancelled) setB2Configured(data.b2Configured === true);
      } catch {
        if (!cancelled) setB2Configured(null);
      }
    }
    void checkB2();
    return () => {
      cancelled = true;
    };
  }, []);

  const migratedRef = useRef(false);

  const load = useCallback(async () => {
    setError(null);
    const [treeData, browseData] = await Promise.all([
      fetchStorageTree(),
      browseStorage({ folderId: currentFolderId, sortBy, sortDirection }),
    ]);
    setTree(treeData);
    setBrowse(browseData);
  }, [currentFolderId, sortBy, sortDirection]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      setLoading(true);
      setError(null);
      try {
        if (canWrite && !migratedRef.current) {
          migratedRef.current = true;
          try {
            await migrateLegacyStorageFiles();
          } catch {
            // Migration is best-effort on first load.
          }
        }
        if (!cancelled) await load();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load file storage.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void init();
    return () => {
      cancelled = true;
    };
  }, [load, canWrite]);

  async function handleRefresh() {
    setRefreshing(true);
    setSearchResults(null);
    setSearchQuery("");
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  async function handleSearch() {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    setError(null);
    try {
      setSearchResults(await searchStorage(q));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setSearching(false);
    }
  }

  async function handleUploadFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    setMessage(null);
    try {
      await uploadStorageFiles({ files, folderId: currentFolderId });
      setMessage(
        files.length === 1 ? `Uploaded ${files[0].name}.` : `Uploaded ${files.length} files.`
      );
      setSearchResults(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim()) return;
    setProcessing(true);
    setModalError(null);
    try {
      await createStorageFolder({ name: newFolderName, parentId: currentFolderId });
      setMessage(`Created folder "${newFolderName.trim()}".`);
      setNewFolderOpen(false);
      setNewFolderName("");
      setModalError(null);
      await load();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Failed to create folder.");
    } finally {
      setProcessing(false);
    }
  }

  async function handleRename() {
    if (!renameTarget || !renameValue.trim()) return;
    setProcessing(true);
    setError(null);
    try {
      if (renameTarget.type === "folder") {
        await renameStorageFolder({
          id: renameTarget.item.id,
          name: renameValue,
        });
      } else {
        await renameStorageFile({
          id: renameTarget.item.id,
          displayName: renameValue,
        });
      }
      setMessage("Renamed successfully.");
      setRenameOpen(false);
      setRenameTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rename failed.");
    } finally {
      setProcessing(false);
    }
  }

  async function handleMove() {
    if (!moveTarget) return;
    setProcessing(true);
    setError(null);
    try {
      if (moveTarget.type === "folder") {
        await moveStorageFolder({
          id: moveTarget.item.id,
          destinationFolderId: moveDestinationId,
        });
      } else {
        await moveStorageFile({
          id: moveTarget.item.id,
          destinationFolderId: moveDestinationId,
        });
      }
      setMessage("Moved successfully.");
      setMoveOpen(false);
      setMoveTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Move failed.");
    } finally {
      setProcessing(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setProcessing(true);
    setModalError(null);
    try {
      if (deleteTarget.type === "folder") {
        await deleteStorageFolder({
          id: deleteTarget.item.id,
          recursive: deleteRecursive,
        });
      } else {
        await deleteStorageFile(deleteTarget.item.id);
      }
      setMessage("Deleted successfully.");
      setDeleteOpen(false);
      setDeleteTarget(null);
      setDeleteRecursive(true);
      setModalError(null);
      await load();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setProcessing(false);
    }
  }

  function openRename(target: MoveTarget) {
    setRenameTarget(target);
    setRenameValue(
      target.type === "folder"
        ? (target.item as StorageFolderRecord).name
        : (target.item as StorageFileRecord).displayName
    );
    setRenameOpen(true);
  }

  function openMove(target: MoveTarget) {
    setMoveTarget(target);
    setMoveDestinationId(null);
    setMoveOpen(true);
  }

  function openDelete(target: MoveTarget) {
    setDeleteTarget(target);
    setDeleteRecursive(target.type === "folder");
    setModalError(null);
    setDeleteOpen(true);
  }

  function closeDeleteModal() {
    setDeleteOpen(false);
    setDeleteTarget(null);
    setDeleteRecursive(true);
    setModalError(null);
  }

  function closeNewFolderModal() {
    setNewFolderOpen(false);
    setNewFolderName("");
    setModalError(null);
  }

  const breadcrumbs = browse?.breadcrumbs ?? [{ id: null, name: "File Storage", fullPath: "" }];
  const showingSearch = Boolean(searchResults && searchQuery.trim());
  const folders = showingSearch ? searchResults!.folders : (browse?.folders ?? []);
  const files = showingSearch ? searchResults!.files : (browse?.files ?? []);
  const isEmpty = !loading && folders.length === 0 && files.length === 0 && !showingSearch;

  return (
    <div className="space-y-4">
      {b2Configured === false ? (
        <AlertBanner variant="warning" title="Backblaze B2 not connected">
          File storage requires B2 environment variables. See docs/BACKBLAZE_B2_SETUP.md.
        </AlertBanner>
      ) : b2Configured === true ? (
        <InfoBanner>
          <strong className="text-brand-charcoal">Department file storage.</strong> Folders are
          managed here and stored in Backblaze B2 under <code className="text-xs">fire-storage/</code>.
          Uploads are limited to 4.5 MB per file on current hosting.
          {!canWrite && " You have read-only access."}
        </InfoBanner>
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Sidebar */}
        <aside
          className={`lg:block lg:w-64 lg:shrink-0 ${sidebarOpen ? "block" : "hidden"}`}
        >
          <Card className="p-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-brand-charcoal">Folders</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                Close
              </Button>
            </div>
            <button
              type="button"
              onClick={() => {
                setCurrentFolderId(null);
                setSearchResults(null);
                setSidebarOpen(false);
              }}
              className={`mb-2 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm ${
                currentFolderId === null
                  ? "bg-brand-blue/10 font-semibold text-brand-blue"
                  : "hover:bg-gray-100"
              }`}
            >
              <FolderIcon className="h-4 w-4 text-gold-500" />
              File Storage
            </button>
            <ul className="space-y-0.5">
              {tree.map((node) => (
                <FolderTreeNode
                  key={node.id}
                  node={node}
                  currentFolderId={currentFolderId}
                  onSelect={(id) => {
                    setCurrentFolderId(id);
                    setSearchResults(null);
                    setSidebarOpen(false);
                  }}
                />
              ))}
            </ul>
          </Card>
        </aside>

        {/* Main panel */}
        <div className="min-w-0 flex-1 space-y-4">
          <Card className="p-4">
            <ListToolbar
              title="File Storage"
              countLabel={
                showingSearch
                  ? `${folders.length + files.length} search result(s)`
                  : `${folders.length} folder(s), ${files.length} file(s)`
              }
              onRefresh={handleRefresh}
              refreshing={refreshing}
              actions={
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="lg:hidden"
                    onClick={() => setSidebarOpen(true)}
                  >
                    Folders
                  </Button>
                  {canWrite && (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={b2Configured === false || processing}
                        onClick={() => setNewFolderOpen(true)}
                      >
                        New Folder
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="sr-only"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,image/*,video/mp4,video/webm"
                        onChange={(e) => {
                          if (e.target.files) void handleUploadFiles(e.target.files);
                          e.target.value = "";
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={uploading || b2Configured === false}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {uploading ? "Uploading…" : "Upload File"}
                      </Button>
                    </>
                  )}
                </>
              }
            />

            {/* Breadcrumbs */}
            <nav aria-label="Breadcrumb" className="mt-4 flex flex-wrap items-center gap-1 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <span key={crumb.id ?? "root"} className="flex items-center gap-1">
                  {index > 0 && <span className="text-brand-gray">/</span>}
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentFolderId(crumb.id);
                      setSearchResults(null);
                    }}
                    className={`rounded px-1 py-0.5 transition-colors hover:bg-gray-100 ${
                      index === breadcrumbs.length - 1 && !showingSearch
                        ? "font-semibold text-brand-charcoal"
                        : "text-brand-blue"
                    }`}
                  >
                    {crumb.name}
                  </button>
                </span>
              ))}
            </nav>

            {/* Search & sort */}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex min-w-0 flex-1 gap-2">
                <FormField id="storage-search" label="Search" className="flex-1">
                  <Input
                    id="storage-search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleSearch();
                    }}
                    placeholder="Search files and folders…"
                  />
                </FormField>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-7 shrink-0"
                  disabled={searching}
                  onClick={() => void handleSearch()}
                >
                  {searching ? "Searching…" : "Search"}
                </Button>
              </div>
              <div className="flex gap-2">
                <FormField id="sort-by" label="Sort by" className="w-32">
                  <select
                    id="sort-by"
                    className="w-full rounded-[10px] border border-gray-200 px-3 py-2 text-sm"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as StorageSortField)}
                  >
                    <option value="name">Name</option>
                    <option value="date">Date</option>
                    <option value="size">Size</option>
                    <option value="type">Type</option>
                  </select>
                </FormField>
                <FormField id="sort-dir" label="Order" className="w-28">
                  <select
                    id="sort-dir"
                    className="w-full rounded-[10px] border border-gray-200 px-3 py-2 text-sm"
                    value={sortDirection}
                    onChange={(e) => setSortDirection(e.target.value as StorageSortDirection)}
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </FormField>
              </div>
            </div>
          </Card>

          {error && (
            <AlertBanner variant="error" title="Error">
              {error}
            </AlertBanner>
          )}
          {message && (
            <AlertBanner variant="success" title="Success">
              {message}
            </AlertBanner>
          )}

          {/* Drop zone */}
          {canWrite && (
            <div
              className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                dragOver
                  ? "border-brand-blue bg-brand-blue/5"
                  : "border-gray-200 bg-gray-50/50"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files.length > 0) {
                  void handleUploadFiles(e.dataTransfer.files);
                }
              }}
            >
              <p className="text-sm text-brand-gray">
                Drag and drop files here to upload to{" "}
                <strong>{browse?.folder?.name ?? "File Storage"}</strong>
              </p>
            </div>
          )}

          {loading ? (
            <SkeletonCardList count={4} />
          ) : isEmpty ? (
            <EmptyState
              title="This folder is empty"
              description={
                canWrite
                  ? "Create a folder or upload files to get started."
                  : "No files or folders in this location."
              }
            />
          ) : (
            <div className="space-y-3">
              {folders.map((folder) => (
                <Card
                  key={folder.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4"
                >
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    onClick={() => {
                      setCurrentFolderId(folder.id);
                      setSearchResults(null);
                    }}
                  >
                    <FolderIcon className="h-8 w-8 shrink-0 text-gold-500" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-brand-charcoal">{folder.name}</p>
                      <p className="text-sm text-brand-gray">
                        Folder · Updated {formatDate(folder.updatedAt ?? folder.createdAt)}
                        {showingSearch ? ` · ${folder.fullPath}` : ""}
                      </p>
                    </div>
                  </button>
                  {canWrite && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openRename({ type: "folder", item: folder })}
                      >
                        Rename
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openMove({ type: "folder", item: folder })}
                      >
                        Move
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openDelete({ type: "folder", item: folder })}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </Card>
              ))}

              {files.map((file) => (
                <Card
                  key={file.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <FileIcon className="h-8 w-8 shrink-0 text-brand-blue" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-brand-charcoal">{file.displayName}</p>
                      <p className="text-sm text-brand-gray">
                        {fileTypeLabel(file)} · {formatBytes(file.fileSize)} ·{" "}
                        {formatDate(file.updatedAt ?? file.createdAt)}
                        {file.uploadedByName ? ` · ${file.uploadedByName}` : ""}
                        {showingSearch && file.folderPath ? ` · ${file.folderPath}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={file.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-9 items-center justify-center rounded-[10px] border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-text-dark shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-100"
                    >
                      Open
                    </a>
                    {canWrite && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openRename({ type: "file", item: file })}
                        >
                          Rename
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openMove({ type: "file", item: file })}
                        >
                          Move
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openDelete({ type: "file", item: file })}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New folder modal */}
      {newFolderOpen && (
        <Modal
          title="New folder"
          description={`Create a folder inside ${browse?.folder?.name ?? "File Storage"}.`}
          onClose={closeNewFolderModal}
          footer={
            <>
              <Button type="button" variant="outline" onClick={closeNewFolderModal}>
                Cancel
              </Button>
              <Button type="button" disabled={processing} onClick={() => void handleCreateFolder()}>
                {processing ? "Creating…" : "Create folder"}
              </Button>
            </>
          }
        >
          {modalError && (
            <AlertBanner variant="error" title="Could not create folder" className="mb-4">
              {modalError}
            </AlertBanner>
          )}
          <FormField id="new-folder-name" label="Folder name" required>
            <Input
              id="new-folder-name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              autoFocus
              placeholder="e.g. Training"
            />
          </FormField>
        </Modal>
      )}

      {/* Rename modal */}
      {renameOpen && renameTarget && (
        <Modal
          title={`Rename ${renameTarget.type}`}
          onClose={() => setRenameOpen(false)}
          footer={
            <>
              <Button type="button" variant="outline" onClick={() => setRenameOpen(false)}>
                Cancel
              </Button>
              <Button type="button" disabled={processing} onClick={() => void handleRename()}>
                {processing ? "Saving…" : "Save"}
              </Button>
            </>
          }
        >
          <FormField id="rename-value" label="Name" required>
            <Input
              id="rename-value"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              autoFocus
            />
          </FormField>
        </Modal>
      )}

      {/* Move modal */}
      {moveOpen && moveTarget && (
        <Modal
          title={`Move ${moveTarget.type}`}
          description="Choose a destination folder."
          onClose={() => setMoveOpen(false)}
          footer={
            <>
              <Button type="button" variant="outline" onClick={() => setMoveOpen(false)}>
                Cancel
              </Button>
              <Button type="button" disabled={processing} onClick={() => void handleMove()}>
                {processing ? "Moving…" : "Move here"}
              </Button>
            </>
          }
        >
          <FolderPicker
            tree={tree}
            excludeFolderId={moveTarget.type === "folder" ? moveTarget.item.id : undefined}
            value={moveDestinationId}
            onChange={setMoveDestinationId}
          />
        </Modal>
      )}

      {/* Delete modal */}
      {deleteOpen && deleteTarget && (
        <Modal
          title={`Delete ${deleteTarget.type}?`}
          description="This action cannot be undone."
          onClose={closeDeleteModal}
          footer={
            <>
              <Button type="button" variant="outline" onClick={closeDeleteModal}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={processing}
                onClick={() => void handleDelete()}
              >
                {processing ? "Deleting…" : "Delete"}
              </Button>
            </>
          }
        >
          {modalError && (
            <AlertBanner variant="error" title="Could not delete" className="mb-4">
              {modalError}
            </AlertBanner>
          )}
          <p className="text-sm text-brand-charcoal">
            Are you sure you want to delete{" "}
            <strong>
              {deleteTarget.type === "folder"
                ? (deleteTarget.item as StorageFolderRecord).name
                : (deleteTarget.item as StorageFileRecord).displayName}
            </strong>
            ?
          </p>
          {deleteTarget.type === "folder" && (
            <label className="mt-4 flex items-start gap-2 text-sm text-brand-gray">
              <input
                type="checkbox"
                checked={deleteRecursive}
                onChange={(e) => setDeleteRecursive(e.target.checked)}
                className="mt-1"
              />
              <span>
                Also delete all files and subfolders inside this folder. Leave this checked if the
                folder is not empty.
              </span>
            </label>
          )}
        </Modal>
      )}
    </div>
  );
}
