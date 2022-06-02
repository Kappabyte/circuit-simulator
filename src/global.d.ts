declare module '*.module.css' {
    const classes: { [key: string]: string };
    export default classes;
}

declare module 'three.meshline' {
    const classes: { MeshLine: any, MeshLineMaterial: any, MeshLineRaycast: any }
    export class MeshLine extends THREE.BufferGeometry {[key: string]: any}
    export class MeshLineMaterial extends THREE.ShaderMaterial {[key: string]: any; props: any; constructor(parameters: any)}
    export class MeshLineRaycast extends THREE.Raycaster {[key: string]: any}
}