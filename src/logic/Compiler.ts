import { Cell, ElectricalComponent, ResistiveComponent, VoltageSourceComponent } from "./Component";
import { Schematic } from "./Schematic";

abstract class CompiledNetworkDataHolder {
    public resistance: number = 0;
    public voltage: number = 0;
    public current: number = 0;
    
    public abstract calculateResistance(schematic: Schematic, compiled: Record<string, CompiledNetworkNode>): number;
    public abstract calculateVoltage(schematic: Schematic, compiled: Record<string, CompiledNetworkNode>): number;
    public abstract calculateCurrent(parentCurrent: number, schematic: Schematic, compiled: Record<string, CompiledNetworkNode>): number;
}

abstract class CompiledNetworkNode extends CompiledNetworkDataHolder {
    public uuid: string;

    public connectedTo: string | null = null;
    public connectedFrom: string[] | null = null;
    protected depth: number;

    protected constructor(uuid: string, depth: number, from: string[]) {
        super();
        this.uuid = uuid;
        this.depth = depth;
        this.connectedFrom = from;
    }

    public findEnd(depth: number, schematic: Schematic, compiled: Record<string, CompiledNetworkNode>): string {
        if(this.depth < depth) return this.uuid;

        return compiled[schematic.getConnections()[this.uuid][0].to].findEnd(depth, schematic, compiled);
    }
}

export class CompiledNetwork extends CompiledNetworkDataHolder {
    private source: Schematic;
    private head: string = '';
    public components: Record<string, CompiledNetworkNode> = {};

    public compiled = false;

    public constructor(schematic: Schematic) {
        super();
        this.source = schematic;
        if(schematic.getHead() === null) return;
        this.head = schematic.getHead() as string;
        try {
            this.head = CompiledSeriesNetwork.get(this.head, [], schematic, this.components, 0).uuid;

            this.calculateResistance();
            this.calculateHeadVoltage();
            this.calculateHeadCurrent();

            this.calculateCurrent();
            this.calculateVoltage();

            this.compiled = true;
        } catch(e) {
            console.log(e);
        }
    }

    public calculateResistance() {
        this.resistance = this.components[this.head].calculateResistance(this.source, this.components);
        return this.resistance;
    }

    public calculateCurrent() {
        this.components[this.head].calculateCurrent(this.current, this.source, this.components);
        return this.current;
    }

    public calculateVoltage() {
        this.components[this.head].calculateVoltage(this.source, this.components);
        return this.voltage;
    }

    private calculateHeadVoltage() {
        const component = this.source.getComponents()[this.source.getHead() as string];
        if(component instanceof VoltageSourceComponent) {
            this.voltage = component.getSuppliedVoltage();
            return this.voltage;
        }

        this.voltage = 0;
        return this.voltage;
    }

    private calculateHeadCurrent() {
        this.current = this.voltage / this.resistance;
    }
}

class CompiledNetworkComponent extends CompiledNetworkNode {

    private constructor(uuid: string, from: string[], schematic: Schematic, compiled: Record<string, CompiledNetworkNode>, depth: number) {  
        super(uuid, depth, from)
        compiled[uuid] = this;

        if(this.uuid !== schematic.getHead() && schematic.getReverseConnections()[uuid].length > 1) {
            this.depth -= 1;
        }

        compiled[uuid] = this;

        if(schematic.getConnections()[this.uuid].length === 1) {
            const c = CompiledNetworkComponent.get(schematic.getConnections()[this.uuid][0].to, [this.uuid], schematic, compiled, this.depth);
            if(c.depth >= this.depth && schematic.getHead() !== c.uuid) this.connectedTo = schematic.getConnections()[this.uuid][0].to;
        } else if(schematic.getConnections()[this.uuid].length > 1) {
            const network = CompiledParallelNetwork.get(schematic.getConnections()[this.uuid].map(connection => connection.to), [this.uuid], schematic, compiled, this.depth)
            this.connectedTo = network.uuid;
        } 
    }

    public static get(head: string, from: string[], schematic: Schematic, compiled: Record<string, CompiledNetworkNode>, depth: number): CompiledNetworkComponent {
        if(Object.hasOwn(compiled, head)) {
            const node = compiled[head];
            if(node instanceof CompiledNetworkComponent) {
                from.map(uuid => node.connectedFrom?.push(...node.connectedFrom?.includes(uuid) ? [] : from));
                return node;
            }
        }

        return new CompiledNetworkComponent(head, from, schematic, compiled, depth);
    }

    public calculateResistance(schematic: Schematic, compiled: Record<string, CompiledNetworkNode>): number {
        const component = schematic.getComponents()[this.uuid];
        if(component instanceof ResistiveComponent) {
            this.resistance = component.getResistance();
        }

        return this.resistance;
    }

