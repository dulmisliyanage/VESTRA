
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState
} from "react";

import api from "../services/api";

const CartContext = createContext(null);

const CART_STORAGE_KEY = "vestra_cart";

// Create a consistent ID for each product variant.
function getCartItemId(productId, sku, variantId) {
    return `${productId}-${sku || variantId}`;
}

// Read the cart from localStorage.
function loadSavedCart() {
    try {
        const saved = localStorage.getItem(CART_STORAGE_KEY);

        if (!saved) return [];

        const parsed = JSON.parse(saved);

        if (!Array.isArray(parsed)) return [];

        // Merge duplicate entries for the same product variant.
        const merged = new Map();

        for (const item of parsed) {
            if (!item.productId || !item.sku) continue;

            const id = getCartItemId(
                item.productId,
                item.sku,
                item.variantId
            );

            const stock = Math.max(0, Number(item.stock) || 0);
            const quantity = Math.max(1, Number(item.quantity) || 1);

            if (stock < 1) continue;

            if (merged.has(id)) {
                const existing = merged.get(id);

                merged.set(id, {
                    ...existing,
                    quantity: Math.min(
                        existing.quantity + quantity,
                        stock
                    )
                });
            } else {
                merged.set(id, {
                    ...item,
                    cartItemId: id,
                    stock,
                    quantity: Math.min(quantity, stock)
                });
            }
        }

        return Array.from(merged.values());
    } catch {
        return [];
    }
}

export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState(loadSavedCart);

    // Always keep the latest cart available to async functions.
    const cartRef = useRef(cartItems);

    // Increment whenever a cart operation changes its contents.
    const revisionRef = useRef(0);

    const changeCart = useCallback((updater) => {
        revisionRef.current += 1;

        setCartItems((current) => {
            const next =
                typeof updater === "function"
                    ? updater(current)
                    : updater;

            cartRef.current = next;

            return next;
        });
    }, []);

    useEffect(() => {
        cartRef.current = cartItems;

        localStorage.setItem(
            CART_STORAGE_KEY,
            JSON.stringify(cartItems)
        );
    }, [cartItems]);

    // ADD TO CART
    function addToCart(product, variant, quantity = 1) {
        if (!product || !variant) {
            return {
                success: false,
                message: "Please select a product variant."
            };
        }

        const requestedQuantity = Number(quantity);
        const availableStock = Number(variant.stock);

        if (
            !Number.isInteger(requestedQuantity) ||
            requestedQuantity < 1
        ) {
            return {
                success: false,
                message: "Invalid quantity."
            };
        }

        if (
            !Number.isFinite(availableStock) ||
            availableStock < requestedQuantity
        ) {
            return {
                success: false,
                message: "Not enough stock available."
            };
        }

        const cartItemId = getCartItemId(
            product._id,
            variant.sku,
            variant._id
        );

        const existing = cartRef.current.find(
            (item) => item.cartItemId === cartItemId
        );

        if (
            existing &&
            existing.quantity + requestedQuantity > availableStock
        ) {
            return {
                success: false,
                message: "Cannot exceed available stock."
            };
        }

        changeCart((current) => {
            const found = current.find(
                (item) => item.cartItemId === cartItemId
            );

            if (found) {
                return current.map((item) =>
                    item.cartItemId === cartItemId
                        ? {
                            ...item,
                            quantity: Math.min(
                                item.quantity + requestedQuantity,
                                availableStock
                            ),
                            stock: availableStock
                        }
                        : item
                );
            }

            return [
                ...current,
                {
                    cartItemId,
                    productId: product._id,
                    variantId: variant._id || null,
                    sku: variant.sku,
                    name: product.name,
                    price: Number(product.price),
                    image: product.images?.[0] || "",
                    size: variant.size,
                    color: variant.color,
                    stock: availableStock,
                    quantity: requestedQuantity
                }
            ];
        });

        return {
            success: true,
            message: "Product added to cart."
        };
    }

    // REMOVE ITEM
    function removeFromCart(cartItemId) {
        changeCart((current) =>
            current.filter(
                (item) => item.cartItemId !== cartItemId
            )
        );
    }

    // UPDATE QUANTITY
    function updateQuantity(cartItemId, quantity) {
        const newQuantity = Number(quantity);

        if (
            !Number.isInteger(newQuantity) ||
            newQuantity < 1
        ) {
            return;
        }

        changeCart((current) =>
            current.map((item) => {
                if (item.cartItemId !== cartItemId) {
                    return item;
                }

                if (newQuantity > item.stock) {
                    return item;
                }

                return {
                    ...item,
                    quantity: newQuantity
                };
            })
        );
    }

    // CLEAR CART
    function clearCart() {
        changeCart([]);
    }

    // VALIDATE CART AGAINST MONGODB
    const validateCart = useCallback(async () => {
        const startRevision = revisionRef.current;
        const snapshot = [...cartRef.current];

        if (snapshot.length === 0) {
            return {
                changed: false,
                removed: 0,
                adjusted: 0
            };
        }

        let removed = 0;
        let adjusted = 0;
        let failed = false;

        const validatedItems = [];

        for (const item of snapshot) {
            try {
                const response = await api.get(
                    `/products/${item.productId}`
                );

                const product =
                    response.data.product || response.data;

                const variant = product.variants?.find(
                    (v) =>
                        (item.variantId &&
                            String(v._id) === String(item.variantId)) ||
                        v.sku === item.sku
                );

                if (!variant || Number(variant.stock) < 1) {
                    removed++;
                    continue;
                }

                const stock = Number(variant.stock);

                const updatedItem = {
                    ...item,
                    cartItemId: getCartItemId(
                        product._id,
                        variant.sku,
                        variant._id
                    ),
                    variantId: variant._id || null,
                    sku: variant.sku,
                    name: product.name,
                    price: Number(product.price),
                    image: product.images?.[0] || "",
                    size: variant.size,
                    color: variant.color,
                    stock,
                    quantity: Math.min(item.quantity, stock)
                };

                if (
                    updatedItem.price !== item.price ||
                    updatedItem.stock !== item.stock ||
                    updatedItem.quantity !== item.quantity ||
                    updatedItem.name !== item.name
                ) {
                    adjusted++;
                }

                validatedItems.push(updatedItem);
            } catch (err) {
                if (
                    err.response?.status === 404 ||
                    err.response?.status === 403
                ) {
                    removed++;
                } else {
                    failed = true;
                    validatedItems.push(item);
                }
            }
        }

        // Never overwrite changes made while API requests ran.
        if (revisionRef.current !== startRevision) {
            return {
                changed: false,
                removed: 0,
                adjusted: 0,
                stale: true
            };
        }

        // Update only if the contents actually changed.
        if (removed > 0 || adjusted > 0) {
            changeCart(validatedItems);
        }

        return {
            changed: removed > 0 || adjusted > 0,
            removed,
            adjusted,
            failed
        };
    }, [changeCart]);

    const cartCount = cartItems.reduce(
        (total, item) => total + item.quantity,
        0
    );

    const cartSubtotal = cartItems.reduce(
        (total, item) =>
            total + item.price * item.quantity,
        0
    );

    return (
        <CartContext.Provider
            value={{
                cartItems,
                cartCount,
                cartSubtotal,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                validateCart
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);

    if (!context) {
        throw new Error(
            "useCart must be used inside CartProvider"
        );
    }

    return context;
}
