import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";

interface CustomRenderOptions {
  // Path pattern defined in the actual router (e.g., "/reservists/:reservistId")
  routePath?: string;
  // The actual URL loaded in the test (e.g., "/reservists/123")
  initialEntries?: string[];
}

export const customRender = (
  ui: React.ReactElement,
  options: CustomRenderOptions,
) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        // Solve retry override issue
        retryDelay: 0,
      },
    },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <MemoryRouter initialEntries={options.initialEntries}>
          <Routes>
            <Route path={options.routePath} element={ui} />
          </Routes>
        </MemoryRouter>
      </HelmetProvider>
    </QueryClientProvider>,
  );
};
