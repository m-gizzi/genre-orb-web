import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type {
  ArtistMetadataSession,
  PushSession,
  SyncSession,
} from "@/api/client";
import { SyncActivity } from "./SyncActivity";

const librarySession: SyncSession = {
  id: 1,
  status: "running",
  trigger: "manual",
  progress: { total: 2, completed: 1, skipped: 0, failed: 0, percent: 50 },
  error_message: null,
  started_at: null,
  completed_at: null,
  playlists: [],
};

const artistSession: ArtistMetadataSession = {
  id: 2,
  status: "running",
  trigger: "manual",
  progress: { total: 4, completed: 1, percent: 25 },
  error_message: null,
  started_at: null,
  completed_at: null,
};

function pushSession(overrides: Partial<PushSession> = {}): PushSession {
  return {
    id: 10,
    status: "running",
    trigger: "manual",
    progress: { total: 10, completed: 5, percent: 50 },
    error_message: null,
    started_at: null,
    completed_at: null,
    smart_playlist_id: 100,
    smart_playlist_name: "Deep Cuts",
    strategy: "replace",
    tracks_added: 0,
    tracks_removed: 0,
    match_count: 10,
    sampled: false,
    ...overrides,
  };
}

describe("SyncActivity", () => {
  it("renders both the library and artist sync banners", () => {
    render(
      <SyncActivity
        librarySession={librarySession}
        artistSession={artistSession}
      />
    );

    expect(screen.getByText("Syncing library...")).toBeInTheDocument();
    expect(screen.getByText("Syncing artist metadata...")).toBeInTheDocument();
  });

  it("surfaces the reconnect prompt even with nothing in flight", () => {
    render(
      <SyncActivity librarySession={null} artistSession={null} needsReauth />
    );

    expect(screen.getByText("Spotify access has expired")).toBeInTheDocument();
  });

  it("renders nothing inline when there are no sessions", () => {
    const { container } = render(
      <SyncActivity librarySession={null} artistSession={null} variant="inline" />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("shows an idle placeholder in the panel when there are no sessions", () => {
    render(
      <SyncActivity librarySession={null} artistSession={null} variant="panel" />
    );

    expect(screen.getByText("No active syncs.")).toBeInTheDocument();
  });

  it("renders a banner for every active and finished push", () => {
    render(
      <SyncActivity
        librarySession={null}
        artistSession={null}
        activePushes={[
          pushSession({ id: 10, smart_playlist_name: "Deep Cuts" }),
          pushSession({ id: 11, smart_playlist_name: "Night Drive" }),
        ]}
        finishedPushes={[
          pushSession({
            id: 12,
            smart_playlist_name: "Morning",
            status: "completed",
            completed_at: "2026-08-11T10:00:00Z",
          }),
        ]}
      />
    );

    expect(
      screen.getByText("Pushing Deep Cuts to Spotify...")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Pushing Night Drive to Spotify...")
    ).toBeInTheDocument();
    expect(screen.getByText("Pushed Morning to Spotify")).toBeInTheDocument();
  });

  it("keeps a failed push visible alongside a later finished push", () => {
    render(
      <SyncActivity
        librarySession={null}
        artistSession={null}
        finishedPushes={[
          pushSession({
            id: 12,
            smart_playlist_name: "Morning",
            status: "failed",
            error_message: "Spotify rejected the request",
            completed_at: "2026-08-11T10:00:00Z",
          }),
          pushSession({
            id: 13,
            smart_playlist_name: "Evening",
            status: "completed",
            completed_at: "2026-08-11T10:00:05Z",
          }),
        ]}
      />
    );

    expect(screen.getByText("Push of Morning failed")).toBeInTheDocument();
    expect(
      screen.getByText("Spotify rejected the request")
    ).toBeInTheDocument();
    expect(screen.getByText("Pushed Evening to Spotify")).toBeInTheDocument();
  });

  it("dismisses the push whose banner was closed", async () => {
    const user = userEvent.setup();
    const onDismissPush = vi.fn();

    render(
      <SyncActivity
        librarySession={null}
        artistSession={null}
        finishedPushes={[
          pushSession({
            id: 12,
            smart_playlist_name: "Morning",
            status: "completed",
            completed_at: "2026-08-11T10:00:00Z",
          }),
          pushSession({
            id: 13,
            smart_playlist_name: "Evening",
            status: "completed",
            completed_at: "2026-08-11T10:00:05Z",
          }),
        ]}
        onDismissPush={onDismissPush}
      />
    );

    const dismissButtons = screen.getAllByRole("button", {
      name: "Dismiss notice",
    });
    expect(dismissButtons).toHaveLength(2);
    await user.click(dismissButtons[1]!);

    expect(onDismissPush).toHaveBeenCalledExactlyOnceWith(13);
  });

  it("renders push banners inline when there is no sync session", () => {
    const { container } = render(
      <SyncActivity
        librarySession={null}
        artistSession={null}
        activePushes={[pushSession()]}
        variant="inline"
      />
    );

    expect(container).not.toBeEmptyDOMElement();
    expect(screen.queryByText("No active syncs.")).not.toBeInTheDocument();
  });
});
