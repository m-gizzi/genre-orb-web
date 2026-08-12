import { describe, it, expect, vi, afterEach } from "vitest";
import type { ReactNode } from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePolledSession } from "./usePolledSession";

interface Status {
  busy: boolean;
}

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

function setup(
  queryFn: () => Promise<Status>,
  options: { enabled?: boolean; onFinished?: () => void; alsoPollWhile?: boolean } = {}
) {
  const { queryClient, wrapper } = makeWrapper();
  const key = ["polled-session-test"];

  const rendered = renderHook(
    () =>
      usePolledSession<Status>({
        queryKey: key,
        queryFn,
        enabled: options.enabled ?? true,
        isActive: (data) => data.busy,
        onFinished: options.onFinished,
        alsoPollWhile: options.alsoPollWhile,
      }),
    { wrapper }
  );

  return { ...rendered, queryClient, key };
}

describe("usePolledSession", () => {
  afterEach(() => vi.clearAllMocks());

  it("reports active from the payload", async () => {
    const { result } = setup(() => Promise.resolve({ busy: true }));

    await waitFor(() => expect(result.current.active).toBe(true));
  });

  it("fires onFinished once when work stops", async () => {
    const onFinished = vi.fn();
    const queryFn = vi.fn().mockResolvedValue({ busy: true });
    const { result, queryClient, key } = setup(queryFn, { onFinished });

    await waitFor(() => expect(result.current.active).toBe(true));

    queryFn.mockResolvedValue({ busy: false });
    await act(async () => {
      await queryClient.refetchQueries({ queryKey: key });
    });

    await waitFor(() => expect(onFinished).toHaveBeenCalledTimes(1));
  });

  it("does not fire onFinished when work was never active", async () => {
    const onFinished = vi.fn();
    const { result } = setup(() => Promise.resolve({ busy: false }), { onFinished });

    await waitFor(() => expect(result.current.query.isLoading).toBe(false));

    expect(onFinished).not.toHaveBeenCalled();
  });

  it("hands onFinished the query client so callers can invalidate", async () => {
    const onFinished = vi.fn();
    const queryFn = vi.fn().mockResolvedValue({ busy: true });
    const { result, queryClient, key } = setup(queryFn, { onFinished });

    await waitFor(() => expect(result.current.active).toBe(true));

    queryFn.mockResolvedValue({ busy: false });
    await act(async () => {
      await queryClient.refetchQueries({ queryKey: key });
    });

    await waitFor(() => expect(onFinished).toHaveBeenCalledWith(queryClient));
  });

  it("does not fetch while disabled", () => {
    const queryFn = vi.fn().mockResolvedValue({ busy: false });
    setup(queryFn, { enabled: false });

    expect(queryFn).not.toHaveBeenCalled();
  });
});
