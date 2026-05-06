import { useParams } from "react-router";
import NavForm from "./_form";
export default function UpdateNav() {
  const { id } = useParams();
  return <NavForm mode="update" id={id} />;
}
