import { redirect } from "react-router";
import { login } from "../../shopify.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (shop) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  // Shopify Admin se aaya hai to app pe redirect karo
  throw redirect("/app");
};

export const action = async ({ request }) => {
  return login(request);
};

export default function Index() {
  return null;
}