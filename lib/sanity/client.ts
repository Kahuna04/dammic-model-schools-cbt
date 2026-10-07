import { createClient } from "@sanity/client";

export const apiVersion = process.env.SANITY_API_VERSION || "2025-01-01";
export const dataset = process.env.SANITY_DATASET || "production";
export const projectId = process.env.SANITY_PROJECT_ID!;
export const useCdn = true;

export const client = createClient({ projectId, dataset, apiVersion, useCdn });
