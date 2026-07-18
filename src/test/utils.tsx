import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/contexts/ThemeContext";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

export function makeQueryWrapper() {
  const queryClient = makeQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

interface ProviderOptions extends Omit<RenderOptions, "wrapper"> {
  route?: string;
  queryClient?: QueryClient;
  withQuery?: boolean;
  withTheme?: boolean;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    route = "/",
    queryClient,
    withQuery = false,
    withTheme = false,
    ...options
  }: ProviderOptions = {},
) {
  const client = queryClient ?? (withQuery ? makeQueryClient() : undefined);

  const wrapper = ({ children }: { children: ReactNode }) => {
    let tree: ReactNode = <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>;
    if (client) {
      tree = <QueryClientProvider client={client}>{tree}</QueryClientProvider>;
    }
    if (withTheme) {
      tree = <ThemeProvider>{tree}</ThemeProvider>;
    }
    return <>{tree}</>;
  };

  return { queryClient: client, ...render(ui, { wrapper, ...options }) };
}
