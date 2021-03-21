import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
    children: ReactNode;
}

interface UpdateProductAmount {
    productId: number;
    amount: number;
}

interface CartContextData {
    cart: Product[];
    addProduct: (productId: number) => Promise<void>;
    removeProduct: (productId: number) => void;
    updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
    const [cart, setCart] = useState<Product[]>(() => {
        const storagedCart = localStorage.getItem('@RocketShoes:cart')

        if (storagedCart) {
            return JSON.parse(storagedCart);
        }

        return [];
    });

    const addProduct = async (productId: number) => {
        try {
            const product = cart.find(product => product.id === productId)

            if (product) {
                const response = await api.get<Stock>(`/stock/${productId}`)

                const { data } = response

                if (product.amount < data.amount) {
                    product.amount += 1

                    setCart([...cart])
                    localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart]))
                } else {
                    toast.error('Quantidade solicitada fora de estoque')
                }
            } else {

                const productResponse = await api.get<Product>(`/products/${productId}`)
                const stockResponse = await api.get<Stock>(`/stock/${productId}`)

                const { data: product } = productResponse
                const { data: stock } = stockResponse

                if (stock.amount >= 1) {
                    product.amount = 1

                    setCart([product, ...cart])
                    localStorage.setItem('@RocketShoes:cart', JSON.stringify([product, ...cart]))
                } else {
                    toast.error('Quantidade solicitada fora de estoque')
                }
            }

        } catch {
            toast.error('Erro na adição do produto')
            return
        }
    };

    const removeProduct = (productId: number) => {
        try {
            const product = cart.find(product => product.id === productId)

            if (product) {
                const productList = cart.filter(product => product.id !== productId)

                setCart(productList)
                localStorage.setItem('@RocketShoes:cart', JSON.stringify(productList))
            }else{
                toast.error('Erro na remoção do produto')
            }
        } catch {
            toast.error('Erro na remoção do produto')
        }
    };

    const updateProductAmount = async ({
        productId,
        amount,
    }: UpdateProductAmount) => {
        try {
            if (amount < 1)
                return

            const product = cart.find(product => product.id === productId)

            if (product) {
                const response = await api.get<Stock>(`/stock/${productId}`)
                const { data } = response

                if (amount <= data.amount) {
                    product.amount = amount

                    setCart([...cart])
                    localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart]))
                } else {
                    toast.error('Quantidade solicitada fora de estoque')
                }
            } else {
                toast.error('Erro na alteração de quantidade do produto');
            }
        } catch {
            toast.error('Erro na alteração de quantidade do produto');
        }
    };

    return (
        <CartContext.Provider
            value={{ cart, addProduct, removeProduct, updateProductAmount }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart(): CartContextData {
    const context = useContext(CartContext);

    return context;
}
