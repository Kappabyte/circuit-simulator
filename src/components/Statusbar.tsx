import { SetView, View } from "../views/View";
import styles from "../styles/Statusbar.module.css"
import { url } from "inspector";

const StatusBar = ({option, setOption}:{option: string, setOption: SetView}) => {
    return <div className={styles.bar}>
        <div className={styles.views}>
            <Toggle enabled={option === 'move'} option='move' setOption={setOption} image='assets/view.png'/>
            <Toggle enabled={option === 'edit'} option='edit' setOption={setOption} image='assets/edit.png'/>
            <Toggle enabled={option === 'rendered'} option='rendered' setOption={setOption} image='assets/cube.png'/>
        </div>
        <p>v 0.0.1a</p>
    </div>
}

const Toggle = ({enabled, option, setOption, image}: {enabled:boolean, option: View, setOption: SetView, image: string}) => {
    return <>
        <div className={`${styles.viewToggle} ${enabled ? styles.toggled : ""}`} onClick={() => {setOption(option)}}>
            <div className={styles.toggleIcon} style={{backgroundImage: `url(${image})`}}></div>
        </div>
    </>
}

export default StatusBar;