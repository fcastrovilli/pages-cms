import { z } from "zod";
import { Field } from "@/types/field";
import { EditComponent } from "./edit-component";

const schema = (field: Field) => {
  let zodSchema = z.coerce.string();
  
  if (field.required) zodSchema = zodSchema.min(1, "This field is required");
  if (field.pattern) {
    if (typeof field.pattern === "string") {
      zodSchema = zodSchema.regex(new RegExp(field.pattern), "Invalid format");
    } else {
      zodSchema = zodSchema.regex(new RegExp(field.pattern.regex), field.pattern.message || "Invalid pattern format");
    }
  }
  if (field.options?.minlength) zodSchema = zodSchema.min(field.options.minlength as number, `Minimum length is ${field.options.minlength} characters`);
  if (field.options?.maxlength) zodSchema = zodSchema.max(field.options.maxlength as number, `Maximum length is ${field.options.maxlength} characters`);
  
  return zodSchema;
};

export { schema, EditComponent};