/**
 * Helper functions for the schema defined in .pages.yml
 */

import slugify from "slugify";
import { defaultValues, schemas } from "@/fields/registry";
import { z } from "zod";
import { Field } from "@/types/field";
import { format } from "date-fns";
// import { marked } from "marked";
// import insane from "insane";

const deepMap = (
  contentObject: Record<string, any>,
  fields: Field[],
  apply: (value: any, field: Field) => any
): Record<string, any> => {
  const traverse = (data: any, schema: Field[]): any => {
    const result: any = {};

    schema.forEach(field => {
      const value = data[field.name];
      
      // TOOD: do we want to check for undefined or null?
      if (field.list) {
        result[field.name] = Array.isArray(value)
          ? value.map(item =>
              field.type === "object"
                ? traverse(item, field.fields || [])
                : apply(item, field)
            )
          : [];
      } else if (field.type === "object") {
        result[field.name] = value !== undefined
          ? traverse(value, field.fields || [])
          : {};
      } else {
        result[field.name] = apply(value, field);
      }
    });

    return result;
  };

  return traverse(contentObject, fields);
};

// Create an initial state for an entry based on the schema fields and content
const initializeState = (
  fields: Field[] | undefined,
  contentObject: Record<string, any> = {},
  addDefaultEntryToLists: boolean = true
): Record<string, any> => {
  if (!fields) return {};

  return deepMap(contentObject, fields, (value, field) => {
    if (value === undefined) {
      return field.list && addDefaultEntryToLists ? [getDefaultValue(field)] : getDefaultValue(field);
    }
    return value;
  });
};


// Get the defeault value for a field
const getDefaultValue = (field: Record<string, any>) => {
  if (field.default !== undefined) {
    return field.default;
  } else if (field.type === "object") {
    return initializeState(field.fields, {});
  } else {
    return defaultValues?.[field.type] || "";
  }
};

// Generate a Zod schema for validation
const generateZodSchema = (
  fields: Field[],
  ignoreHidden: boolean = false
): z.ZodTypeAny => {
  const buildSchema = (fields: Field[]): Record<string, z.ZodTypeAny> => {
    return fields.reduce((acc: Record<string, z.ZodTypeAny>, field) => {
      if (ignoreHidden && field.hidden) return acc;

      let fieldSchemaFn = schemas?.[field.type] || schemas["text"];
      
      let schema = field.list
        ? z.array(field.type === "object"
          ? z.object(buildSchema(field.fields || []))
          : fieldSchemaFn(field))
        : field.type === "object"
          ? z.object(buildSchema(field.fields || []))
          : fieldSchemaFn(field);

      if (field.list && typeof field.list === "object") {
        // TODO: do we check the type of min and max or do we leave that to the normalize function? Probably normalize as we'll need to also support field options schema.
        if (field.list.min) schema = schema.min(field.list.min);
        if (field.list.max) schema = schema.max(field.list.max);
      }

      if (!field.required) {
        schema = schema.optional();
      }

      acc[field.name] = schema;
      return acc;
    }, {});
  };

  return z.object(buildSchema(fields));
};

// Traverse the object and remove all empty/null/undefined values
const sanitizeObject = (object: any): any => {
  const isEmpty = (val: any) => val == null || val === "";

  if (Array.isArray(object)) {
    return object
      .map(val => (val && typeof val === "object" && !(val instanceof Date) ? sanitizeObject(val) : val))
      .filter(val => !isEmpty(val));
  }

  if (object && typeof object === "object" && !(object instanceof Date)) {
    const objectCopy = { ...object };

    Object.keys(objectCopy).forEach((key) => {
      const val = objectCopy[key];

      if (val && typeof val === "object" && !(val instanceof Date)) {
        objectCopy[key] = sanitizeObject(val);
      }

      if (
        (Array.isArray(objectCopy[key]) && objectCopy[key].every(isEmpty))
        || (typeof objectCopy[key] === "object" && !Array.isArray(objectCopy[key]) && !(objectCopy[key] instanceof Date) && objectCopy[key] != null && !Object.keys(objectCopy[key]).length)
        || isEmpty(objectCopy[key])
      ) {
        delete objectCopy[key];
      }
    });

    return objectCopy;
  }

  return object;
};

