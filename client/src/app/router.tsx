import { createBrowserRouter } from "react-router";
import App from "../App";
import ReservistListPage from "../features/reservists/pages/ReservistListPage";
import ReservistDetailPage from "../features/reservists/pages/ReservistDetailPage";
import NotFoundPage from "../components/pages/NotFoundPage";

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
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
