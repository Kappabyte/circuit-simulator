import { useEffect, useState } from "react";
import { EditPane } from "../components/EditPane";
import { ElectricalComponent, Resistor } from "../logic/Component";
import { Schematic } from "../logic/Schematic";
import { View } from "./View";

const direction = {
    'N': { x: 1, y: -1 },
    'E': { x: -1, y: 1 },
    'S': { x: 1, y: 3 },
    'W': { x: 3, y: 1 }
}

const rotation: Record<string, number> = {
    'N': 0,
    'E': Math.PI * 3 / 2,
    'S': Math.PI,
    'W': Math.PI * 1 / 2
}

export const SchematicView = ({option}: {option: View}) => {

    const [windowBounds, setWindowBounds] = useState([
        window.innerWidth,
        window.innerHeight
    ]);

    const [editComponent, setEditComponent] = useState<ElectricalComponent>();

    const [r, setR] = useState<NodeJS.Timer>();

    const [transform, setTransform] = useState({
        SENSITIVITY: 0.1,
        SCALE: 1.0,
    
        GRID_SIZE: 50,
        ELEMENT_SIZE: 50,
    
        TRANSLATION: [0,0]
    })

    let interactionState = {
        mouseDown: false,
        mouseDownPosition: [0, 0],
    }

    const [editState, setEditState] = useState<'normal' | 'connect' | 'place'>('normal');

    const cachedImages: Record<string, HTMLImageElement> = {};

    const render = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {

        const drawCallback = async (component: ElectricalComponent, context: CanvasRenderingContext2D, imageSource: string) => {
            if(Object.hasOwn(cachedImages, imageSource)) {
                const x = (component.getPosition()[0] + transform.TRANSLATION[0]) * transform.GRID_SIZE * transform.SCALE;
                const y = (component.getPosition()[1] + transform.TRANSLATION[1]) * transform.GRID_SIZE * transform.SCALE;
                context.save();
                context.translate(x + transform.ELEMENT_SIZE / 2, y + transform.ELEMENT_SIZE / 2);
                context.rotate(rotation[component.orientation]);
                context.drawImage(cachedImages[imageSource], -transform.ELEMENT_SIZE / 2, -transform.ELEMENT_SIZE / 2, transform.ELEMENT_SIZE * transform.SCALE, transform.ELEMENT_SIZE * transform.SCALE); 
                context.restore();
                context.strokeStyle = "#000000"
                context.lineWidth = 2 * transform.SCALE;
                if(Object.hasOwn(Schematic.activeSchematic.getConnections(), component.uuid)) {
                    const x1 = x + component.getRelativeConnectionLocation(0)[0] * transform.ELEMENT_SIZE + transform.ELEMENT_SIZE / 2 - 1;
                    const y1 = y + component.getRelativeConnectionLocation(0)[1] * transform.ELEMENT_SIZE + transform.ELEMENT_SIZE / 2 - 1;
                    context.beginPath();
                    if(component.orientation === 'N' || component.orientation === 'S') {
                        context.moveTo(x1 + context.lineWidth / 2, y1 + context.lineWidth / 2);
                        context.lineTo(x1 + context.lineWidth / 2, y + direction[component.orientation].y * transform.ELEMENT_SIZE / 2 + context.lineWidth / 2);
                        context.lineTo(x + direction[component.orientation].x * transform.ELEMENT_SIZE / 2 + context.lineWidth / 2, y + direction[component.orientation].y * transform.ELEMENT_SIZE / 2 + context.lineWidth / 2);
                        context.stroke();
                    } else {
                        context.moveTo(x1 + context.lineWidth / 2, y1 + context.lineWidth / 2);
                        context.lineTo(x + direction[component.orientation].x * transform.ELEMENT_SIZE / 2 + context.lineWidth / 2, y1 + context.lineWidth / 2);
                        context.lineTo(x + direction[component.orientation].x * transform.ELEMENT_SIZE / 2 + context.lineWidth / 2, y + direction[component.orientation].y * transform.ELEMENT_SIZE / 2 + context.lineWidth / 2);
                        context.stroke();
                    }
                }
                context.strokeStyle = "#000000"
                if(Object.hasOwn(Schematic.activeSchematic.getReverseConnections(), component.uuid)) {
                    const x1 = x + component.getRelativeConnectionLocation(1)[0] * transform.ELEMENT_SIZE + transform.ELEMENT_SIZE / 2 - 1;
                    const y1 = y + component.getRelativeConnectionLocation(1)[1] * transform.ELEMENT_SIZE + transform.ELEMENT_SIZE / 2 - 1;
                    context.beginPath();

                    if(component.orientation === 'N' || component.orientation === 'S') {
                        context.moveTo(x1 + context.lineWidth / 2, y1 + context.lineWidth / 2);
                        context.lineTo(x1 + context.lineWidth / 2, y + direction[component.orientation === "N" ? "S" : "N"].y * transform.ELEMENT_SIZE / 2 + context.lineWidth / 2);
                        context.lineTo(x + direction[component.orientation === "N" ? "S" : "N"].x * transform.ELEMENT_SIZE / 2 + context.lineWidth / 2, y + direction[component.orientation === "N" ? "S" : "N"].y * transform.ELEMENT_SIZE / 2 + context.lineWidth / 2);
                        context.stroke();
                    } else {
                        context.moveTo(x1 + context.lineWidth / 2, y1 + context.lineWidth / 2);
                        context.lineTo(x + direction[component.orientation === "E" ? "W" : "E"].x * transform.ELEMENT_SIZE / 2 + context.lineWidth / 2, y1 + context.lineWidth / 2);
                        context.lineTo(x + direction[component.orientation === "E" ? "W" : "E"].x * transform.ELEMENT_SIZE / 2 + context.lineWidth / 2, y + direction[component.orientation === "E" ? "W" : "E"].y * transform.ELEMENT_SIZE / 2 + context.lineWidth / 2);
                        context.stroke();
                    }
                }

                //DEBUG
                // context.fillStyle = "#00ff00";
                // context.fillRect(x + component.getRelativeConnectionLocation(0)[0] * transform.ELEMENT_SIZE + transform.ELEMENT_SIZE / 2 - 1, y + component.getRelativeConnectionLocation(0)[1] * transform.ELEMENT_SIZE + transform.ELEMENT_SIZE / 2 - 1, 2, 2);
                // context.fillStyle = "#ff0000";    
                // context.fillRect(x + component.getRelativeConnectionLocation(1)[0] * transform.ELEMENT_SIZE + transform.ELEMENT_SIZE / 2 - 1, y + component.getRelativeConnectionLocation(1)[1] * transform.ELEMENT_SIZE + transform.ELEMENT_SIZE / 2 - 1, 2, 2);
            } else {
                const img = new Image();
                img.src = window.location.protocol + "//" + window.location.host + "/" + imageSource;
                img.onload = () => {
                    cachedImages[imageSource] = img;
                }
            }
        }

        const flip = (i: 'N' | 'E' | 'S' | 'W') => {
            switch(i) {
                case "N": return "S";
                case "S": return "N";
                case "E": return "W";
                case "W": return "E";
            }
        }

        window.requestAnimationFrame(() => {
            // Set the canvas fill style to light red
            ctx.fillStyle = '#dddddd'
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Create vertical grid lines
            for(let i = transform.TRANSLATION[0] * transform.SCALE * transform.GRID_SIZE % (transform.GRID_SIZE * transform.SCALE); i < canvas.width; i += transform.GRID_SIZE / 2) {
                ctx.strokeStyle = Math.round(Math.abs(i - (transform.TRANSLATION[0] * transform.SCALE * transform.GRID_SIZE % (transform.GRID_SIZE * transform.SCALE))) % transform.GRID_SIZE * 1000) / 1000 === 0 ? '#aaaaaa' : '#cccccc';
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, canvas.height);
                ctx.stroke();
            }

            // Create horizontal grid lines
            for(let i = transform.TRANSLATION[1] * transform.SCALE * transform.GRID_SIZE % (transform.GRID_SIZE * transform.SCALE); i < canvas.height; i += transform.GRID_SIZE / 2) {
                ctx.strokeStyle = Math.round(Math.abs(i - (transform.TRANSLATION[1] * transform.SCALE * transform.GRID_SIZE % (transform.GRID_SIZE * transform.SCALE))) % transform.GRID_SIZE * 1000) / 1000 === 0 ? '#aaaaaa' : '#cccccc';
                ctx.beginPath();
                ctx.moveTo(0, i);
                ctx.lineTo(canvas.width, i);
                ctx.stroke();
            }


            Object.values(Schematic.activeSchematic.getComponents()).forEach(component => {
                component.render(ctx, drawCallback);
            });

            ctx.strokeStyle = "#000000"
            Object.keys(Schematic.activeSchematic.getConnections()).forEach(sourceUUID => {
                const source = Schematic.activeSchematic.getComponents()[sourceUUID];
                if(!source) return;
                const connection = Schematic.activeSchematic.getConnections()[sourceUUID];

                const x1 = (source.getPosition()[0] + transform.TRANSLATION[0]) * transform.GRID_SIZE * transform.SCALE + direction[source.orientation].x * transform.ELEMENT_SIZE / 2;
                const y1 = (source.getPosition()[1] + transform.TRANSLATION[1]) * transform.GRID_SIZE * transform.SCALE + direction[source.orientation].y * transform.ELEMENT_SIZE / 2;

                connection.forEach(componentUUID => {
                    const component = Schematic.activeSchematic.getComponents()[componentUUID.to];
                    if(!component) return;
                    const x2 = (component.getPosition()[0] + transform.TRANSLATION[0]) * transform.GRID_SIZE * transform.SCALE + direction[flip(component.orientation)].x * transform.ELEMENT_SIZE / 2;
                    const y2 = (component.getPosition()[1] + transform.TRANSLATION[1]) * transform.GRID_SIZE * transform.SCALE + direction[flip(component.orientation)].y * transform.ELEMENT_SIZE / 2;
                    
                    const reverseConnection = Schematic.activeSchematic.getReverseConnections()[componentUUID.to];
                    
                    const lx = (Math.max(...reverseConnection.map(c => Schematic.activeSchematic.getComponents()[c.from].getPosition()[0])) + transform.TRANSLATION[0]) * transform.GRID_SIZE * transform.SCALE + direction[source.orientation].x * transform.ELEMENT_SIZE / 2;
                    const hx = (Math.min(...connection.map(c => Schematic.activeSchematic.getComponents()[c.to].getPosition()[0])) + transform.TRANSLATION[0]) * transform.GRID_SIZE * transform.SCALE + direction[source.orientation].x * transform.ELEMENT_SIZE / 2;
                    const ly = (Math.max(...reverseConnection.map(c => Schematic.activeSchematic.getComponents()[c.from].getPosition()[1])) + transform.TRANSLATION[1]) * transform.GRID_SIZE * transform.SCALE + direction[source.orientation].y * transform.ELEMENT_SIZE / 2;
                    const hy = (Math.min(...connection.map(c => Schematic.activeSchematic.getComponents()[c.to].getPosition()[1])) + transform.TRANSLATION[1]) * transform.GRID_SIZE * transform.SCALE + direction[source.orientation].y * transform.ELEMENT_SIZE / 2;

                    //North
                    if(source.orientation === "N") {
                        ctx.beginPath();
                        ctx.moveTo(x1, y1);
                        ctx.lineTo(x1, hy);
                        ctx.lineTo(x2, hy);
                        ctx.lineTo(x2, y2);
                        ctx.stroke();
                    }
                    //South
                    if(source.orientation === "S") {
                        ctx.beginPath();
                        ctx.moveTo(x1, y1);
                        ctx.lineTo(x1, ly);
                        ctx.lineTo(x2, ly);
                        ctx.lineTo(x2, y2);
                        ctx.stroke();
                    }

                    //East
                    if(source.orientation === "E") {
                        ctx.beginPath();
                        ctx.moveTo(x1, y1);
                        ctx.lineTo(hx, y1);
                        ctx.lineTo(hx, y2);
                        ctx.lineTo(x2, y2);
                        ctx.stroke();
                    }
                    //West
                    if(source.orientation === "W") {
                        ctx.beginPath();
                        ctx.moveTo(x1, y1);
                        ctx.lineTo(lx, y1);
                        ctx.lineTo(lx, y2);
                        ctx.lineTo(x2, y2);
                        ctx.stroke();
                    }
                });
            });
        });
    }

    const mouseDown = (event: MouseEvent) => {
        if(option === 'move') {
            interactionState = {
                mouseDown: true,
                mouseDownPosition: [event.clientX, event.clientY]
            }
        } else if(option === 'edit') {
            const position = [Math.floor((event.clientX - transform.TRANSLATION[0] * transform.SCALE * transform.GRID_SIZE) / (transform.GRID_SIZE * transform.SCALE)), Math.floor((event.clientY - transform.TRANSLATION[1] * transform.SCALE * transform.GRID_SIZE) / (transform.GRID_SIZE * transform.SCALE))];
            if(editState == 'place') {
                console.log(Schematic.activeSchematic.addComponent(new Resistor([position[0], position[1]], 1)))
                console.log(Schematic.activeSchematic)
                setEditState("normal");
            } else {
                let clickedComponent;
                for(let i = 0; i < Object.values(Schematic.activeSchematic.getComponents()).length; i++) {
                    const component = Object.values(Schematic.activeSchematic.getComponents())[i];
                    if(component && component.getPosition()[0] === position[0] && component.getPosition()[1] === position[1]) {
                        clickedComponent = component;
                        break;
                    }
                }

                if(editState === 'connect') {
                    if(editComponent && clickedComponent && Object.hasOwn(Schematic.activeSchematic.getConnections(), editComponent.uuid) && Schematic.activeSchematic.getConnections()[editComponent.uuid].map(conn => conn.to).includes(clickedComponent.uuid)) {
                        Schematic.activeSchematic.deleteConnection(editComponent.uuid, clickedComponent.uuid);
                    } else if(editComponent && clickedComponent) {
                        Schematic.activeSchematic.addConnection(editComponent.uuid, clickedComponent.uuid);
                    }
                }

                setEditComponent(clickedComponent);
            }
        }
    }

    const mouseMove = (event: MouseEvent) => {
        if(option === 'move' && interactionState.mouseDown) {
            const deltaX = event.clientX - interactionState.mouseDownPosition[0];
            const deltaY = event.clientY - interactionState.mouseDownPosition[1];
            transform.TRANSLATION[0] += deltaX / (transform.GRID_SIZE * transform.SCALE);
            transform.TRANSLATION[1] += deltaY / (transform.GRID_SIZE * transform.SCALE);
            interactionState.mouseDownPosition = [event.clientX, event.clientY];
        }
    }

    const mouseUp = (event: MouseEvent) => {
        if(option === 'move'){
            interactionState = {
                mouseDown: false,
                mouseDownPosition: [0, 0]
            };
        }
    }

    const hook = (canvas: HTMLCanvasElement) => {
        canvas.addEventListener('mousedown', mouseDown);
        canvas.addEventListener('mousemove', mouseMove);
        canvas.addEventListener('mouseup', mouseUp);
    }

    useEffect(() => {
        window.addEventListener('resize', () => setWindowBounds([window.innerWidth, window.innerHeight]));

        window.requestAnimationFrame(() => {
            const canvas = document.getElementById('schematic-canvas') as HTMLCanvasElement;
            const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
            const id = Math.random();

            clearInterval(r as NodeJS.Timer);

            setR(setInterval(() => {
                render(canvas, ctx);
            }, 1000 / 60));
        });
    }, [option, editComponent, editState])

    useEffect(() => {
        const canvas = document.getElementById('schematic-canvas') as HTMLCanvasElement;
        hook(canvas);

        return () => {
            canvas.removeEventListener('mousedown', mouseDown);
            canvas.removeEventListener('mousemove', mouseMove);
            canvas.removeEventListener('mouseup', mouseUp);
        }
    }, [option, editComponent, editState])

    return <>
        <canvas id="schematic-canvas" width={windowBounds[0]} height={windowBounds[1]}></canvas>
        {
            option === 'edit' ? 
                <EditPane component={editComponent} setEditComponent={setEditComponent} editState={editState} setEditState={setEditState} />
                : <></>
        }
    </>
}