// Retrieve the deepest matching content schema in the config for a file
const getSchemaByPath = (config: Record<string, any>, path: string) => {
  if (!config || !config.content) return null;
  
  const normalizedPath = `/${path}/`.replace(/\/\/+/g, "/");
  
  // Sort the entries by the depth of their path, and normalize them
  const matches = config.content
    .map((item: Record<string, any>) => {
      const normalizedConfigPath = `/${item.path}/`.replace(/\/\/+/g, "/");
      return { ...item, path: normalizedConfigPath };
    })
    .filter((item: Record<string, any>)  => normalizedPath.startsWith(item.path))
    .sort((a:  Record<string, any>, b:  Record<string, any>) => b.path.length - a.path.length);
  
    // Return the first item in the sorted array which will be the deepest match, or undefined if no match.
  const schema = matches[0];

  // We deep clone the object to avoid mutating config if schema is modified.
  return schema ? JSON.parse(JSON.stringify(schema)) : null;
};

// Retrieve the matching schema for a type
const getSchemaByName = (config: Record<string, any> | null | undefined, name: string) => {
  if (!config || !config.content || !name) return null;
  
  const schema = config.content.find((item: Record<string, any>) => item.name === name);

  // We deep clone the object to avoid mutating config if schema is modified.
  return schema ? JSON.parse(JSON.stringify(schema)) : null;
};

// Safely access nested properties in an object
function safeAccess(obj: Record<string, any>, path: string) {
  return path.split(".").reduce((acc, part) => {
    if (part.endsWith("]")) {
      const [arrayPath, index] = part.split("[");
      return (acc[arrayPath] || [])[parseInt(index.replace("]", ""), 10)];
    }
    return acc && acc[part];
  }, obj);
}

const getPrimaryField = (schema: Record<string, any>) => {
  return schema?.view?.primary
    || schema?.fields?.find((item: any) => item.name === "title")
      ? "title"
      : schema.fields?.[0]?.name;
}

// Generate a filename for an entry
const generateFilename = (
  pattern: string,
  schema: Record<string, any>,
  state: Record<string, any>
) => {
  // Replace date placeholders
  const now = new Date();
  pattern = pattern.replace(/\{year\}/g, format(now, 'yyyy'))
    .replace(/\{month\}/g, format(now, 'MM'))
    .replace(/\{day\}/g, format(now, 'dd'))
    .replace(/\{hour\}/g, format(now, 'HH'))
    .replace(/\{minute\}/g, format(now, 'mm'))
    .replace(/\{second\}/g, format(now, 'ss'));

  // Replace `{primary}` with the actual name of the primary field
  const primaryField = getPrimaryField(schema);
  pattern = pattern.replace(/\{primary\}/g, primaryField ? `{fields.${primaryField}}` : "untitled");
  
  // Replace field placeholders
  return pattern.replace(/\{fields\.([^}]+)\}/g, (_, fieldName) => {
    const value = safeAccess(state, fieldName);
    return value ? slugify(String(value), { lower: true, strict: true }) : "";
  });
};

// Extract a date from a filename when possible
function getDateFromFilename(filename: string) {
  const pattern = /^(\d{4})-(\d{2})-(\d{2})-/;
  const match = filename.match(pattern);

  if (match) {
    const [ , year, month, day ] = match;
    const date = new Date(`${year}-${month}-${day}`);
    if (!isNaN(date.getTime())) {
      return { year, month, day, string: `${year}-${month}-${day}` };
    }
  }

  return undefined;
}

// Safely render a markdown description as HTML
// TODO: should we enable this back?
const renderDescription = (markdown: string) => {
  // let html = marked(markdown);
  // html = insane(html);
  // html = html.replace(/<a /g, "<a target=\"_blank\" rel=\"noopener noreferrer\" ");
  // return html;
};

export {
  deepMap,
  initializeState,
  getDefaultValue,
  sanitizeObject,
  getSchemaByPath,
  getSchemaByName,
  safeAccess,
  getPrimaryField,
  generateFilename,
  getDateFromFilename,
  generateZodSchema,
  renderDescription
};