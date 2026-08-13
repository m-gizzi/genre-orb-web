import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { EnrichmentCoverage as Coverage, EnrichmentSource } from "@/api/client";
import { EnrichmentCoverage } from "./EnrichmentCoverage";

function coverage(overrides: Partial<Coverage> = {}): Coverage {
  return {
    total: 100,
    fetched: 0,
    matched: 0,
    unmatched: 0,
    errored: 0,
    pending: 100,
    ...overrides,
  };
}

function renderCoverage(overrides: Partial<Record<EnrichmentSource, Coverage>> = {}) {
  const empty = coverage({ total: 0, pending: 0 });
  return render(
    <EnrichmentCoverage
      coverage={{ musicbrainz: empty, lastfm: empty, ...overrides }}
    />
  );
}

function bar(source: string): HTMLElement {
  return screen.getByRole("progressbar", { name: `${source} genre coverage` });
}

describe("EnrichmentCoverage", () => {
  it("shows a row per enrichment source", () => {
    renderCoverage();
    expect(screen.getByText("MusicBrainz")).toBeInTheDocument();
    expect(screen.getByText("Last.fm")).toBeInTheDocument();
  });

  it("tracks the bar to the same number the readout shows", () => {
    renderCoverage({
      musicbrainz: coverage({ fetched: 40, matched: 40, pending: 60 }),
    });

    expect(screen.getByText("40 / 100")).toBeInTheDocument();
    expect(bar("MusicBrainz")).toHaveAttribute("aria-valuenow", "40");
  });

  it("does not credit unmatched artists to the bar", () => {
    renderCoverage({
      musicbrainz: coverage({ fetched: 0, unmatched: 100, pending: 0 }),
    });

    expect(screen.getByText("0 / 100")).toBeInTheDocument();
    expect(bar("MusicBrainz")).toHaveAttribute("aria-valuenow", "0");
  });

  it("reads as up to date once nothing is left to look up", () => {
    renderCoverage({
      musicbrainz: coverage({ fetched: 90, matched: 90, unmatched: 10, pending: 0 }),
    });

    expect(
      screen.getByText("Up to date — 90 enriched · 10 not found")
    ).toBeInTheDocument();
  });

  it("does not claim to be up to date while failed lookups await retry", () => {
    renderCoverage({
      musicbrainz: coverage({ fetched: 90, matched: 90, errored: 10, pending: 0 }),
    });

    expect(screen.getByText("90 enriched · 10 failed")).toBeInTheDocument();
    expect(screen.queryByText(/Up to date/)).not.toBeInTheDocument();
  });

  it("stays at zero rather than dividing by an empty library", () => {
    renderCoverage();

    expect(bar("MusicBrainz")).toHaveAttribute("aria-valuenow", "0");
    expect(screen.queryByText(/Up to date/)).not.toBeInTheDocument();
  });

  it("omits counts that are zero from the summary", () => {
    renderCoverage({ musicbrainz: coverage({ fetched: 5, matched: 5, pending: 95 }) });

    expect(screen.getByText("5 enriched")).toBeInTheDocument();
  });
});
