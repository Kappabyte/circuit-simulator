import { useState } from "react";
import StatusBar from "./components/Statusbar";
import { View } from "./views/View";

import "./styles/main.css"

const App = () => {
  const [view, setView] = useState<View>('schematic');
  return (
    <StatusBar view={view} setView={setView}/>
  );
}

export default App;
