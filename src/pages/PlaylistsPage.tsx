import { useState } from "react";
import { Link } from "react-router-dom";
import { HeartIcon, ListMusicIcon } from "lucide-react";
import type { Playlist } from "@/api/client";
import { useLikedPlaylist, usePlaylistsPage } from "@/hooks/usePlaylists";
import { usePagination } from "@/hooks/usePagination";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { CARD_PER_PAGE_OPTIONS, DEFAULT_CARD_PER_PAGE } from "@/lib/config";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CardGridSkeleton,
  EmptyState,
  ErrorState,
  Pagination,
  PlaylistSyncSwitch,
  SearchInput,
  SortControl,
} from "@/components/catalog";
import { formatDate, formatNumber } from "@/lib/format";

const SORT_LABELS: Record<string, string> = {
  name: "Name",
  last_synced_at: "Last synced",
  track_count: "Tracks",
};

export function PlaylistsPage() {
  const { page, perPage, setPage, setPerPage } = usePagination(DEFAULT_CARD_PER_PAGE);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const debouncedSearch = useDebouncedValue(search, 300);

  const liked = useLikedPlaylist();
  const query = usePlaylistsPage({
    search: debouncedSearch || undefined,
    page,
    per_page: perPage,
    sort,
    order,
  });
  const playlists = query.data?.data ?? [];

  const resetToFirstPage = () => setPage(1);

  return (
    <div>
      <PageHeader
        title="Playlists"
        description="Your synced playlists and Liked Songs."
        actions={
          <div className="flex items-center gap-2">
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value);
                resetToFirstPage();
              }}
              placeholder="Search playlists…"
            />
            <SortControl
              sort={sort}
              order={order}
              options={SORT_LABELS}
              onSortChange={(value) => {
                setSort(value);
                resetToFirstPage();
              }}
              onOrderChange={(value) => {
                setOrder(value);
                resetToFirstPage();
              }}
            />
          </div>
        }
      />

      {!search && liked.data && <LikedSongsCard playlist={liked.data} />}

      {query.isLoading ? (
        <CardGridSkeleton />
      ) : query.isError ? (
        <ErrorState error={query.error} />
      ) : playlists.length === 0 ? (
        debouncedSearch ? (
          <EmptyState title="No playlists match your search" showOrb={false} />
        ) : (
          <EmptyState
            title="No playlists yet"
            description="Fetch and sync your Spotify playlists from the Library page."
            action={<Button render={<Link to="/library" />}>Go to Library</Button>}
          />
        )
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {playlists.map((playlist) => (
              <Card key={playlist.id} className="gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    to={`/playlists/${playlist.id}`}
                    className="flex min-w-0 items-center gap-2 hover:text-primary"
                  >
                    <ListMusicIcon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate font-medium">{playlist.name}</span>
                    {playlist.is_liked_songs && (
                      <Badge variant="secondary" className="shrink-0">
                        Liked
                      </Badge>
                    )}
                  </Link>
                  <PlaylistSyncSwitch
                    playlistId={playlist.id}
                    name={playlist.name}
                    syncEnabled={playlist.sync_enabled}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatNumber(playlist.track_count)} tracks · synced{" "}
                  {formatDate(playlist.last_synced_at)}
                </p>
              </Card>
            ))}
          </div>
          {query.data && (
            <Pagination
              meta={query.data.meta}
              label="playlists"
              onPageChange={setPage}
              onPerPageChange={setPerPage}
              perPageOptions={CARD_PER_PAGE_OPTIONS}
            />
          )}
        </>
      )}
    </div>
  );
}

function LikedSongsCard({ playlist }: { playlist: Playlist }) {
  return (
    <Card className="mb-6 gap-0 border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <Link
          to={`/playlists/${playlist.id}`}
          className="flex min-w-0 items-center gap-3 hover:text-primary"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
            <HeartIcon className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block font-medium">Liked Songs</span>
            <span className="block text-sm text-muted-foreground">
              {formatNumber(playlist.track_count)} tracks · synced{" "}
              {formatDate(playlist.last_synced_at)}
            </span>
          </span>
        </Link>
        <PlaylistSyncSwitch
          playlistId={playlist.id}
          name="Liked Songs"
          syncEnabled={playlist.sync_enabled}
        />
      </div>
    </Card>
  );
}
