"use client";

import { useForm, useFieldArray, useWatch } from "react-hook-form";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { QuoteSchema } from "@/lib/schemas/quote";
import type { QuoteFormValues } from "@/types/quote";
import { DEFAULT_QUOTE_NUMBER, COMPANY } from "@/lib/constants/company";
import { todayISO } from "@/lib/utils/date";
import { mxn } from "@/lib/utils/currency";
import { calculateTotals, rowTotal } from "@/lib/calculations/totals";

interface QuoteFormProps {
  onSubmit: (data: QuoteFormValues) => void;
  defaultValues?: Partial<QuoteFormValues>;
}

const INPUT =
  "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white";
const INPUT_ERR =
  "w-full border border-red-400 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white";
const LABEL = "block text-xs font-medium text-gray-600 mb-1";
const SECTION = "bg-white rounded-xl shadow-sm border border-gray-100 p-5";
const SECTION_TITLE =
  "text-xs font-semibold text-blue-900 uppercase tracking-wide mb-4";

// ── Fila aislada: su propio useWatch para no re-renderizar las demás filas ──
interface ItemRowProps {
  index: number;
  fieldId: string;
  register: UseFormRegister<QuoteFormValues>;
  errors: FieldErrors<QuoteFormValues>;
  remove: (index: number) => void;
  isOnly: boolean;
  lineTotal: number;
}

function ItemRow({
  index,
  fieldId,
  register,
  errors,
  remove,
  isOnly,
  lineTotal,
}: ItemRowProps) {
  return (
    // Un único grid que reposiciona los elementos según breakpoint.
    // Mobile (4 cols):  fila 1 = descripción full-width | fila 2 = cant · precio · total · ×
    // Desktop (5 cols): fila 1 = cant · descripción · precio · total · ×
    <div
      key={fieldId}
      className={[
        "grid gap-x-2 gap-y-2 items-start",
        // Mobile: borde de tarjeta
        "border border-gray-200 rounded-lg p-3",
        // Mobile: 4 columnas + 2 filas
        "grid-cols-[56px_1fr_96px_32px]",
        "[grid-template-areas:'desc_desc_desc_desc'_'qty_price_total_del']",
        // Desktop: sin borde, 5 columnas + 1 fila
        "sm:border-0 sm:rounded-none sm:p-0",
        "sm:grid-cols-[48px_1fr_130px_96px_32px]",
        "sm:[grid-template-areas:'qty_desc_price_total_del']",
      ].join(" ")}
    >
      {/* Descripción — único textarea, se posiciona distinto en mobile vs desktop */}
      <div className="[grid-area:desc]">
        <textarea
          {...register(`items.${index}.description`)}
          placeholder="Descripción del producto o servicio"
          rows={2}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = el.scrollHeight + "px";
          }}
          className={`resize-none overflow-hidden ${errors.items?.[index]?.description ? INPUT_ERR : INPUT}`}
        />
        {errors.items?.[index]?.description && (
          <p className="text-xs text-red-500">
            {errors.items[index]?.description?.message}
          </p>
        )}
      </div>

      {/* Cantidad */}
      <div className="[grid-area:qty]">
        <div className="text-xs text-gray-400 mb-1 sm:hidden">Cant.</div>
        <input
          {...register(`items.${index}.quantity`)}
          type="text"
          inputMode="numeric"
          placeholder="0"
          className={`w-full border rounded-lg px-2 py-2 sm:py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.items?.[index]?.quantity ? "border-red-400" : "border-gray-300"}`}
        />
      </div>

      {/* Precio unitario */}
      <div className="[grid-area:price]">
        <div className="text-xs text-gray-400 mb-1 sm:hidden">P. Unitario</div>
        <input
          {...register(`items.${index}.unitPrice`)}
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          className={`w-full border rounded-lg px-2 py-2 sm:py-2.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.items?.[index]?.unitPrice ? "border-red-400" : "border-gray-300"}`}
        />
      </div>

      {/* Total */}
      <div className="[grid-area:total] text-right">
        <div className="text-xs text-gray-400 mb-1 sm:hidden">Total</div>
        <div className="font-semibold text-sm py-2 sm:pr-1 sm:text-gray-800">
          {mxn(lineTotal)}
        </div>
      </div>

      {/* Eliminar */}
      <button
        type="button"
        onClick={() => remove(index)}
        disabled={isOnly}
        className="[grid-area:del] self-center text-red-400 hover:text-red-600 disabled:opacity-20 text-xl font-bold flex items-center justify-center"
      >
        ×
      </button>
    </div>
  );
}

