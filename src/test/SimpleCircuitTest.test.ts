import { Cell, Resistor, Test } from "../logic/Component";
import * as s from "../logic/Schematic"

export const SimpleCircuitTest = () => {
    const schem = s.defaultSchematic;

    const cell1 = schem.addComponent(new Cell([0,0], 6));
    const resistor1 = schem.addComponent(new Resistor([0,0], 2));
    const resistor2 = schem.addComponent(new Resistor([0,0], 4));

    schem.addConnection(cell1, resistor1);
    schem.addConnection(cell1, resistor2);
    schem.addConnection(resistor1, cell1);
    schem.addConnection(resistor2, cell1);

    const compiledCircuit = schem.compileCircuit(cell1);
    console.log(compiledCircuit);
}
