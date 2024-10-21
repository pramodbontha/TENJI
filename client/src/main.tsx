import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { store } from "@/redux/store";
import { Provider } from "react-redux";
import { ConfigProvider } from "antd";
import "./utils/i18n";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.Fragment>
    <Provider store={store}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "rgb(15 23 42)",
          },
        }}
      >
        <App />
      </ConfigProvider>
    </Provider>
  </React.Fragment>
);
