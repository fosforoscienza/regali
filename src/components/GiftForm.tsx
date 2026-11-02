"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { saveGift } from "@/app/actions";
import type { ActionState, Gift } from "@/lib/types";
import { IconPhoto } from "./icons";

/** Ridimensiona la foto nel browser: upload veloci e database leggero. */
async function resizeImage(file: File, max = 1400, quality = 0.82): Promise<File> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
    bmp.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], "foto.jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

type Props = {
  gift?: Gift | null;
  recipientId?: string;
  formId: string;
  onSaved: (id: string) => void;
};

export function GiftForm({ gift, recipientId, formId, onSaved }: Props) {
  const [preview, setPreview] = useState<string | null>(
    gift?.has_photo ? `/api/foto/${gift.id}?v=${gift.version}` : null,
  );
  const [removePhoto, setRemovePhoto] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, fd) => {
    const photo = fd.get("photo");
    if (photo instanceof File && photo.size > 0) fd.set("photo", await resizeImage(photo));
    else fd.delete("photo");
    const res = await saveGift(prev, fd);
    if (res.ok && res.id) onSaved(res.id);
    return res;
  }, {});

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  return (
    <form id={formId} action={action} className="space-y-4">
      {gift && <input type="hidden" name="id" value={gift.id} />}
      {!gift && recipientId && <input type="hidden" name="recipient_id" value={recipientId} />}
      <input type="hidden" name="remove_photo" value={removePhoto ? "1" : "0"} />

      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}

      <label className="field">
        <span className="field-label">Cosa</span>
        <input
          className="input"
          name="title"
          required
          maxLength={120}
          defaultValue={gift?.title}
          placeholder="Es. Cuffie wireless"
          autoComplete="off"
        />
      </label>

      <div className="grid grid-cols-[1fr_8rem] gap-3">
        <label className="field">
          <span className="field-label">Link</span>
          <input
            className="input"
            name="link"
            type="text"
            inputMode="url"
            defaultValue={gift?.link ?? ""}
            placeholder="https://"
            autoComplete="off"
            autoCapitalize="off"
          />
        </label>
        <label className="field">
          <span className="field-label">Prezzo</span>
          <div className="relative">
            <input
              className="input pr-8"
              name="price"
              inputMode="decimal"
              defaultValue={gift?.price != null ? String(gift.price).replace(".", ",") : ""}
              placeholder="0"
              autoComplete="off"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-2)]">€</span>
          </div>
        </label>
      </div>

      <label className="field">
        <span className="field-label">Note</span>
        <textarea
          className="input"
          name="notes"
          rows={3}
          defaultValue={gift?.notes ?? ""}
          placeholder="Taglia, colore, dove trovarlo…"
        />
      </label>

      <div className="field">
        <span className="field-label">Foto</span>
        <input
          ref={fileRef}
          type="file"
          name="photo"
          accept="image/*"
          className="sr-only"
          id={`${formId}-photo`}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              setPreview(URL.createObjectURL(f));
              setRemovePhoto(false);
            }
          }}
        />
        {preview ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt=""
              className="w-20 h-20 rounded-xl object-cover bg-[var(--fill)]"
            />
            <div className="flex flex-col items-start">
              <label htmlFor={`${formId}-photo`} className="btn btn-plain btn-sm cursor-pointer">
                Cambia foto
              </label>
              <button
                type="button"
                className="btn btn-plain btn-sm !text-[var(--danger)]"
                onClick={() => {
                  setPreview(null);
                  setRemovePhoto(true);
                  if (fileRef.current) fileRef.current.value = "";
                }}
              >
                Rimuovi
              </button>
            </div>
          </div>
        ) : (
          <label
            htmlFor={`${formId}-photo`}
            className="pressable flex items-center justify-center gap-2 h-20 rounded-xl border border-dashed border-[var(--fill-strong)] text-[var(--accent)] font-medium cursor-pointer"
          >
            <IconPhoto />
            Aggiungi una foto
          </label>
        )}
        {!preview && !removePhoto && (
          <p className="t-caption mt-2 px-1">
            Se non aggiungi una foto, proviamo a prenderla dal link.
          </p>
        )}
      </div>

      <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
        {pending ? "Salvataggio…" : gift ? "Salva modifiche" : "Aggiungi"}
      </button>
    </form>
  );
}
