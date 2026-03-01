import { data } from "react-router";
import db from "../db.server";

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
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
};

// POST - Customer ka naya review save karo (pending status mein)
export const action = async ({ request, params }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  const productId = params.productId;
  const body = await request.json();
  const { shop, firstName, lastName, email, rating, comment } = body;

  // Validation
  if (!firstName || !lastName || !email || !rating || !comment) {
    return data(
      { error: "Saari fields required hain!" },
      {
        status: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
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
        headers: { "Access-Control-Allow-Origin": "*" },
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
    { headers: { "Access-Control-Allow-Origin": "*" } }
  );
};