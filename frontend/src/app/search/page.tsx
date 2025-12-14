import { api } from '@/lib/api'
import FacetFilter from '@/components/FacetFilter'
import SortSelect from '@/components/SortSelect'
import Pagination from '@/components/Pagination'
import Link from 'next/link'


type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[]>>
}
export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const PAGE_SIZE = 4

  const page = Number(params.page || 1)
  const limit = Number(params.limit || PAGE_SIZE)
  
  const queryParams = {
    ...params,
    page: String(page),
    limit: String(limit),
    }

  const data = await api<any>('/v1/products/search', queryParams)
const totalPages = Math.ceil(data.total / limit)

  return (
    <main className="grid grid-cols-[240px_1fr] gap-6 p-6">
      {/* Filters */}
      <aside>
        <FacetFilter
          title="Fabric"
          name="fabric"
          options={data.facets.fabric || {}}
        />
        <FacetFilter
          title="Occasion"
          name="occasion"
          options={data.facets.occasion || {}}
        />
        <FacetFilter
          title="Weave"
          name="weave"
          options={data.facets.weave || {}}
        />
      </aside>

      {/* Products */}
      <section>
     <div className="flex items-center justify-between mb-4">
  <h1 className="text-xl font-semibold">
    Products ({data.total})
  </h1>
  <SortSelect />
</div>


        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.items.map((p: any) => (
            <Link href={`/product/${p.slug}`}>

            <div
              key={p.id}
              className="border rounded-lg p-3 hover:shadow-sm"
            >
              <img
                src={p.image_url}
                alt={p.title}
                className="w-full aspect-square object-cover mb-2"
              />
              <div className="text-sm font-medium">{p.title}</div>
              <div className="text-sm text-muted-foreground">
                ₹{p.price}
              </div>
            </div>
            </Link>

          ))}
        </div>
      </section>
      <Pagination page={page} totalPages={totalPages} />

    </main>
  )
}
