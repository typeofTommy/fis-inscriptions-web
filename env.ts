import {z} from "zod";

const envVariables = z.object({
  FIS_DB_HOST: z.string(),
  FIS_DB_USER: z.string(),
  FIS_DB_PASS: z.string(),
  FIS_DB_NAME: z.string(),
});

envVariables.parse(process.env);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface ProcessEnv extends z.infer<typeof envVariables> {}
  }
}
