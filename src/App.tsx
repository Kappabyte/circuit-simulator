import { useEffect, useState } from "react";
import StatusBar from "./components/Statusbar";
import { View } from "./views/View";

import "./styles/main.css"
import { defaultSchematic, Schematic } from "./logic/Schematic";
import { SimpleCircuitTest } from "./test/SimpleCircuitTest.test";
import { SchematicView } from "./views/SchematicView";

const App = () => {
  const [view, setView] = useState<View>('move');

  const [schematic] = useState<Schematic>(defaultSchematic);
  return (
    <>
      <SchematicView option={view}></SchematicView>
      <StatusBar option={view} setOption={setView}/>
    </>
  );
}

export default App;
