import classes from "./header.module.css";
import { FaShoppingCart, FaUser } from "react-icons/fa";
import React from "react";
import { NavLink, Link } from "react-router-dom";
import { useUser } from "../../context/UserContext/UserContext";

export default function Header() {
  const { user, logout } = useUser();

  return (
    <header className={classes.header}>
      <div className={classes.headerWrapper}>
        <div>
          <img src="/images/logo.png" alt="" />
        </div>

        <nav>
          <ul>
            <li>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  isActive
                    ? `${classes.menuItem} ${classes.active}`
                    : classes.menuItem
                }
                end
              >
                Home
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/menu"
                className={({ isActive }) =>
                  isActive
                    ? `${classes.menuItem} ${classes.active}`
                    : classes.menuItem
                }
              >
                menu
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/contact"
                className={({ isActive }) =>
                  isActive
                    ? `${classes.menuItem} ${classes.active}`
                    : classes.menuItem
                }
              >
                gallery
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/test"
                className={({ isActive }) =>
                  isActive
                    ? `${classes.menuItem} ${classes.active}`
                    : classes.menuItem
                }
                end
              >
                Contact us
              </NavLink>
            </li>
          </ul>
        </nav>
        <div className={classes.loginWrapper}>
          <Link to="/cart" className={classes.cart_button}>
            <FaShoppingCart />
          </Link>

          {user ? (
            <div className={classes.userMenu}>
              <button className={classes.userButton}>
                <FaUser />
                <span>
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.username
                  }
                </span>
              </button>
              <div className={classes.dropdownMenu}>
                <Link to="/customer/profile">Profile</Link>
                <Link to="/customer/orders">Orders</Link>
                <button onClick={logout} className={classes.logoutButton}>
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <Link className={classes.login_butt} to="/login">
              Log In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
