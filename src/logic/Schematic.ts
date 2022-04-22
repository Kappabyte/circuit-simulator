import { v4 as uuidv4 } from 'uuid';
import { ElectricalComponent, ResistiveComponent, VoltageSourceComponent } from "./Component"

export class Schematic {

    private components: Record<string, ElectricalComponent> = {};
    // FromUUID: connection data
    private connections: Record<string, Array<{from: string, to: string, fromIndex: number, toIndex:number}>> = {};

    public addComponent(component: ElectricalComponent): string {
        const uuid = uuidv4();
        this.components[uuid] = component;

        return uuid;
    }

    public addConnection(from: string, to: string, fromIndex: number = 0, toIndex: number = 0) {
        //TODO: Make sure UUIDs are valid
        if(!this.connections[from]) this.connections[from] = [];
        this.connections[from].push({
            from: from,
            to: to,
            fromIndex: fromIndex,
            toIndex: toIndex
        });
    }

    public compileCircuit(start: string): CompiledCircuit {
        let node = new CompiledCircuitNode(start, this.components[start]);
        node = this.compileComponent(node, {});
        return new CompiledCircuit(node);
    }

    public compileComponent(parent: CompiledCircuitNode, compiled: Record<string, CompiledCircuitNode>): CompiledCircuitNode {
        if(!Object.hasOwn(this.connections, parent.getComponent()[0])) return parent;
        
        //Compile forewards connections
        for(const connection of this.connections[parent.getComponent()[0]]) {
            let node = new CompiledCircuitNode(connection.to, this.components[connection.to]);

            if(Object.hasOwn(compiled, node.getComponent()[0])) {
                node = compiled[node.getComponent()[0]];
            } else {
                compiled[node.getComponent()[0]] = node;
                node = this.compileComponent(node, compiled);
            }

            parent.connectTo(node);
            compiled[node.getComponent()[0]] = node;
        }

        //Compile backwards connections
        for(const connectionGroup of Object.values(this.connections)) {
            for(const connection of connectionGroup) {
                if(connection.to == parent.getComponent()[0]) {
                    parent.connectFrom(compiled[connection.from]);
                }
            }
        }

        return parent;
    }

    public getComponents(): Record<string, ElectricalComponent> {
        return this.components;
    }
}

class SchematicMathProvider {

    private schem: CompiledCircuit;

    constructor(schem: CompiledCircuit) {
        this.schem = schem;
    }

    getTotalResitance(): number {
        return this.getResistanceInParallelCircuit(this.schem.getStart(), this.schem.getStart().getComponent()[0]);
    }

    private getResistanceInParallelCircuit(head: CompiledCircuitNode, start: string): number {
        let resistance = 0;
        
        if(head instanceof ResistiveComponent) {
            resistance += head.getResistance();
        }

        let r_Inverse = 0;
        for(const child of head.getConnectedTo()) {
            if(child.getComponent()[0] == start) continue;
            r_Inverse += 1 / this.getResistanceInParallelCircuit(child, start);
        }

        resistance += 1 / r_Inverse;

        return resistance == 0 || resistance == Infinity ? 0 : resistance;
    }

    getTotalCurrent(): number {
        return this.getTotalVoltage() / this.getTotalResitance();
    }

    getTotalVoltage(): number {
        //Recursivly calculate voltage
        //NOTE: If a 
        return -1;
    }

}

class CompiledCircuit {
    public readonly math: SchematicMathProvider = new SchematicMathProvider(this);

    private originalCircuit: CompiledCircuitNode;
    private networkMapped: CompiledCircuitNode;

    private notInCircuit: Record<string, ElectricalComponent> = {};

    constructor(start: CompiledCircuitNode) {
        this.originalCircuit = start;
        this.networkMapped = start;

        this.mapNetwork();
    }

    private mapNetwork() {
        //TODO: convert all delta/pi networks to Y/T networks
    }

    public getStart() {
        return this.originalCircuit;
    }
}

class CompiledCircuitNode {
    private component: [string, ElectricalComponent];

    private connectedTo: Array<CompiledCircuitNode> = [];
    private connectedFrom: Array<CompiledCircuitNode> = [];

    public constructor(uniqueID: string, component: ElectricalComponent) {
        this.component = [uniqueID, component];
    }

    public connectTo(node: CompiledCircuitNode) {
        this.connectedTo.push(node);
    }

    public connectFrom(node: CompiledCircuitNode) {
        this.connectedFrom.push(node);
    }

    public getConnectedTo() {
        return this.connectedTo;
    }

    public getConnectedFrom() {
        return this.connectedFrom;
    }

    public getComponent(): [string, ElectricalComponent] {
        return this.component;
    }
}

export const defaultSchematic: Schematic = new Schematic();