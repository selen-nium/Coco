import { z } from "zod";

export const caretakerUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(40),
});

export const elderlyLinkSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(40),
  age: z.number().int().min(1).max(120).optional(),
  nickname: z.string().trim().max(60).optional(),
  phone_model: z.string().trim().max(120).optional(),
});

export const elderlyVerifySchema = z.object({
  elderly_user_id: z.string().uuid(),
  code: z.string().trim().min(1).max(12),
});

export const configUpdateSchema = z.object({
  elevenlabs_voice_id: z.string().trim().min(1).max(200).optional(),
  tts_speed: z.number().min(0.5).max(1.5).optional(),
  repetition_level: z.number().int().min(1).max(5).optional(),
  metaphor_mode: z.boolean().optional(),
  allow_sensitive_flows: z.boolean().optional(),
});

export const dismissAlertSchema = z.object({
  status: z.literal("dismissed"),
});

export const flowStepSchema = z.object({
  step: z.number().int().nonnegative(),
  instruction: z.string().trim().min(1),
  target: z.string().trim().min(1),
  location: z.string().trim().min(1),
  icon: z.string().trim().min(1),
  validation: z.string().trim().min(1),
  secondary_anchor: z.string().trim().min(1).optional(),
});

export const flowMutationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  app: z.string().trim().min(2).max(120),
  description: z.string().trim().min(4).max(4000),
  steps: z.array(flowStepSchema),
});

export const testVoiceSchema = z.object({
  elderly_user_id: z.string().uuid(),
  text: z.string().trim().min(1).max(500),
  config: z.object({
    elevenlabs_voice_id: z.string().trim().min(1),
    tts_speed: z.number().min(0.5).max(1.5),
    repetition_level: z.number().int().min(1).max(5),
    metaphor_mode: z.boolean(),
    allow_sensitive_flows: z.boolean().default(false),
  }),
});
