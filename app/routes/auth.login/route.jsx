import { redirect } from "react-router";

export const loader = async () => {
  throw redirect("/app/reviews");
};

export const action = async () => {
  throw redirect("/app/reviews");
};

export default function Auth() {
  return null;
}
