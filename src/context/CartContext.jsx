import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  return useContext(CartContext);
};

// Helper to generate a unique ID based on item properties
const generateUniqueId = (item) => {
  // Use _id, selectedLevel (or 'none'), selectedFormat (or 'none')
  return `${item._id}-${item.selectedLevel || 'none'}-${item.selectedFormat || 'none'}`;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const localData = localStorage.getItem('cartItems');
      console.log("Loading cart from localStorage:", localData); // Debug log
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      console.error("Failed to parse cart from local storage", error);
      return [];
    }
  });

  // Save to local storage whenever cart changes
  useEffect(() => {
    try {
       console.log("Saving cart to localStorage:", cartItems); // Debug log
       localStorage.setItem('cartItems', JSON.stringify(cartItems));
    } catch (error) {
        console.error("Failed to save cart to local storage", error);
    }
  }, [cartItems]);

  const addToCart = (item) => {
    // Ensure item has at least a quantity of 1
    const quantityToAdd = Math.max(1, item.quantity || 1);

    setCartItems((prevItems) => {
      const uniqueId = generateUniqueId(item);
      const existingItemIndex = prevItems.findIndex((i) => i.uniqueId === uniqueId);

      if (existingItemIndex > -1) {
        // Item exists, update quantity
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          // Add quantityToAdd to existing quantity
          quantity: (updatedItems[existingItemIndex].quantity || 0) + quantityToAdd
        };
        console.log("Updating item quantity in cart:", uniqueId, updatedItems[existingItemIndex].quantity); // Debug log
        return updatedItems;
      } else {
        // Add new item with uniqueId and ensure quantity
        const newItem = { ...item, quantity: quantityToAdd, uniqueId };
        console.log("Adding new item to cart:", newItem); // Debug log
        return [...prevItems, newItem];
      }
    });
  };

  const removeFromCart = (uniqueId) => {
    console.log("Removing item from cart:", uniqueId); // Debug log
    setCartItems((prevItems) => prevItems.filter(item => item.uniqueId !== uniqueId));
  };

  const updateQuantity = (uniqueId, newQuantity) => {
    const quantity = parseInt(newQuantity, 10);
    console.log("Attempting to update quantity:", uniqueId, quantity); // Debug log

    if (isNaN(quantity) || quantity < 1) {
      removeFromCart(uniqueId);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.uniqueId === uniqueId ? { ...item, quantity: quantity } : item
      )
    );
  };

  // Check if item added (using base _id for button state)
  const isItemAdded = (id) => {
     // Check if *any* variant (level/format) of this item ID is in the cart
    return cartItems.some((item) => item._id === id);
  };

  const clearCart = () => {
    console.log("Clearing cart"); // Debug log
    setCartItems([]);
  };

  // Calculate totals
  const totalItems = cartItems.reduce((total, item) => total + (item.quantity || 0), 0);
  const totalPrice = cartItems.reduce((total, item) => {
    const price = Number(item.discountPrice || item.price || 0);
    const quantity = Number(item.quantity || 0);
    return total + price * quantity;
  }, 0);

  // Expose cart state and actions
  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    isItemAdded,
    clearCart,
    totalItems,
    totalPrice,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};