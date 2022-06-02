import { useEffect, useState } from "react";
import StatusBar from "./components/Statusbar";
import { View } from "./views/View";

import "./styles/main.css"
import { defaultSchematic, Schematic } from "./logic/Schematic";
import { SimpleCircuitTest } from "./test/SimpleCircuitTest.test";
import { SchematicView } from "./views/SchematicView";
import { RenderedView } from "./views/RenderedView";

const App = () => {
  const [view, setView] = useState<View>('move');
  return (
    <>
      {view != "rendered" ?
        <SchematicView option={view}></SchematicView>
        :
        <RenderedView />
    }
      <StatusBar option={view} setOption={setView}/>
    </>
  );
}

export default App;
