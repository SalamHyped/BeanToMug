import classes from "./header.module.css";
import { FaShoppingCart, FaUser } from "react-icons/fa";
import React from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { useUser } from "../../context/UserContext/UserContext";
import { motion, useScroll, useTransform } from "framer-motion";

export default function Header() {
  const { user, logout } = useUser();
  const location = useLocation();
  
  // Framer Motion scroll effect for home page
  const { scrollY } = useScroll();
  const headerBackground = useTransform(
    scrollY,
    [0, 150],
    ["rgba(111, 86, 72, 0.5)", "rgba(255, 255, 255, 1)"]
  );
  const headerShadow = useTransform(
    scrollY,
    [0, 150],
    ["0px 0px 0px rgba(213, 33, 33, 0)", "0px 4px 16px rgba(213, 33, 33, 0.07)"]
  );
  const headerBorderRadius = useTransform(
    scrollY,
    [0, 150],
    ["0px", "0px 0px 1.5em 1.5em"]
  );
  const textColor = useTransform(
    scrollY,
    [0, 150],
    ["rgba(255, 255, 255, 1)", "rgba(137, 102, 81, 1)"]
  );
  const iconColor = useTransform(
    scrollY,
    [0, 150],
    ["rgba(255, 255, 255, 1)", "rgba(137, 102, 81, 1)"]
  );
  // Only apply scroll effects on home page
  const isHomePage = location.pathname === '/';
  
  // Efficient route-based header styling
  const headerClass = location.pathname === '/' 
    ? `${classes.header} ${classes.transparentHeader}`
    : location.pathname.startsWith('/customer')
    ? `${classes.header} ${classes.customerHeader}`
    : classes.header;

  return (
    <motion.header 
      className={headerClass}
      style={{
        backgroundColor: isHomePage ? headerBackground : '#ffffff',
        boxShadow: isHomePage ? headerShadow : '0 4px 16px rgba(213, 33, 33, 0.07)',
        borderRadius: isHomePage ? headerBorderRadius : '0 0 1.5em 1.5em',
      }}
      transition={{
        type: "spring",
        stiffness: 100,
        damping: 20,
        mass: 0.5
      }}
    >
      <div className={classes.headerWrapper}>
        <div>
          <img src="/images/logo.png" alt="" className={classes.logo} />
        </div>

        <nav>
          <ul>
            <motion.li
              initial={isHomePage ? { opacity: 0, y: -20 } : { opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: isHomePage ? 0.3 : 0 }}
            >
              <motion.div 
                style={{ 
                  color: isHomePage ? textColor : '#896651',
                  opacity: 1
                }}
              >
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    isActive
                      ? `${classes.menuItem} ${classes.active}`
                      : classes.menuItem
                  }
                  style={{ color: 'inherit' }}
                  end
                >
                  Home
                </NavLink>
              </motion.div>
            </motion.li>
            <li>
              <motion.div 
                style={{ 
                  color: isHomePage ? textColor : '#896651',
                  opacity: 1
                }}
              >
                <NavLink
                  to="/menu"
                  className={({ isActive }) =>
                    isActive
                      ? `${classes.menuItem} ${classes.active}`
                      : classes.menuItem
                  }
                  style={{ color: 'inherit' }}
                >
                  menu
                </NavLink>
              </motion.div>
            </li>
            <li>
              <motion.div 
                style={{ 
                  color: isHomePage ? textColor : '#896651',
                  opacity: 1
                }}
              >
                <NavLink
                  to="/gallery"
                  className={({ isActive }) =>
                    isActive
                      ? `${classes.menuItem} ${classes.active}`
                      : classes.menuItem
                  }
                  style={{ color: 'inherit' }}
                >
                  gallery
                </NavLink>
              </motion.div>
            </li>
            <li>
              <motion.div 
                style={{ 
                  color: isHomePage ? textColor : '#896651',
                  opacity: 1
                }}
              >
                <NavLink
                  to="/contact"
                  className={({ isActive }) =>
                    isActive
                      ? `${classes.menuItem} ${classes.active}`
                      : classes.menuItem
                  }
                  style={{ color: 'inherit' }}
                  end
                >
                  Contact us
                </NavLink>
              </motion.div>
            </li>
          </ul>
        </nav>
        <div className={classes.loginWrapper}>
          <motion.div 
            style={{ 
              color: isHomePage ? iconColor : '#896651',
              opacity: 1
            }}
          >
            <Link to="/cart" className={classes.cart_button}>
              <FaShoppingCart />
            </Link>
          </motion.div>

          {user ? (
            <div className={classes.userMenu}>
              <motion.button 
                className={classes.userButton}
                style={{ 
                  color: isHomePage ? iconColor : '#896651',
                  opacity: 1
                }}
              >
                <FaUser />
                <span>
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.username
                  }
                </span>
              </motion.button>
              <div className={classes.dropdownMenu}>
                <Link to="/customer/profile">Profile</Link>
                <Link to="/customer/orders">Orders</Link>
                <Link to="/customer/receipts">Receipts</Link>
                <button onClick={logout} className={classes.logoutButton}>
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <motion.div 
              style={{ 
                color: isHomePage ? textColor : '#896651',
                opacity: 1
              }}
            >
              <Link 
                className={classes.login_butt} 
                to="/login"
                style={{ 
                  color: 'inherit',
                  border: '2px solid currentColor',
                  backgroundColor: 'transparent'
                }}
              >
                Log In
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </motion.header>
  );
}
