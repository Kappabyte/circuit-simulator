import { ElectricalComponent } from "./Component";

export type ElectricalConnection = {from: string, to: string, fromIndex: number, toIndex:number};

export type RenderCallback = (component: ElectricalComponent, context: CanvasRenderingContext2D, source: string, orientation: 'N' | 'E' | 'S' | 'W') => void;