import { z } from "zod";

export function zodParse<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const res = schema.safeParse(data);
  if (!res.success) {
    const error = new Error("Validation error");
    // @ts-expect-error attach details
    error.details = res.error.flatten();
    throw error;
  }
  return res.data;
}

