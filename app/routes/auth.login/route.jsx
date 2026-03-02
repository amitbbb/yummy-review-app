import { redirect } from "react-router";
import { login } from "../../shopify.server";
import { loginErrorMessage } from "./error.server";

export const loader = async ({ request }) => {
  const errors = loginErrorMessage(await login(request));

  if (Object.keys(errors).length === 0) {
    throw redirect("/app/reviews");
  }

  return { errors };
};

export const action = async ({ request }) => {
  return login(request);
};

export default function Auth() {
  return null;
}
