import { Line, OrbitControls } from "@react-three/drei"
import { Canvas, useLoader } from "@react-three/fiber"
import { Schematic } from "../logic/Schematic"
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'

import "./3d/line"
import * as THREE from 'three';
import { BufferGeometry, LineBasicMaterial } from "three";
import { useState } from "react"
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader"
import { Cell, Resistor } from "../logic/Component"
import { SkyBox } from "./3d/Skybox"

export const RenderedView = () => {
    return <div style={{width: "100%", height: "100%"}}>
        <Canvas>
            <SkyBox />
            <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} makeDefault={true} target={[0, 0, 0]}/>
            <ambientLight />
            <pointLight position={[10, 5, 5]} />
            <Board />
        </Canvas>
    </div>
}

const direction = {
    'N': { x: 0, y: -1 },
    'E': { x: -1, y: 0 },
    'S': { x: 0, y: 1 },
    'W': { x: 1, y: 0 }
}

const rotation: Record<string, number> = {
    'N': 0,
    'E': Math.PI * 3 / 2,
    'S': Math.PI,
    'W': Math.PI * 1 / 2
}

const flip = (i: 'N' | 'E' | 'S' | 'W') => {
    switch(i) {
        case "N": return "S";
        case "S": return "N";
        case "E": return "W";
        case "W": return "E";
    }
}

const colours: Record<string, number> = {
    '-2': 0xbfbebf,
    '-1': 0xc08327,
    '0': 0x000000,
    '1': 0x512627,
    '2': 0xcc0000,
    '3': 0xd87347,
    '4': 0xe6c951,
    '5': 0x528f65,
    '6': 0x0f5190,
    '7': 0x6967ce,
    '8': 0x7d7d7d,
    '9': 0xffffff
}

const LINE_WIDTH = .1;

