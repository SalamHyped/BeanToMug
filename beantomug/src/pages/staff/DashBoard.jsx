import MenuOrders from "../../components/layouts/StaffLayout/menuOrders/menuOrders";
import styles from './DashBoard.module.css';

export default function DashBoard(){
    return(
        <div className={styles.dashboard}>
            <h1 className={styles.title}>Staff Dashboard</h1>
            <MenuOrders/>
        </div>
    )
}