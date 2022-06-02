import { useState } from "react"
import { CompiledNetwork } from "../logic/Compiler"
import { ElectricalComponent, ResistiveComponent, VoltageSourceComponent } from "../logic/Component"
import { Schematic } from "../logic/Schematic"

import styles from "../styles/EditPane.module.css"

export const EditPane = ({component, setEditComponent, editState, setEditState}: {component: ElectricalComponent | undefined, setEditComponent: (component: ElectricalComponent | undefined) => void, editState: 'normal' | 'connect' | 'place', setEditState: (component: 'normal' | 'connect' | 'place') => void}) => {
    
    const [compiled, setCompiled] = useState(new CompiledNetwork(Schematic.activeSchematic));
    console.log(compiled);
    let resistance = 0, voltage = 0, current = 0;

    console.log(resistance, voltage, current);
    
    if(component && Object.hasOwn(compiled.components, component.uuid) && compiled.compiled) {
        resistance = compiled.components[component.uuid].resistance;
        voltage = compiled.components[component.uuid].voltage;
        current = compiled.components[component.uuid].current;
    } else {
        resistance = component instanceof ResistiveComponent ? component.getResistance() : resistance;
        voltage = component instanceof VoltageSourceComponent ? component.getSuppliedVoltage() : voltage;
    }

    return component ? <>
        <div className={styles['edit-pane']}>
            <h1>{component.getName()}</h1>
            <span>{component.uuid}</span>
            <div>
                <button disabled={Schematic.activeSchematic.getHead() === component.uuid} onClick={() => {
                    Schematic.activeSchematic.deleteComponent(component?.uuid as string);
                    setEditComponent(undefined);
                    setCompiled(new CompiledNetwork(Schematic.activeSchematic))
                }}>Delete</button>
                <button onClick={() => {
                    component.rotate();
                    setCompiled(new CompiledNetwork(Schematic.activeSchematic))
                }}>Rotate</button>
                <button onClick={() => {
                    console.log("set edit state to: " + (editState == 'normal' ? 'connect' : "normal"))
                    setEditState(editState == 'normal' ? 'connect' : "normal")
                    setCompiled(new CompiledNetwork(Schematic.activeSchematic))
                }} disabled={editState === 'place'}>{editState === 'connect' ? "Stop Connecting" : "Connect"}</button>
            </div>
            <p>Resistance</p>
            <input type="number" inputMode="decimal" disabled={!(component instanceof ResistiveComponent)} value={Schematic.activeSchematic.getHead() === component.uuid ? compiled.resistance.toPrecision(3) : (component instanceof ResistiveComponent ? resistance : resistance.toPrecision(3))} onChange={(value) => {
                console.log("a")
                if(component instanceof ResistiveComponent) {
                    console.log(Schematic.activeSchematic)
                    console.log("b")
                    console.log(parseFloat(value.target.value))
                    component.setResistance(parseFloat(value.target.value))
                    Schematic.activeSchematic.resetComponent(component);
                    setCompiled(new CompiledNetwork(Schematic.activeSchematic))
                }
            }}/>
            <p>Voltage</p>
            <input type="number" inputMode="decimal" disabled={!(component instanceof VoltageSourceComponent)} value={component instanceof VoltageSourceComponent ? voltage : voltage.toPrecision(3)} onChange={(value) => {
                if(component instanceof VoltageSourceComponent) {
                    component.setSuppliedVoltage(parseFloat(value.target.value))
                    setCompiled(new CompiledNetwork(Schematic.activeSchematic))
                    setCompiled(new CompiledNetwork(Schematic.activeSchematic))
                }
            }}/>
            <p>Current</p>
            <input type="number" disabled={true} value={current.toPrecision(3)} readOnly={true}/>
        </div>
    </> 
    :
    <div className={styles['edit-pane']}>
        <h1>Select or Add Component</h1>
        <span>Click a component to select it</span>
        <div>
            <button onClick={() => {
                setEditState('place')
                setEditComponent(undefined);
            }}>Add Resistor</button>
        </div>
    </div>
}