import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Study } from "./components/study/study";
import * as serviceWorker from "./serviceWorker";

const root = createRoot(document.getElementById("main"));
root.render(<Study />);
serviceWorker.unregister();
