import { redirect } from "next/navigation";
export default function EditExpensePage({ params }: { params: { id: string } }) {
  redirect("/expenses");
}
