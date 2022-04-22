export abstract class ElectricalComponent {

    private name: string;
    private position: [number, number];

    constructor(name: string, position: [number, number]) {
        this.name = name;
        this.position = position;
    }

    public abstract render(): () => void;
}

export abstract class ResistiveComponent extends ElectricalComponent {

    constructor(name: string, position: [number, number]) {
        super(name, position)
    }

    /**
     * @returns the resistance of the component in ohms
     */
    public abstract getResistance(): number;
}

export abstract class VoltageSourceComponent extends ElectricalComponent {

    constructor(name: string, position: [number, number]) {
        super(name, position)
    }

    /**
     * @returns the voltage this component supplies to the circuit
     */
     public abstract getSuppliedVoltage(): number;
}

export class Resistor extends ResistiveComponent {

    private resistance: number;

    constructor(position: [number, number], resistance = 10) {
        super('resistor', position);

        this.resistance = resistance;
    }

    public getResistance(): number {
        return this.resistance;
    }
    public render(): () => void {
        throw new Error("Method not implemented.");
    }

}

export class Test extends ElectricalComponent {
    public render(): () => void {
        throw new Error("Method not implemented.");
    }

}

export class Cell extends VoltageSourceComponent {

    private voltage: number;

    public constructor(position: [number, number], voltage = 6) {
        super("cell", position);
        
        this.voltage = voltage;
    }

    public getSuppliedVoltage(): number {
        return this.voltage;
    }

    public render(): () => void {
        throw new Error("Method not implemented.");
    }

}