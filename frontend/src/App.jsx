import { RouterProvider } from "react-router-dom";
import router from "./routes/AppRoutes";
import ToastProvider from "./components/ui/ToastProvider";

function App() {
  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  );
}

export default App;
