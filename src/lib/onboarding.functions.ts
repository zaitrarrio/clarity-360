import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SeedSchema = z.object({
  name: z.string().min(1),
  stage: z.string().min(1),
  industryKey: z.string().min(1),
  subcategory: z.string(),
  location: z.string().min(1),
  website: z.string(),
  objective: z.string().min(1),
});

const DraftInput = z.object({
  seed: SeedSchema,
  corrections: z.array(
    z.object({
      flagId: z.string(),
      where: z.string(),
      assumed: z.string(),
      choice: z.string(),
      result: z.string().optional(),
    }),
  ),
});

const ForkInput = z.object({
  seed: SeedSchema,
  decisions: z.array(z.object({ forkId: z.string(), question: z.string(), choice: z.string() })),
});

export const nextDraftRound = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => DraftInput.parse(d))
  .handler(async ({ data }) => {
    const { draftRound } = await import("./onboarding.server");
    return draftRound(data);
  });

export const nextForkRound = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ForkInput.parse(d))
  .handler(async ({ data }) => {
    const { forkRound } = await import("./onboarding.server");
    return forkRound(data);
  });
