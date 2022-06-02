import { v4 as uuidv4 } from 'uuid';
import { Cell, ElectricalComponent, ResistiveComponent, Resistor, VoltageSourceComponent } from "./Component"
import { ElectricalConnection } from './Types';

const removeKey = (key: string, {[key]: _, ...rest}) => rest;

export class Schematic {

    private components: Record<string, ElectricalComponent> = {};
    // FromUUID: connection data
    private connections: Record<string, Array<ElectricalConnection>> = {};
    private reverseConnections: Record<string, Array<ElectricalConnection>> = {};

    public static activeSchematic: Schematic = new Schematic();
    static {
        const cell1 = this.activeSchematic.addComponent(new Cell([5,5], 3).setOrientation('E'));
    
        const resistor1 = this.activeSchematic.addComponent(new Resistor([5,8], 2).setOrientation('W'));
        const resistor2 = this.activeSchematic.addComponent(new Resistor([5,9], 2).setOrientation('W'));
        const resistor3 = this.activeSchematic.addComponent(new Resistor([6,10], 3).setOrientation('W'));
        const resistor4 = this.activeSchematic.addComponent(new Resistor([7,8], 3).setOrientation('W'));

        
        // const cell1 = this.activeSchematic.addComponent(new Cell([5,5], 3).setOrientation('N'));
    
        // const resistor1 = this.activeSchematic.addComponent(new Resistor([8,5], 2).setOrientation('S'));
        // const resistor2 = this.activeSchematic.addComponent(new Resistor([9,5], 2).setOrientation('S'));
        // const resistor3 = this.activeSchematic.addComponent(new Resistor([10,6], 3).setOrientation('S'));
        // const resistor4 = this.activeSchematic.addComponent(new Resistor([8,7], 3).setOrientation('S'));

        this.activeSchematic.addConnection(cell1, resistor1);
        this.activeSchematic.addConnection(cell1, resistor2);
        this.activeSchematic.addConnection(cell1, resistor3);
        this.activeSchematic.addConnection(resistor1, resistor4);
        this.activeSchematic.addConnection(resistor2, resistor4);
        this.activeSchematic.addConnection(resistor3, cell1);
        this.activeSchematic.addConnection(resistor4, cell1);

        this.activeSchematic.setHead(cell1);

    }

    public static load(json: string): Schematic {
        const schematic = new Schematic();
        const data = JSON.parse(json);
        if(!data || !data.components || !data.connections || !data.reverseConnections || !data.head) return this.activeSchematic
        for(const component of Object.values(data.components) as any[]) {
            if(component.name === "resistor") {
                schematic.components[component.uuid] = new Resistor(component.position, component.resistance).setOrientation(component.orientation);
            }
            else if(component.name === "cell") {
                schematic.components[component.uuid] = new Cell(component.position, component.voltage).setOrientation(component.orientation);
            }
            schematic.components[component.uuid].uuid = component.uuid;
        }
        schematic.connections = data.connections;
        schematic.reverseConnections = data.reverseConnections;
        schematic.head = data.head;
        console.log(schematic)
        return schematic;
    }

    private head: string | null = null;

    public addComponent(component: ElectricalComponent): string {
        const uuid = uuidv4();
        component.uuid = uuid;

        this.components[uuid] = component;

        return uuid;
    }

    public resetComponent(component: ElectricalComponent) {
        this.components[component.uuid] = component;
    }

    public deleteComponent(component: string) {
        const n: Record<string, ElectricalComponent> = {};
        for(const [key, value] of Object.entries(this.components)) {
            if(key !== component) {
                n[key] = value;
            }
        }
        this.components = n;

        // Loop through all the connections and remove the ones that are connected to the deleted component
        // This includes the reverse connections
        for(const [key, value] of Object.entries(this.connections)) {
            const n: Array<ElectricalConnection> = [];
            for(const connection of value) {
                if(connection.from !== component && connection.to !== component) {
                    n.push(connection);
                }
            }
            this.connections[key] = n;
        }

        // Loop through all the reverse connections and remove the ones that are connected to the deleted component
        // This includes the connections
        for(const [key, value] of Object.entries(this.reverseConnections)) {
            const n: Array<ElectricalConnection> = [];
            for(const connection of value) {
                if(connection.from !== component && connection.to !== component) {
                    n.push(connection);
                }
            }
            this.reverseConnections[key] = n;
        }
    }

    public setHead(component: string) {
        this.head = component;
    }

    public addConnection(from: string, to: string, fromIndex: number = 0, toIndex: number = 0) {
        //TODO: Make sure UUIDs are valid
        if(!this.connections[from]) this.connections[from] = [];
        if(!this.reverseConnections[to]) this.reverseConnections[to] = [];
        this.connections[from].push({
            from: from,
            to: to,
            fromIndex: fromIndex,
            toIndex: toIndex
        });
        this.reverseConnections[to].push({
            from: from,
            to: to,
            fromIndex: fromIndex,
            toIndex: toIndex
        })
    }

    public deleteConnection(from: string, to: string) {
        // Remove a connection from the connections array based on the from uuid and to uuid
        const n: Array<ElectricalConnection> = [];
        for(const connection of this.connections[from]) {
            if(connection.to !== to) {
                n.push(connection);
            }
        }
        this.connections[from] = n;

        // DO the same for reverse connections
        const n2: Array<ElectricalConnection> = [];
        for(const connection of this.reverseConnections[to]) {
            if(connection.from !== from) {
                n2.push(connection);
            }
        }
        this.reverseConnections[to] = n2;
    }

    public getComponents(): Record<string, ElectricalComponent> {
        return this.components;
    }

    public getConnections(): Record<string, Array<ElectricalConnection>> {
        return this.connections;
    }

    public getReverseConnections(): Record<string, Array<ElectricalConnection>> {
        return this.reverseConnections;
    }

    public getHead() {
        return this.head;
    }
}

export const defaultSchematic: Schematic = new Schematic();