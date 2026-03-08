import db from "../db.server";

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

export const loader = async ({ request, params }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const productId = params.productId;
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  const reviews = await db.review.findMany({
    where: { productId, shop, status: "approved" },
    select: { rating: true },
  });

  const count = reviews.length;
  const average = count > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / count).toFixed(1)
    : 0;

  return new Response(
    JSON.stringify({ average: Number(average), count }),
    { status: 200, headers: corsHeaders }
  );
};