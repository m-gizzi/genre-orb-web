import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { SyncSession } from "@/api/client";
import { SyncStatusBanner } from "./SyncStatusBanner";

function makeSession(overrides: Partial<SyncSession> = {}): SyncSession {
  return {
    id: 1,
    status: "running",
    progress: { total: 3, completed: 1, skipped: 0, failed: 0, percent: 33 },
    error_message: null,
    started_at: null,
    completed_at: null,
    playlists: [],
    ...overrides,
  };
}

describe("SyncStatusBanner", () => {
  it("renders the active label and every per-playlist status, including skipped", () => {
    const session = makeSession({
      status: "running",
      playlists: [
        {
          playlist_id: 1,
          playlist_name: "Metal",
          status: "completed",
          page_progress: { total: 2, completed: 2 },
          error_message: null,
        },
        {
          playlist_id: 2,
          playlist_name: "Jazz",
          status: "fetching_pages",
          page_progress: { total: 4, completed: 1 },
          error_message: null,
        },
        {
          playlist_id: 3,
          playlist_name: "Pop",
          status: "skipped",
          page_progress: { total: 0, completed: 0 },
          error_message: null,
        },
        {
          playlist_id: 4,
          playlist_name: "Rock",
          status: "pending",
          page_progress: { total: 0, completed: 0 },
          error_message: null,
        },
      ],
    });

    render(<SyncStatusBanner session={session} />);

    expect(screen.getByText("Syncing library...")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.getByText("1/4 pages")).toBeInTheDocument();
    expect(screen.getByText("Skipped")).toBeInTheDocument();
    expect(screen.getByText("Waiting...")).toBeInTheDocument();
  });

  it("renders the completed label without an active pulse", () => {
    const session = makeSession({
      status: "completed",
      progress: { total: 3, completed: 3, skipped: 0, failed: 0, percent: 100 },
    });

    render(<SyncStatusBanner session={session} />);

    expect(screen.getByText("Sync completed")).toBeInTheDocument();
  });

  it("renders the failed label", () => {
    render(<SyncStatusBanner session={makeSession({ status: "failed" })} />);

    expect(screen.getByText("Sync failed")).toBeInTheDocument();
  });

  it("surfaces per-playlist error messages when the sync finished with errors", () => {
    const session = makeSession({
      status: "completed_with_errors",
      progress: { total: 2, completed: 1, skipped: 0, failed: 1, percent: 100 },
      playlists: [
        {
          playlist_id: 1,
          playlist_name: "Metal",
          status: "completed",
          page_progress: { total: 1, completed: 1 },
          error_message: null,
        },
        {
          playlist_id: 2,
          playlist_name: "Jazz",
          status: "failed",
          page_progress: { total: 3, completed: 1 },
          error_message: "Rate limited, giving up",
        },
      ],
    });

    render(<SyncStatusBanner session={session} />);

    expect(screen.getByText("Sync finished with errors")).toBeInTheDocument();
    expect(screen.getByText("Jazz")).toBeInTheDocument();
    expect(screen.getByText("Rate limited, giving up")).toBeInTheDocument();
  });
});
