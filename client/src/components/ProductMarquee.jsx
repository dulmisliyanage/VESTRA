
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./ProductMarquee.css";

export default function ProductMarquee() {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        let active = true;

        async function loadProducts() {
            try {
                const response = await api.get("/products", {
                    params: { page: 1, limit: 12 }
                });

                const data = response.data;

                const items = Array.isArray(data)
                    ? data
                    : Array.isArray(data.products)
                        ? data.products
                        : [];

                if (active) {
                    setProducts(
                        items.filter((product) => {
                            const image = product.images?.[0];
                            return typeof image === "string"
                                ? Boolean(image)
                                : Boolean(image?.url);
                        })
                    );
                }
            } catch (error) {
                console.error("Failed to load homepage products:", error);
            }
        }

        loadProducts();

        return () => {
            active = false;
        };
    }, []);

    if (products.length === 0) return null;

    const renderProduct = (product, index, duplicate = false) => {
        const image = product.images[0];
        const imageUrl =
            typeof image === "string" ? image : image.url;

        return (
            <Link
                key={`${product._id}-${index}-${duplicate}`}
                to={`/shop/products/${product._id}`}
                className="vestra-marquee-card"
                tabIndex={duplicate ? -1 : 0}
                aria-hidden={duplicate ? true : undefined}
            >
                <div className="vestra-marquee-image">
                    <img
                        src={imageUrl}
                        alt={duplicate ? "" : product.name}
                        loading="lazy"
                    />
                </div>
            </Link>
        );
    };

    return (
        <div className="vestra-marquee-viewport" aria-label="Featured fashion products">
            <div className="vestra-marquee-track">
                <div className="vestra-marquee-group">
                    {products.map((product, index) =>
                        renderProduct(product, index)
                    )}
                </div>

                <div className="vestra-marquee-group" aria-hidden="true">
                    {products.map((product, index) =>
                        renderProduct(product, index, true)
                    )}
                </div>
            </div>
        </div>
    );
}
