import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { canSee, isUuid } from "@/lib/data";

export async function GET(_req: Request, ctx: RouteContext<"/api/foto/[id]">) {
  const me = await getCurrentUser();
  if (!me) return new Response("Non autorizzato", { status: 401 });
  const { id } = await ctx.params;
  if (!isUuid(id)) return new Response("Non trovato", { status: 404 });

  const [row] = await query<{
    photo: Buffer | null;
    photo_type: string | null;
    recipient_id: string;
    author_id: string | null;
    done_at: string | null;
  }>(
    "select photo, photo_type, recipient_id, author_id, done_at::text from gifts where id = $1",
    [id],
  );
  if (!row?.photo || !canSee(me, row)) return new Response("Non trovato", { status: 404 });

  return new Response(new Uint8Array(row.photo), {
    headers: {
      "Content-Type": row.photo_type ?? "image/jpeg",
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
