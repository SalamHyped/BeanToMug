import classes from './header.module.css'
import React from 'react';
import { IoIosHelpCircleOutline } from "react-icons/io";


import { NavLink ,Link} from 'react-router-dom';
export default function Header(){
    return(
     
        <header className={classes.header}>

          <div className={classes.headerWrapper}>
          <div>
            <img  src="/images/logo.png" alt="" />
          </div>
      
      
        <nav>
        <ul >
          <li>
          <NavLink
            to='/'
            className={({ isActive }) =>
            isActive ? `${classes.menuItem} ${classes.active}` : classes.menuItem
            }
            end
          >
            Home
          </NavLink>
          </li>
          <li>
          <NavLink
            to='/menu'
            className={({ isActive }) =>
            isActive ? `${classes.menuItem} ${classes.active}` : classes.menuItem
            }
          >
            menu
          </NavLink>
          </li>
          <li>
          <NavLink
            to='/contact'
            className={({ isActive }) =>
            isActive ? `${classes.menuItem} ${classes.active}` : classes.menuItem
            }
          >
            gallery
          </NavLink>
          </li>
          <li>
          <NavLink
            to='/test'
            className={({ isActive }) =>
            isActive ? `${classes.menuItem} ${classes.active}` : classes.menuItem
            }
            end
          >
            Contact us
          </NavLink>
          </li>
        </ul>
        </nav>
        <div className={classes.loginWrapper}>
        <button ><Link className={classes.login_butt} to='/login'>Log In</Link></button>
          <IoIosHelpCircleOutline />

      </div>
      </div>
    </header>


    );
}