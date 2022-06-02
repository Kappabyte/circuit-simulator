import { RenderCallback } from "./Types";

export abstract class ElectricalComponent {
    private name: string;
    protected position: [number, number];
    public orientation: 'N' | 'E' | 'S' | 'W' = 'N';

    public uuid: string = '';

    constructor(name: string, position: [number, number]) {
        this.name = name;
        this.position = position;
    }

    public abstract getRelativeConnectionLocation(index: number): [number, number];
    public abstract getRelativeConnectionLocation3D(index: number): [number, number];

    public abstract render(ctx: any, renderCallback: RenderCallback): void;

    public getPosition(): [number, number] {
        return this.position;
    }

    public setOrientation(orientation: 'N' | 'E' | 'S' | 'W') {
        this.orientation = orientation;
        return this;
    }

    public rotate() {
        switch (this.orientation) {
            case 'N':
                this.orientation = 'E';
                break;
            case 'E':
                this.orientation = 'S';
                break;
            case 'S':
                this.orientation = 'W';
                break;
            case 'W':
                this.orientation = 'N';
                break;
        }
    }

    public getName(): string {
        return this.name;
    }
}

export abstract class ResistiveComponent extends ElectricalComponent {

    constructor(name: string, position: [number, number]) {
        super(name, position)
    }

    /**
     * @returns the resistance of the component in ohms
     */
    public abstract getResistance(): number;

    /**
     * @returns the resistance of the component in ohms
     */
    public abstract setResistance(resistance: number): void;
}

export abstract class VoltageSourceComponent extends ElectricalComponent {

    constructor(name: string, position: [number, number]) {
        super(name, position)
    }

    /**
     * @returns the voltage this component supplies to the circuit
     */
     public abstract getSuppliedVoltage(): number;
     
    /**
     * @returns the voltage this component supplies to the circuit
     */
     public abstract setSuppliedVoltage(voltage: number): void;
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

    public setResistance(resistance: number): void {
        console.log("resistance: " + resistance);
        this.resistance = resistance;
    }

    public render(ctx: any, renderCallback: RenderCallback) {
        renderCallback(this, ctx, 'assets/resistor.png', this.orientation);
    }

    public getRelativeConnectionLocation(index: number): [number, number] {
        switch(this.orientation) {
            case 'N':
                return [0, 0.4 * (index === 0 ? -1 : 1)];
            case 'E':
                return [0.4 * (index === 0 ? -1 : 1), 0];
            case 'S':
                return [0, 0.4 * (index === 0 ? 1 : -1)];
            case 'W':
                return [0.4  * (index === 0 ? 1 : -1), 0];
        }
    }

    public getRelativeConnectionLocation3D(index: number): [number, number] {
        switch(this.orientation) {
            case 'N':
                return [0, -.4 * (index === 0 ? 1 : -1)];
            case 'E':
                return [-.4 * (index === 0 ? 1 : -1), 0];
            case 'S':
                return [0, .4 * (index === 0 ? 1 : -1)];
            case 'W':
                return [.4 * (index === 0 ? 1 : -1), 0];
        }
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

    public setSuppliedVoltage(voltage: number) {
        this.voltage = voltage;
    }

    public render(ctx: any, renderCallback: RenderCallback) {
        let asset;
        switch(this.voltage) {
            case 3:
                asset = 'assets/cell-3.0V.png';
                break;
            case 4.5:
                asset = 'assets/cell-4.5V.png';
                break;
            default:
                asset = 'assets/cell-1.5V.png';
                break;
        }
        renderCallback(this, ctx, asset, this.orientation);
    }

    public getRelativeConnectionLocation(index: number): [number, number] {
        let multiplier;
        switch(this.voltage) {
            case 3:
                multiplier = 0.11;
                break;
            case 4.5:
                multiplier = 0.23;
                break;
            default:
                multiplier = 0;
                break;
        }
        switch(this.orientation) {
            case 'N':
                return [0, (0.06 + multiplier) * (index === 0 ? -1 : 1)];
            case 'E':
                return [(0.06 + multiplier)  * (index === 0 ? -1 : 1), 0];
            case 'S':
                return [0, (0.06 + multiplier) * (index === 0 ? 1 : -1)];
            case 'W':
                return [0.06  * (index === 0 ? 1 : -1) * multiplier, 0];
        }
    }

    public getRelativeConnectionLocation3D(index: number): [number, number] {
        switch(this.orientation) {
            case 'N':
                return [0, 0];
            case 'E':
                return [0, 0];
            case 'S':
                return [0, 0];
            case 'W':
                return [0, 0];
        }
    }
}