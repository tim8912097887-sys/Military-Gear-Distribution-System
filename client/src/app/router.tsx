import { createBrowserRouter, RouterProvider } from "react-router";
import App from "../App";
import NotFoundPage from "../common/components/pages/NotFoundPage";
import LandingPageSkeleton from "../common/components/skeleton/LandingPageSkeleton";
import { lazy, Suspense, type JSX } from "react";
import ReservistDetailPageSkeleton from "../features/reservists/components/skeleton/ReservistDetailPageSkeleton";
import ReservistListPageSkeleton from "../features/reservists/components/skeleton/ReservistListPageSkeleton";
import ReservistGearHistoryPageSkeleton from "../features/reservist-gears/components/skeleton/ReservistGearHistoryPageSkeleton";
import ReservistGearDistributionPageSkeleton from "../features/reservist-gears/components/skeleton/ReservistGearDistributionPageSkeleton";

const LandingPage = lazy(
  () => import("../common/components/pages/LandingPage"),
);
const ReservistListPage = lazy(
  () => import("../features/reservists/pages/ReservistListPage"),
);
const ReservistDetailPage = lazy(
  () => import("../features/reservists/pages/ReservistDetailPage"),
);
const ReservistGearHistoryPage = lazy(
  () => import("../features/reservist-gears/pages/ReservistGearHistoryPage"),
);
const ReservistGearDistributionPage = lazy(
  () =>
    import("../features/reservist-gears/pages/ReservistGearDistributionPage"),
);

const pageWithSuspense = (page: JSX.Element, fallback: JSX.Element) => {
  return <Suspense fallback={fallback}>{page}</Suspense>;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: pageWithSuspense(<LandingPage />, <LandingPageSkeleton />),
      },
      {
        path: "/reservists",
        element: pageWithSuspense(
          <ReservistListPage />,
          <ReservistListPageSkeleton />,
        ),
      },
      {
        path: "/reservists/:id",
        element: pageWithSuspense(
          <ReservistDetailPage />,
          <ReservistDetailPageSkeleton />,
        ),
      },
      {
        path: "/reservists/:id/gears",
        element: pageWithSuspense(
          <ReservistGearDistributionPage />,
          <ReservistGearDistributionPageSkeleton />,
        ),
      },
      {
        path: "/reservists/:id/gears/history",
        element: pageWithSuspense(
          <ReservistGearHistoryPage />,
          <ReservistGearHistoryPageSkeleton />,
        ),
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
