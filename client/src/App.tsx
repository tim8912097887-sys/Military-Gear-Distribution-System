import { Outlet } from "react-router";
import { ToastContainer } from "react-toastify";

function App() {
  return (
    <>
      <div>
        <Outlet />
        <ToastContainer />
      </div>
    </>
  );
}

export default App;
