import { api } from "@/lib/api"
import ProductDetailPage from "@/components/ProductDetailPage"

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const data = await api<{
    product: any
    variants: any[]
    media: any[]
  }>(`/v1/products/slug/${slug}`)

  return <ProductDetailPage {...data} />
}
