import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ArtistMetadataSession, SyncSession } from "@/api/client";
import { SyncActivity } from "./SyncActivity";

const librarySession: SyncSession = {
  id: 1,
  status: "running",
  progress: { total: 2, completed: 1, skipped: 0, failed: 0, percent: 50 },
  error_message: null,
  started_at: null,
  completed_at: null,
  playlists: [],
};

const artistSession: ArtistMetadataSession = {
  id: 2,
  status: "running",
  progress: { total: 4, completed: 1, percent: 25 },
  error_message: null,
  started_at: null,
  completed_at: null,
};

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
});
