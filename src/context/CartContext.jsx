import { createContext, useContext, useState, useCallback } from "react";

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState({});

  const getQuantity = useCallback((productId) => {
    return cartItems[productId]?.quantity || 0;
  }, [cartItems]);

  const addToCart = useCallback((product) => {
    setCartItems((prev) => ({
      ...prev,
      [product.id]: {
        ...product,
        quantity: (prev[product.id]?.quantity || 0) + 1,
      },
    }));
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCartItems((prev) => {
      const newItems = { ...prev };
      delete newItems[productId];
      return newItems;
    });
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    setCartItems((prev) => {
      if (quantity <= 0) {
        const newItems = { ...prev };
        delete newItems[productId];
        return newItems;
      }
      return {
        ...prev,
        [productId]: {
          ...prev[productId],
          quantity,
        },
      };
    });
  }, []);

  const setProductQuantity = useCallback((product, quantity) => {
    setCartItems((prev) => {
      if (quantity <= 0) {
        const newItems = { ...prev };
        delete newItems[product.id];
        return newItems;
      }
      return {
        ...prev,
        [product.id]: {
          ...product,
          quantity,
        },
      };
    });
  }, []);

  const getCartProducts = useCallback(() => {
    return Object.values(cartItems).filter((item) => item.quantity > 0);
  }, [cartItems]);

  /** Format cart for checkout executor API: { items: [{ url, quantity, itemId, title, name, brand }] } */
  const getCartForCheckout = useCallback(() => {
    return {
      items: getCartProducts()
        .filter((item) => item.url)
        .map((item) => ({
          itemId: item.id,
          url: item.url,
          quantity: item.quantity,
          title: item.name,
          name: item.name,
          brand: item.brand,
        })),
    };
  }, [cartItems, getCartProducts]);

  const getTotalItems = useCallback(() => {
    return Object.values(cartItems).reduce((acc, item) => acc + item.quantity, 0);
  }, [cartItems]);

  const getTotalPrice = useCallback(() => {
    return Object.values(cartItems).reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
  }, [cartItems]);

  const getTotalSavings = useCallback(() => {
    return Object.values(cartItems).reduce(
      (acc, item) =>
        acc + (item.originalPrice ? (item.originalPrice - item.price) * item.quantity : 0),
      0
    );
  }, [cartItems]);

  const clearCart = useCallback(() => {
    setCartItems({});
  }, []);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        getQuantity,
        addToCart,
        removeFromCart,
        updateQuantity,
        setProductQuantity,
        getCartProducts,
        getCartForCheckout,
        getTotalItems,
        getTotalPrice,
        getTotalSavings,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
