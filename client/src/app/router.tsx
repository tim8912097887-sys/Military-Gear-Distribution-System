import { createBrowserRouter } from "react-router";
import App from "../App";
import ReservistListPage from "../features/reservists/pages/ReservistListPage";
import ReservistDetailPage from "../features/reservists/pages/ReservistDetailPage";
import NotFoundPage from "../common/components/pages/NotFoundPage";
import ReservistGearDistributionPage from "../features/reservist-gears/pages/ReservistGearDistributionPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
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
