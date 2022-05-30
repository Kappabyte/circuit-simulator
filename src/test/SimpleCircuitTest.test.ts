import { CompiledNetwork } from "../logic/Compiler";
import { Cell, Resistor } from "../logic/Component";
import * as s from "../logic/Schematic"

export const SimpleCircuitTest = () => {
    const schem = new s.Schematic();

    const cell1 = schem.addComponent(new Cell([0,0], 60));
    
    const resistor1 = schem.addComponent(new Resistor([0,0], 1));
    const resistor2 = schem.addComponent(new Resistor([0,0], 2));
    const resistor3 = schem.addComponent(new Resistor([0,0], 3));
    const resistor4 = schem.addComponent(new Resistor([0,0], 4));

    schem.addConnection(cell1, resistor1);
    schem.addConnection(cell1, resistor2);
    schem.addConnection(cell1, resistor3);
    schem.addConnection(resistor1, resistor4);
    schem.addConnection(resistor2, resistor4);
    schem.addConnection(resistor3, cell1);
    schem.addConnection(resistor4, cell1);

    schem.setHead(cell1);

    const compiledCircuit = new CompiledNetwork(schem);
    console.log(compiledCircuit);
}
