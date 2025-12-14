GET /v1/products/search

Query Params:

- q
- category
- fabric
- color
- occasion
- min_price
- max_price
- sort (price_asc | price_desc | newest)
- page
- limit

Response:
{
items: ProductCard[],
facets: Facets,
page,
limit,
total
}