    public calculateVoltage(schematic: Schematic, compiled: Record<string, CompiledNetworkNode>): number {
        this.voltage = this.current * this.resistance;
        const component = schematic.getComponents()[this.uuid];
        if(component instanceof VoltageSourceComponent) {
            this.voltage = component.getSuppliedVoltage();
        }
        if(this.connectedTo !== null) {
            compiled[this.connectedTo as string].calculateVoltage(schematic, compiled);
        }
        return this.voltage;
    }
    public calculateCurrent(parentCurrent: number, schematic: Schematic, compiled: Record<string, CompiledNetworkNode>): number {
        this.current = parentCurrent;
        if(this.connectedTo !== null) {
            compiled[this.connectedTo as string].calculateCurrent(parentCurrent, schematic, compiled);
        }
        return this.current;
    }
}

abstract class CompiledSubNetwork extends CompiledNetworkNode {
}

class CompiledSeriesNetwork extends CompiledSubNetwork {

    public head: CompiledNetworkNode | string | null;

    private constructor(uuid: string, from: string[], schematic: Schematic, compiled: Record<string, CompiledNetworkNode>, depth: number) {
        super("s-" + uuid, depth, from);
        this.head = uuid;

        compiled[this.uuid] = this;

        CompiledNetworkComponent.get(this.head, [this.uuid], schematic, compiled, depth);

        if(schematic.getConnections()[this.head].length === 1) {
            const node = CompiledNetworkComponent.get(schematic.getConnections()[this.head][0].to, [this.uuid], schematic, compiled, depth);
        } else if(schematic.getConnections()[this.head].length > 1) {
            const node = CompiledParallelNetwork.get(schematic.getConnections()[this.head].map(conn => conn.to), [this.uuid], schematic, compiled, depth);
        }
    }

    public static get(head: string, from: string[], schematic: Schematic, compiled: Record<string, CompiledNetworkNode>, depth: number): CompiledSeriesNetwork {
        if(Object.hasOwn(compiled, "s-" + head)) {
            const node = compiled["s-" + head];
            if(node instanceof CompiledSeriesNetwork) {
                from.map(uuid => node.connectedFrom?.push(...node.connectedFrom?.includes(uuid) ? [] : from));
                return node;
            }
        }

        return new CompiledSeriesNetwork(head, from, schematic, compiled, depth);
    }

    public calculateResistance(schematic: Schematic, compiled: Record<string, CompiledNetworkNode>): number {
        const r_GetComponentResistances = (component: string, remaining: number = 50): number => {
            if(component === null || remaining <= 0) return 0;
            return compiled[component].calculateResistance(schematic, compiled) + 
                (compiled[component].connectedTo !== null ? r_GetComponentResistances(compiled[component].connectedTo as string, remaining - 1) : 0);
        }
        this.resistance = r_GetComponentResistances(this.head as string);
        return this.resistance;
    }

    public calculateVoltage(schematic: Schematic, compiled: Record<string, CompiledNetworkNode>): number {
        this.voltage = this.current * this.resistance;
        compiled[this.head as string].calculateVoltage(schematic, compiled);
        return this.voltage;
    }

    public calculateCurrent(parentCurrent: number, schematic: Schematic, compiled: Record<string, CompiledNetworkNode>): number {
        this.current = parentCurrent;
        compiled[this.head as string].calculateCurrent(parentCurrent, schematic, compiled);
        return this.current;
    }
}

/*
1. For each branch, create list of visited nodes
2. Check each node for first instance of same node
3. Set that node as the connectedTo for the parallel network
4. Find branches that connect together before the end of the branch
 -> These branches are themselves parallel networks within the parallel network

*/

class CompiledParallelNetwork extends CompiledSubNetwork {

    protected heads: Array<CompiledSubNetwork | string | null>;

    protected constructor(heads: string[], from: string[], schematic: Schematic, compiled: Record<string, CompiledNetworkNode>, depth: number) {
        super(`p${depth}-` + heads[0], depth, from);

        // Recursively travel through the branches, stopping when we get the the schematic head, and add all visited node UUIDs to the branchStuff list
        const r_Branches = (current: string, branchStuff: string[]) => {
            branchStuff.push(current);
            if(current === schematic.getHead()) return;
            r_Branches(schematic.getConnections()[current][0].to, branchStuff);
        }
        const branches: string[][] = new Array<Array<string>>(heads.length);
        for(const branch of heads) {
            branches[heads.indexOf(branch)] = []
            r_Branches(branch, branches[heads.indexOf(branch)]);
        }

        this.connectedTo = CompiledParallelNetwork.findFirstCommonElement(...branches);

        CompiledParallelNetwork.trim(this.connectedTo, ...branches);

        const branchPairs = Object.values(CompiledParallelNetwork.findCommon(...branches)).filter(arr => arr.length > 0);

        for(let i = 0; i < heads.length; i++) {
            if(!CompiledParallelNetwork.has(i, ...branchPairs)) branchPairs.push([i]);
        }

        this.heads = branchPairs.map(pair => pair.length > 1 ? new CompiledParallelNetworkParallelBranch(pair.map(p => heads[p]), [this.uuid], schematic, compiled, depth + 1).uuid : CompiledSeriesNetwork.get(heads[pair[0]], [this.uuid], schematic, compiled, depth + 1).uuid);
        
        if(this.connectedTo === schematic.getHead()) this.connectedTo = null;

        compiled[this.uuid] = this;

        /* --- [OLD] ---
        this.heads = heads.map(head => CompiledSeriesNetwork.get(head, [this.uuid], schematic, compiled, depth + 1).uuid);

        

        // Find end of parallel network
        const primaryHead = this.heads[0];
        if(typeof primaryHead === 'string') {
            const network = compiled[primaryHead];
            if(network !== null && network instanceof CompiledSeriesNetwork) {
                let head = network.head;
                if(typeof head === 'string') head = compiled[head];
                if(head != null) this.connectedTo = head.findEnd(depth + 1, schematic, compiled);
                if(this.connectedTo as string === schematic.getHead()) this.connectedTo = null;
            } else {
                console.log("something really strange happened, and I have no idea why.");
            }
        } else {
            console.log("something really strange happened, and I have no idea why.");
        }*/
    }

