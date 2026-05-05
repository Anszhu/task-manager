import { render } from "preact";
import App from "./app";
import { AuthProvider } from "./contexts/AuthContext";
import "./styles/global.css";

render(
  <AuthProvider>
    <App />
  </AuthProvider>,
  document.getElementById("app")!
);
