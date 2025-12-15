import type { AdminProduct } from '@/lib/types'

type ProductCardProps = {
  product: AdminProduct
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="border rounded p-2 flex flex-col">
      <img
        src={product.hero_image}
        alt={product.title}
        className="w-full aspect-square object-cover mb-2"
      />

      <div className="flex-1">
        <h3 className="text-sm font-medium">{product.title}</h3>

        <div className="mt-1">
          <span className="font-semibold">
            ₹ {product.price.toLocaleString('en-IN')}
          </span>

          {product.mrp &&
            product.mrp > product.price && (
              <span className="line-through text-gray-500 ml-2 text-sm">
                ₹ {product.mrp.toLocaleString('en-IN')}
              </span>
            )}
        </div>
      </div>

      <button
        disabled={!product.in_stock}
        className="mt-2 bg-indigo-600 text-white py-1 rounded disabled:bg-gray-400"
      >
        {product.in_stock ? 'Add to cart' : 'Out of stock'}
      </button>
    </div>
  )
}
