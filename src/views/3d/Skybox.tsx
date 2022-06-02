import { useThree } from "@react-three/fiber";
import { CubeTextureLoader } from "three";

export function SkyBox() {
    const { scene } = useThree();
    const loader = new CubeTextureLoader();  
    // The CubeTextureLoader load method takes an array of urls representing all 6 sides of the cube.  
    const texture = loader.load([
        "assets/posx.jpg",
        "assets/negx.jpg",
        "assets/posy.jpg",
        "assets/negy.jpg",
        "assets/posz.jpg",
        "assets/negz.jpg",
    ]);  
    // Set the scene background property to the resulting texture.  
    scene.background = texture;  
    return null;
}