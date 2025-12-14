import { api } from '@/lib/api'
import AddToCartButton from '@/components/AddToCartButton'


type ProductPageProps = {
  params: Promise<{ slug: string }>
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const data = await api<any>(`/v1/products/slug/${slug}`)

  const { product, variants, media } = data
  const variant = variants[0]

  return (
    <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Image */}
      <div>
        <img
          src={media?.[0]?.url}
          alt={product.title}
          className="w-full rounded-lg"
        />
      </div>

      {/* Info */}
      <div>
        <h1 className="text-2xl font-semibold mb-2">
          {product.title}
        </h1>

        <div className="text-xl font-medium mb-4">
          ₹{variant.price}
          {variant.mrp && (
            <span className="ml-2 text-sm line-through text-muted-foreground">
              ₹{variant.mrp}
            </span>
          )}
        </div>

        <p className="text-muted-foreground mb-6">
          {product.short_desc}
        </p>

        <div className="space-y-2 mb-6 text-sm">
          <div><b>Fabric:</b> {product.attributes.fabric}</div>
          <div><b>Weave:</b> {product.attributes.weave}</div>
          <div><b>Origin:</b> {product.attributes.origin}</div>
          <div><b>Occasion:</b> {product.attributes.occasion?.join(', ')}</div>
          <div><b>Care:</b> {product.attributes.care}</div>
        </div>

       <AddToCartButton productId={product.id} variantId={variant.id} />

      </div>
    </main>
  )
}
