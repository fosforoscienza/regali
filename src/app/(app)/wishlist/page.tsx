import { requireUser } from "@/lib/auth";
import { getMyWishlist, listPeople } from "@/lib/data";
import { GiftBoard } from "@/components/GiftBoard";

export const metadata = { title: "La mia wishlist · Regali" };

export default async function WishlistPage() {
  const me = await requireUser();
  const [gifts, people] = await Promise.all([getMyWishlist(me), listPeople()]);
  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="t-large">La mia wishlist</h1>
          <p className="t-sub mt-1">Ciò che ti piacerebbe ricevere. I suggerimenti degli altri per te restano una sorpresa.</p>
        </div>
      </header>
      <GiftBoard
        gifts={gifts}
        me={{ id: me.id, is_admin: me.is_admin }}
        people={people.map((p) => ({ id: p.id, name: p.name }))}
        recipient={{ id: me.id, name: me.name, birth_date: me.birth_date }}
        variant="mine"
      />
    </>
  );
}
