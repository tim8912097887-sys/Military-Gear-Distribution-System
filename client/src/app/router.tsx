import { createBrowserRouter } from "react-router";
import App from "../App";
import ReservistListPage from "../features/reservists/pages/ReservistListPage";
import ReservistDetailPage from "../features/reservists/pages/ReservistDetailPage";
import NotFoundPage from "../common/components/pages/NotFoundPage";
import ReservistGearDistributionPage from "../features/reservist-gears/pages/ReservistGearDistributionPage";
import LandingPage from "../common/components/pages/LandingPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: "/reservists",
        element: <ReservistListPage />,
      },
      {
        path: "/reservists/:id",
        element: <ReservistDetailPage />,
      },
      {
        path: "/reservists/:id/gears",
        element: <ReservistGearDistributionPage />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
