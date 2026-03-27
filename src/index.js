import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Study } from "./components/study/study";
import * as serviceWorker from "./serviceWorker";
import axios from "axios";

const params = new URLSearchParams(window.location.search);
const previewClass = params.get('class');
const previewIndex = params.get('shuffled_index') ? parseInt(params.get('shuffled_index')) : null;
const isPreview = (params.get('PROLIFIC_PID') || 'preview').startsWith('preview');

const root = createRoot(document.getElementById("main"));
root.render(
  <Study
    previewClass={previewClass}
    previewIndex={previewIndex}
    isPreview={isPreview}
  />
);
serviceWorker.unregister();
axios.defaults.headers.common['x-api-key'] = process.env.REACT_APP_API_KEY;