const Board = () => {

    let smallestX = Infinity;
    let smallestY = Infinity;
    let biggestX = -Infinity;
    let biggestY = -Infinity;

    const ResistorMtl = useLoader(MTLLoader, 'assets/resistor.mtl');
    const ResistorOBJ = useLoader(OBJLoader, 'assets/resistor.obj');
    
    const BatteryMtl = useLoader(MTLLoader, 'assets/battery.mtl');
    const BatteryOBJ = useLoader(OBJLoader, 'assets/battery.obj');
    
    ResistorMtl.preload();
    ResistorOBJ.traverse(child => {
        if (child instanceof THREE.Mesh) {
            child.material = Object.values(ResistorMtl.materials);
        }
    })

    BatteryMtl.preload();
    BatteryOBJ.traverse(child => {
        if (child instanceof THREE.Mesh) {
            child.material = Object.values(BatteryMtl.materials);
        }
    })

    Object.values(Schematic.activeSchematic.getComponents()).map((component) => {
        if(component.getPosition()[0] < smallestX) {
            smallestX = component.getPosition()[0];
        }
        if(component.getPosition()[1] < smallestY) {
            smallestY = component.getPosition()[1];
        }
        if(component.getPosition()[0] > biggestX) {
            biggestX = component.getPosition()[0];
        }
        if(component.getPosition()[1] > biggestY) {
            biggestY = component.getPosition()[1];
        }
    });

    console.log(smallestX, smallestY, biggestX, biggestY);
    console.log([(biggestX - smallestX), .1, (biggestY - smallestY)])


    return <>
        <mesh
            position={[0, -0.3, 0]}
            rotation={[0, 0, 0]}
            scale={[1, 1, 1]}>
                <boxGeometry args={[(biggestX - smallestX) + 3, .1, (biggestY - smallestY) + 3]} />
                <meshStandardMaterial color={0x002d04} />
        </mesh>

        {Object.values(Schematic.activeSchematic.getComponents()).map((component) => {

            let object;
            if(component instanceof Resistor) {

                let resistance_decimal = component.getResistance().toExponential().split('e').map(a => parseFloat(a))[0] * 10;
                let resistance_exponent = component.getResistance().toExponential().split('e').map(a => parseFloat(a))[1] - 1;

                console.log(resistance_decimal, resistance_exponent);

                object = ResistorOBJ.clone(true);
                let mat = ResistorMtl.preload();
                object.traverse(child => {
                    if (child instanceof THREE.Mesh) {
                        child.material = child.material.map((a: THREE.Material) => a.clone());
                        // 4312
                        child.material[4].color.setHex(colours[`${resistance_decimal}`.substring(0, 1)]);
                        child.material[3].color.setHex(colours[`${resistance_decimal}`.substring(1, 2)]);
                        child.material[1].color.setHex(colours[`${resistance_exponent}`]);
                        child.material[2].color.setHex(0x7d7d7d);
                    }
                })
            } else if(component instanceof Cell) {
                object = BatteryOBJ.clone(true);
            }

            return <primitive 
                position={[smallestX - component.getPosition()[0] + (biggestX - smallestX)/2, -(component instanceof Resistor ? .1 : 0.07), smallestY - component.getPosition()[1] + (biggestY - smallestY)/2]}
                rotation={[0, rotation[component.orientation], 0]}
                key={component.uuid}
                scale={[.1, .1, .1]}
                
                object={object}/>
        })}

        {
            Object.values(Schematic.activeSchematic.getComponents()).map((source) => {
                const x = smallestX - (source.getPosition()[0]) + (biggestX - smallestX)/2;
                const y = smallestY - (source.getPosition()[1]) + (biggestY - smallestY)/2;
                if(Object.hasOwn(Schematic.activeSchematic.getConnections(), source.uuid)) {
                    const points = []
                    const x1 = x + source.getRelativeConnectionLocation3D(0)[0];
                    const y1 = y + source.getRelativeConnectionLocation3D(0)[1];
                    if(source.orientation === 'N' || source.orientation === 'S') {
                        points.push(new THREE.Vector3(x1 , 0.5, y1 ))
                        points.push(new THREE.Vector3(x1 , 0.5, y + direction[source.orientation].y))
                        points.push(new THREE.Vector3(x + direction[source.orientation].x, 0.5, y + direction[source.orientation].y))
                    } else {
                        points.push(new THREE.Vector3(x1 , 0.5, y1 ))
                        points.push(new THREE.Vector3(x + direction[source.orientation].x, 0.5, y1 ))
                        points.push(new THREE.Vector3(x + direction[source.orientation].x, 0.5, y + direction[source.orientation].y))
                    }
                    return <line_ key={`${source.uuid}`} geometry={new THREE.BufferGeometry().setFromPoints(points)} material={new THREE.LineBasicMaterial({ color: 0xFFD700 })} position={[0, -.75, 0]} />
                }
            })
        }

        {
            Object.values(Schematic.activeSchematic.getComponents()).map((source) => {
                const x = smallestX - (source.getPosition()[0]) + (biggestX - smallestX)/2;
                const y = smallestY - (source.getPosition()[1]) + (biggestY - smallestY)/2;
                if(Object.hasOwn(Schematic.activeSchematic.getReverseConnections(), source.uuid)) {
                    const points: THREE.Vector3[] = [];
                    const x1 = x + source.getRelativeConnectionLocation3D(1)[0];
                    const y1 = y + source.getRelativeConnectionLocation3D(1)[1];

                    if(source.orientation === 'N' || source.orientation === 'S') {
                        points.push(new THREE.Vector3(x1 , 0.5, y1 ))
                        points.push(new THREE.Vector3(x1 , 0.5, y + direction[flip(source.orientation)].y))
                        points.push(new THREE.Vector3(x + direction[flip(source.orientation)].x, 0.5, y + direction[flip(source.orientation)].y))
                    } else {
                        points.push(new THREE.Vector3(x1 , 0.5, y1 ))
                        points.push(new THREE.Vector3(x + direction[flip(source.orientation)].x, 0.5, y1 ))
                        points.push(new THREE.Vector3(x + direction[flip(source.orientation)].x, 0.5, y + direction[flip(source.orientation)].y))
                    }
                    return <line_ key={`${source.uuid}`} geometry={new THREE.BufferGeometry().setFromPoints(points)} material={new THREE.LineBasicMaterial({ color: 0xFFD700 })} position={[0, -.75, 0]}/>
                }
            })
        }

        {
            Object.keys(Schematic.activeSchematic.getConnections()).map(sourceUUID => {
                const source = Schematic.activeSchematic.getComponents()[sourceUUID];
                if(!source) return;
                const connection = Schematic.activeSchematic.getConnections()[sourceUUID];

                const x1 = smallestX - (source.getPosition()[0] + direction[source.orientation].x) + (biggestX - smallestX)/2;
                const y1 = smallestY - (source.getPosition()[1] + direction[source.orientation].y) + (biggestY - smallestY)/2;

                return connection.map(componentUUID => {
                    const points = []
                    const component = Schematic.activeSchematic.getComponents()[componentUUID.to];
                    if(!component) return;
                    const x2 = smallestX - (component.getPosition()[0] + direction[flip(component.orientation)].x) + (biggestX - smallestX)/2 ;
                    const y2 = smallestY - (component.getPosition()[1] + direction[flip(component.orientation)].y) + (biggestY - smallestY)/2;
                    
                    const reverseConnection = Schematic.activeSchematic.getReverseConnections()[componentUUID.to];
                    
                    const lx = smallestX - (Math.max(...reverseConnection.map(c => Schematic.activeSchematic.getComponents()[c.from].getPosition()[0]))) + (biggestX - smallestX)/2;
                    const hx = smallestX - (Math.min(...connection.map(c => Schematic.activeSchematic.getComponents()[c.to].getPosition()[0]))) + (biggestX - smallestX)/2;
                    const ly = smallestY - (Math.max(...reverseConnection.map(c => Schematic.activeSchematic.getComponents()[c.from].getPosition()[1]))) + (biggestY - smallestY)/2;
                    const hy = smallestY - (Math.min(...connection.map(c => Schematic.activeSchematic.getComponents()[c.to].getPosition()[1]))) + (biggestY - smallestY)/2;

                    //North
                    if(source.orientation === "N") {
                        points.push(new THREE.Vector3(x1, 0.5, y1))
                        points.push(new THREE.Vector3(x1, 0.5, hy + 1))
                        points.push(new THREE.Vector3(x2, 0.5, hy + 1))
                        points.push(new THREE.Vector3(x2, 0.5, y2))
                    }
                    //South
                    if(source.orientation === "S") {
                        points.push(new THREE.Vector3(x1, 0.5, y1))
                        points.push(new THREE.Vector3(x1, 0.5, ly - 1))
                        points.push(new THREE.Vector3(x2, 0.5, ly - 1))
                        points.push(new THREE.Vector3(x2, 0.5, y2))
                    }

                    //East
                    if(source.orientation === "E") {
                        points.push(new THREE.Vector3(x1, 0.5, y1))
                        points.push(new THREE.Vector3(hx + 1, 0.5, y1))
                        points.push(new THREE.Vector3(hx + 1, 0.5, y2))
                        points.push(new THREE.Vector3(x2, 0.5, y2))
                    }
                    //West
                    if(source.orientation === "W") {
                        points.push(new THREE.Vector3(x1, 0.5, y1))
                        points.push(new THREE.Vector3(lx - 1, 0.5, y1))
                        points.push(new THREE.Vector3(lx - 1, 0.5, y2))
                        points.push(new THREE.Vector3(x2, 0.5, y2))
                    }

                    return <line_ key={`${component.uuid + source.uuid}`} geometry={new THREE.BufferGeometry().setFromPoints(points)} material={new LineBasicMaterial({ color: 0xFFD700, linewidth: 100 })} position={[0, -.75, 0]}/>
                });
            })
        }
    </>
}

const Test = () => {
    return <>
        <mesh
            position={[0, 0, 0]}>
            <boxGeometry args={[.5, .5, .5]} />
            <meshStandardMaterial color={0x000000} />
        </mesh>
        <mesh
            position={[1, 0, 0]}>
            <boxGeometry args={[.5, .5, .5]} />
            <meshStandardMaterial color={0x000000} />
        </mesh>
        <mesh
            position={[0, 0, 1]}>
            <boxGeometry args={[.5, .5, .5]} />
            <meshStandardMaterial color={0x000000} />
        </mesh>
        <mesh
            position={[1, 0, 1]}>
            <boxGeometry args={[.5, .5, .5]} />
            <meshStandardMaterial color={0x000000} />
        </mesh>
        
        <mesh
            position={[0.5, -0.5, 0.5]}>
            <meshStandardMaterial color={0x000000} />
        </mesh>
    </>
}