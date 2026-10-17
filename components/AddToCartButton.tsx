"use client";
import { useState } from 'react';
import { addToCart } from '../src/lib/cart';

interface AddToCartButtonProps {
	productId: string;
	qty?: number; // default 1
	className?: string;
	onAdded?: () => void;
	label?: string;
}

export default function AddToCartButton({ productId, qty = 1, className = '', onAdded, label = 'Agregar al carrito' }: AddToCartButtonProps) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [added, setAdded] = useState(false);

	async function handleClick() {
		if (loading) return;
		setError(null);
		setLoading(true);
		try {
			await addToCart(productId, qty);
			setAdded(true);
			onAdded?.();
			// brief success flash
			setTimeout(() => setAdded(false), 2000);
		} catch (e: any) {
			setError(e?.message || 'Error');
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className={`inline-flex flex-col items-start gap-1 ${className}`}>
			<button
				type="button"
				onClick={handleClick}
				disabled={loading}
				className={`px-4 py-2 rounded text-sm font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed 
					${added ? 'bg-green-600 text-white border-green-600' : 'bg-black text-white border-black hover:bg-neutral-800'}
				`}
			>
				{loading ? 'Agregando…' : added ? 'Agregado!' : label}
			</button>
			{error && <span className="text-xs text-red-600">{error}</span>}
		</div>
	);
}

