import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(3001),
  JWT_SECRET: z.string().min(16),
  LOG_LEVEL: z.string().default("info")
});

export type Env = z.infer<typeof schema>;

export function getEnv(): Env {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }
  return parsed.data;
}

