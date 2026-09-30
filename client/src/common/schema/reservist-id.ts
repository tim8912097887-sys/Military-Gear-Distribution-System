import z from "zod";

export const reservistIdSchema = z.uuid("reservistId must be a UUID");
