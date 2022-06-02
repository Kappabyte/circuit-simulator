import { SetView, View } from "../views/View";
import styles from "../styles/Statusbar.module.css"
import { url } from "inspector";
import { Schematic } from "../logic/Schematic";

const StatusBar = ({option, setOption}:{option: string, setOption: SetView}) => {
    return <div className={styles.bar}>
        <div className={styles.views}>
            <Toggle enabled={option === 'move'} option='move' setOption={setOption} image='assets/view.png'/>
            <Toggle enabled={option === 'edit'} option='edit' setOption={setOption} image='assets/edit.png'/>
            <Toggle enabled={option === 'rendered'} option='rendered' setOption={setOption} image='assets/cube.png'/>
        </div>
        <div className={styles.actions}>
            <BtnSave/>
            <BtnLoad/>
            <p>v 0.0.1a</p>
        </div>
    </div>
}

const Toggle = ({enabled, option, setOption, image}: {enabled:boolean, option: View, setOption: SetView, image: string}) => {
    return <>
        <div className={`${styles.viewToggle} ${enabled ? styles.toggled : ""}`} onClick={() => {setOption(option)}}>
            <div className={styles.toggleIcon} style={{backgroundImage: `url(${image})`}}></div>
        </div>
    </>
}

const BtnSave = () => {
    return <>
        <div className={`${styles.viewBtn}`} onClick={() => {
                let element = document.createElement('a');
                element.setAttribute('href','data:text/plain;charset=utf-8, ' + encodeURIComponent(JSON.stringify(Schematic.activeSchematic)));
                element.setAttribute('download', new Date().toString() + ".schematic");
                document.body.appendChild(element);
                element.click();
                
            }}>
            <div className={styles.toggleIcon} style={{backgroundImage: `url(${'assets/diskette.png'})`}}></div>
        </div>
    </>
}

const BtnLoad = () => {
    return <>
        <div className={`${styles.viewBtn}`}>
        <div className={styles.toggleIcon} style={{backgroundImage: `url(${'assets/folder.png'})`}}></div>
            <input type="file" className={styles.toggleIcon} onChange={(e) => {
                if(!e || !e.target || !e.target.files) return;
                let file = e.target.files[0];
                if (!file) {
                  return;
                }
                let reader = new FileReader();
                reader.onload = function(e) {
                    console.log("done")
                  let contents = e.target?.result;
                  if(contents) {
                    Schematic.activeSchematic = Schematic.load(contents as string);
                  }
                };
                reader.readAsText(file);
            }} />
        </div>
    </>
}

export default StatusBar;