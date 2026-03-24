import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Study } from "./components/study/study";
import * as serviceWorker from "./serviceWorker";
import axios from "axios";

const root = createRoot(document.getElementById("main"));
root.render(<Study />);
serviceWorker.unregister();
axios.defaults.headers.common['x-api-key'] = process.env.REACT_APP_API_KEY;
