import { z } from 'zod'

export const QuoteItemSchema = z.object({
  quantity: z.string().min(1, 'Cantidad requerida').refine(v => parseFloat(v) > 0, 'Cantidad debe ser mayor a 0'),
  description: z.string().min(1, 'Descripción requerida'),
  unitPrice: z.string().min(1, 'Precio requerido'),
})

// Todos los campos requeridos (sin .optional()/.default()) para que
// z4.input<typeof QuoteSchema> coincida exactamente con QuoteFormValues.
export const QuoteSchema = z.object({
  number: z.string().min(1, 'Número de cotización requerido'),
  date: z.string().min(1, 'Fecha requerida'),
  clientName: z.string().min(1, 'Nombre del cliente requerido'),
  companyName: z.string(),
  items: z.array(QuoteItemSchema).min(1, 'Agrega al menos un producto'),
  discount: z.number().min(0),
  shipping: z.number().min(0),
})

export type QuoteSchemaInput = z.infer<typeof QuoteSchema>
