import db from "../db.server";

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Max-Age": "86400",
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
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      rating: true,
      comment: true,
      createdAt: true,
    },
  });

  return new Response(JSON.stringify({ reviews }), {
    status: 200,
    headers: corsHeaders,
  });
};

export const action = async ({ request, params }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const productId = params.productId;

  try {
    const body = await request.json();
    const { shop, firstName, lastName, email, rating, comment } = body;

    if (!firstName || !lastName || !email || !rating || !comment || !shop) {
      return new Response(
        JSON.stringify({ error: "Saari fields required hain!" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const existing = await db.review.findFirst({
      where: { productId, shop, email },
    });

    if (existing) {
      return new Response(
        JSON.stringify({ error: "Aap pehle hi is product ka review de chuke hain!" }),
        { status: 400, headers: corsHeaders }
      );
    }

    await db.review.create({
      data: {
        shop,
        productId,
        firstName,
        lastName,
        email,
        rating: Number(rating),
        comment,
        status: "pending",
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Review submit ho gayi! Admin approval ke baad dikhegi.",
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Server error: " + err.message }),
      { status: 500, headers: corsHeaders }
    );
  }
};