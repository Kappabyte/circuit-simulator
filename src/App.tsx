import { useState } from "react";
import StatusBar from "./components/Statusbar";
import { View } from "./views/View";

import "./styles/main.css"
import SchematicView from "./views/SchematicView";
import { defaultSchematic, Schematic } from "./logic/Schematic";
import { SimpleCircuitTest } from "./test/SimpleCircuitTest.test";

const App = () => {
  const [view, setView] = useState<View>('schematic');

  SimpleCircuitTest();

  const [schematic] = useState<Schematic>(defaultSchematic);
  return (
    <StatusBar view={view} setView={setView}/>
  );
}

export default App;
