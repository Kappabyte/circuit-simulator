import { SetView, View } from "../views/View";
import styles from "../styles/Statusbar.module.css"

const StatusBar = ({view, setView}:{view: View, setView: SetView}) => {
    return <div className={styles.bar}>
        <div className={styles.views}>
            <ViewToggle enabled={view === 'schematic'} view='schematic' setView={setView} color='rgb(0, 195, 255)'/>
            <ViewToggle enabled={view === 'detailed'} view='detailed' setView={setView} color='rgb(237, 166, 24)'/>
            <ViewToggle enabled={view === 'rendered'} view='rendered' setView={setView} color='rgb(24, 242, 79)'/>
        </div>
        <p>v 0.0.1a</p>
    </div>
}

const ViewToggle = ({enabled, view, setView, color}: {enabled:boolean, view: View, setView: SetView, color: string}) => {
    return <>
        <div className={`${styles.viewToggle} ${enabled ? styles.toggled : ""}`} onClick={() => {setView(view)}}>
            <div className={styles.toggleIcon} style={{backgroundColor: color}}></div>
            <span>{view}</span>
        </div>
    </>
}

export default StatusBar;