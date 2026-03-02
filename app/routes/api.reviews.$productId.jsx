import { data } from "react-router";
import db from "../db.server";

function corsHeaders(request) {
  const origin = request.headers.get("Origin") ?? "*";
  const requestHeaders =
    request.headers.get("Access-Control-Request-Headers") ?? "Content-Type";

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": requestHeaders,
    Vary: "Origin, Access-Control-Request-Headers",
  };
}

// GET - Sirf approved reviews fetch karo
export const loader = async ({ request, params }) => {
  const productId = params.productId;
  const shop = new URL(request.url).searchParams.get("shop");

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

  return data(
    { reviews },
    {
      headers: corsHeaders(request),
    }
  );
};

// POST - Customer ka naya review save karo (pending status mein)
export const action = async ({ request, params }) => {
  const productId = params.productId;
  const body = await request.json();
  const { shop, firstName, lastName, email, rating, comment } = body;

  // Validation
  if (!firstName || !lastName || !email || !rating || !comment) {
    return data(
      { error: "Saari fields required hain!" },
      {
        status: 400,
        headers: corsHeaders(request),
      }
    );
  }

  // Email already reviewed check karo
  const existing = await db.review.findFirst({
    where: { productId, shop, email },
  });

  if (existing) {
    return data(
      { error: "Aap pehle hi is product ka review de chuke hain!" },
      {
        status: 400,
        headers: corsHeaders(request),
      }
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

  return data(
    { success: true, message: "Review submitted! Will appear after admin approval." },
    { headers: corsHeaders(request) }
  );
};
