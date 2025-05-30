import classes from "./Cart.module.css";

export default function Cart({ item }) {
  function handleOptions() {
    const options = Object.entries(item.options)
      .map(([key, value]) => {
        if (value) {
          return typeof value === "boolean" ? key : value.toString();
        }
      })
      .filter(Boolean);

    return options.join(", ");
  }

  return (
    <div className={classes.cartCard}>
      <div className={classes.cartImage}>
        <img
          className={classes.cartImg}
          src={item.item_photo_url}
          alt={item.item_name}
        />
      </div>
      <div className={classes.cartDetails}>
        <div className={classes.cartName}>{item.item_name}</div>
        <div className={classes.cartOptions}>
          {item.options && Object.keys(item.options).length
            ? handleOptions()
            : ""}
        </div>
      </div>
      <div className={classes.cartQuantity}>
        <button className={classes.cartButton} disabled>
          -
        </button>
        <span>{item.quantity}</span>
        <button className={classes.cartButton} disabled>
          +
        </button>
      </div>
      <button className={classes.cartDelete} disabled>
        🗑️
      </button>
    </div>
  );
}
