import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PushSession } from "@/api/client";
import { PushStatusBanner } from "./PushStatusBanner";

function session(overrides: Partial<PushSession> = {}): PushSession {
  return {
    id: 1,
    status: "running",
    progress: { total: 4, completed: 1, percent: 25 },
    error_message: null,
    started_at: "2026-08-05T00:00:00Z",
    completed_at: null,
    smart_playlist_id: 7,
    smart_playlist_name: "Metal Mix",
    strategy: "diff",
    tracks_added: 12,
    tracks_removed: 3,
    match_count: 120,
    sampled: false,
    ...overrides,
  };
}

describe("PushStatusBanner", () => {
  it("names the playlist being pushed", () => {
    render(<PushStatusBanner session={session()} />);

    expect(screen.getByText("Pushing Metal Mix to Spotify...")).toBeInTheDocument();
  });

  it("shows progress while the push is running", () => {
    render(<PushStatusBanner session={session()} />);

    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "25"
    );
  });

  it("starts empty rather than full before the plan is sized", () => {
    render(
      <PushStatusBanner
        session={session({ progress: { total: 0, completed: 0, percent: 0 } })}
      />
    );

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("summarises what changed", () => {
    render(<PushStatusBanner session={session()} />);

    expect(screen.getByText("12 added, 3 removed")).toBeInTheDocument();
  });

  it("says so when a finished push found the playlist already correct", () => {
    render(
      <PushStatusBanner
        session={session({
          status: "completed",
          tracks_added: 0,
          tracks_removed: 0,
        })}
      />
    );

    expect(screen.getByText("already up to date")).toBeInTheDocument();
  });

  it("claims nothing about the changes before the plan is computed", () => {
    render(
      <PushStatusBanner
        session={session({
          status: "running",
          tracks_added: 0,
          tracks_removed: 0,
        })}
      />
    );

    expect(screen.queryByText("already up to date")).not.toBeInTheDocument();
    expect(screen.getByText("Pushing Metal Mix to Spotify...")).toBeInTheDocument();
  });

  it("stays quiet about changes on a failed push", () => {
    render(
      <PushStatusBanner
        session={session({
          status: "failed",
          tracks_added: 0,
          tracks_removed: 0,
          error_message: "Adding tracks failed after retries: boom",
        })}
      />
    );

    expect(screen.queryByText("already up to date")).not.toBeInTheDocument();
  });

  it("shows the plan size as soon as the planner commits it, mid-push", () => {
    render(
      <PushStatusBanner
        session={session({ status: "running", tracks_added: 12, tracks_removed: 3 })}
      />
    );

    expect(screen.getByText("12 added, 3 removed")).toBeInTheDocument();
  });

  it("drops the progress bar once the push finishes", () => {
    render(
      <PushStatusBanner
        session={session({ status: "completed", completed_at: "2026-08-05T00:01:00Z" })}
      />
    );

    expect(screen.getByText("Pushed Metal Mix to Spotify")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("surfaces the failure reason", () => {
    render(
      <PushStatusBanner
        session={session({
          status: "failed",
          error_message: "These rules match no tracks, so there is nothing to push.",
        })}
      />
    );

    expect(screen.getByText("Push of Metal Mix failed")).toBeInTheDocument();
    expect(
      screen.getByText(/These rules match no tracks/)
    ).toBeInTheDocument();
  });

  it("warns that a sampled push is a rotating subset", () => {
    render(
      <PushStatusBanner
        session={session({ sampled: true, match_count: 42_000 })}
      />
    );

    expect(screen.getByText(/42,000 tracks/)).toBeInTheDocument();
    expect(screen.getByText(/rotates the selection/)).toBeInTheDocument();
  });

  it("offers dismissal only once the push is over", async () => {
    const onDismiss = vi.fn();
    const { rerender } = render(
      <PushStatusBanner session={session()} onDismiss={onDismiss} />
    );

    expect(screen.queryByRole("button", { name: "Dismiss notice" })).toBeNull();

    rerender(
      <PushStatusBanner
        session={session({ status: "completed" })}
        onDismiss={onDismiss}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: "Dismiss notice" }));

    expect(onDismiss).toHaveBeenCalled();
  });
});
