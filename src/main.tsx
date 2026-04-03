import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "@radix-ui/themes/styles.css";
import { AuthProvider } from "./common/contexts/AuthContext";
import { Provider } from "react-redux";
import { store } from "./common/store";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Provider>
  </React.StrictMode>,
);