// ── Formulario principal ───────────────────────────────────────────────────
export function QuoteForm({ onSubmit, defaultValues }: QuoteFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<QuoteFormValues>({
    resolver: zodResolver(QuoteSchema),
    defaultValues: {
      number: DEFAULT_QUOTE_NUMBER,
      date: todayISO(),
      clientName: "",
      companyName: "",
      items: [{ quantity: "1", description: "", unitPrice: "" }],
      discount: 0,
      shipping: 0,
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const watchedItems = useWatch({ control, name: "items" }) ?? [];
  const watchedDiscount = useWatch({ control, name: "discount" }) ?? 0;
  const watchedShipping = useWatch({ control, name: "shipping" }) ?? 0;
  const totals = calculateTotals(
    watchedItems,
    watchedDiscount,
    watchedShipping,
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {/* ── Datos de la cotización ── */}
      <section className={SECTION}>
        <h2 className={SECTION_TITLE}>Datos de la Cotización</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Número de Cotización</label>
            <input
              {...register("number")}
              className={errors.number ? INPUT_ERR : INPUT}
            />
            {errors.number && (
              <p className="text-xs text-red-500 mt-1">
                {errors.number.message}
              </p>
            )}
          </div>
          <div>
            <label className={LABEL}>Fecha</label>
            <input
              {...register("date")}
              type="date"
              className={errors.date ? INPUT_ERR : INPUT}
            />
            {errors.date && (
              <p className="text-xs text-red-500 mt-1">{errors.date.message}</p>
            )}
          </div>
        </div>
      </section>

      {/* ── Datos del cliente ── */}
      <section className={SECTION}>
        <h2 className={SECTION_TITLE}>Datos del Cliente</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Cliente</label>
            <input
              {...register("clientName")}
              placeholder="Nombre del cliente"
              className={errors.clientName ? INPUT_ERR : INPUT}
            />
            {errors.clientName && (
              <p className="text-xs text-red-500 mt-1">
                {errors.clientName.message}
              </p>
            )}
          </div>
          <div>
            <label className={LABEL}>
              Empresa{" "}
              <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              {...register("companyName")}
              placeholder="Nombre de la empresa"
              className={INPUT}
            />
          </div>
        </div>
      </section>

      {/* ── Productos y servicios ── */}
      <section className={SECTION}>
        <h2 className={SECTION_TITLE}>Productos y Servicios</h2>

        <div className="hidden sm:grid sm:grid-cols-[48px_1fr_130px_96px_32px] gap-2 mb-1 px-1">
          {["Cant.", "Descripción", "P. Unitario", "Total", ""].map((h, i) => (
            <span
              key={i}
              className={`text-xs font-semibold text-gray-400 uppercase ${i >= 2 ? "text-right" : ""}`}
            >
              {h}
            </span>
          ))}
        </div>

        <div className="space-y-3">
          {fields.map((field, index) => (
            <ItemRow
              key={field.id}
              fieldId={field.id}
              index={index}
              register={register}
              errors={errors}
              remove={remove}
              isOnly={fields.length === 1}
              lineTotal={rowTotal(watchedItems[index] ?? {})}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            append({ quantity: "1", description: "", unitPrice: "" })
          }
          className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
        >
          <span className="text-lg leading-none">+</span> Agregar producto /
          servicio
        </button>

        {errors.items?.root && (
          <p className="text-xs text-red-500 mt-2">
            {errors.items.root.message}
          </p>
        )}
        {typeof errors.items?.message === "string" && (
          <p className="text-xs text-red-500 mt-2">{errors.items.message}</p>
        )}
      </section>

      {/* ── Ajustes y totales ── */}
      <section className={SECTION}>
        <h2 className={SECTION_TITLE}>Ajustes y Totales</h2>
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="sm:w-44 space-y-4">
            <div>
              <label className={LABEL}>Descuento ($)</label>
              <input
                {...register("discount", {
                  setValueAs: (v) =>
                    v === "" || isNaN(Number(v)) ? 0 : Number(v),
                })}
                type="number"
                min="0"
                step="0.01"
                defaultValue={0}
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Envío ($)</label>
              <input
                {...register("shipping", {
                  setValueAs: (v) =>
                    v === "" || isNaN(Number(v)) ? 0 : Number(v),
                })}
                type="number"
                min="0"
                step="0.01"
                defaultValue={0}
                className={INPUT}
              />
            </div>
          </div>

          <div className="flex-1 bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Total Parcial</span>
              <span className="font-medium">{mxn(totals.subtotal)}</span>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Descuento</span>
                <span className="font-medium text-red-500">
                  −{mxn(totals.discount)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200 pt-2">
              <span className="text-gray-500">NETO</span>
              <span className="font-medium">{mxn(totals.net)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">IVA (16%)</span>
              <span className="font-medium">{mxn(totals.iva)}</span>
            </div>
            {totals.shipping > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Envío</span>
                <span className="font-medium">{mxn(totals.shipping)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-blue-900">
              <span>TOTAL NETO</span>
              <span>{mxn(totals.total)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Botón guardar ── */}
      <div className="pb-8">
        <button
          type="submit"
          className="w-full bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-bold py-4 rounded-xl transition-colors text-base flex items-center justify-center gap-2 shadow-md"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          Guardar y ver vista previa
        </button>
      </div>
    </form>
  );
}