    //Finds the first instance of the same elements in the input arrays
    private static findFirstCommonElement(...array: any[]): any {
        for(const element of array[0]) {
            let result = true;
            for(let i = 1; i < array.length; i++) {
                if(!array[i].includes(element)) result = false;
            }
            if(result) return element;
        }
    }

    private static trim(element: any, ...arrays: any[]) {
        for(const array of arrays) {
            if(array.includes(element)) array.splice(array.indexOf(element));
        }
    }

    private static findCommon(...arrays: any[]) {
        const common: Record<string, Array<number>> = {};
        for(let i = 0; i < arrays.length; i++) {
            for(let j = i + 1; j < arrays.length; j++) {
                for(const element of arrays[i]) {
                    if(common[element] === undefined) common[element] = [];
                    if(arrays[j].includes(element) && !common[element].includes(i)) common[element].push(i);
                    if(arrays[j].includes(element) && !common[element].includes(j)) common[element].push(j);
                }
            }
        }

        return common;
    }

    private static has(element: any, ...arrays: any[]) {
        for(const array of arrays) {
            if(array.includes(element)) return true;
        }
        return false;
    }

    static get(heads: string[], from: string[], schematic: Schematic, compiled: Record<string, CompiledNetworkNode>, depth: number): CompiledParallelNetwork {
        if(Object.hasOwn(compiled, `p${depth}-` + heads[0])) {
            const node = compiled[`p${depth}-` + heads[0]];
            if(node instanceof CompiledParallelNetwork) {
                from.map(uuid => node.connectedFrom?.push(...node.connectedFrom?.includes(uuid) ? [] : from));
                return node;
            }
        }

        return new CompiledParallelNetwork(heads, from, schematic, compiled, depth);
    }

    public calculateResistance(schematic: Schematic, compiled: Record<string, CompiledNetworkNode>): number {
        this.resistance = 0;
        for(const head of this.heads) {
            this.resistance += 1 / compiled[head as string].calculateResistance(schematic, compiled);
        }
        this.resistance = 1 / this.resistance;
        return this.resistance;
    }

    public calculateVoltage(schematic: Schematic, compiled: Record<string, CompiledNetworkNode>): number {
        this.voltage = this.current * this.resistance;
        for(const head of this.heads) {
            compiled[head as string].calculateVoltage(schematic, compiled);
        }
        if(this.connectedTo !== null) {
            compiled[this.connectedTo as string].calculateVoltage(schematic, compiled);
        }
        return this.voltage;
    }
    
    public calculateCurrent(parentCurrent: number, schematic: Schematic, compiled: Record<string, CompiledNetworkNode>): number {
        this.current = parentCurrent;
        for(const head of this.heads) {
            //Math for the equation: 
            /* 
               Ii
            --------
             ∑ Rx/R

             Where:
             Ii is the input voltage to the junction,
             Rx is the resistance of the branch that is being solved. 
             R is the total resistance of another, different parallel branch

             The summation occurs for each *different* parallel branch.
            */
            let headCurrent = parentCurrent;
            let divisor = this.heads.map(h => compiled[h as string].uuid !== this.uuid ? compiled[head as string].resistance / compiled[h as string].resistance : 0).reduce((partialSum, a) => partialSum + a);
            compiled[head as string].calculateCurrent(headCurrent / divisor, schematic, compiled);
        }
        if(this.connectedTo !== null) {
            compiled[this.connectedTo as string].calculateCurrent(parentCurrent, schematic, compiled);
        }
        return this.current;
    }
}

class CompiledParallelNetworkParallelBranch extends CompiledParallelNetwork {
    public calculateResistance(schematic: Schematic, compiled: Record<string, CompiledNetworkNode>): number {
        this.resistance = 0;
        for(const head of this.heads) {
            this.resistance += 1 / compiled[head as string].calculateResistance(schematic, compiled);
        }
        this.resistance = 1 / this.resistance;

        const r_GetComponentResistances = (component: string): number => {
            if(component === null) return 0;
            return compiled[component].calculateResistance(schematic, compiled) + 
                (compiled[component].connectedTo !== null ? r_GetComponentResistances(compiled[component].connectedTo as string) : 0);
        }

        this.resistance += r_GetComponentResistances(this.connectedTo as string);

        return this.resistance;
    }
}