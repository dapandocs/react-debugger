import { createRoot } from "react-dom/client";

const element = <div>Hello world!</div>;

const root = createRoot(document.getElementById("root"));

root.render(element);
