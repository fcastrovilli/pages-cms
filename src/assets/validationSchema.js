const validationSchema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "media": {
      "type": ["string", "object"],
      "if": {
        "type": "object"
      },
      "then": {
        "type": "object",
        "required": ["input", "output"],
        "properties": {
          "input": {
            "type": "string",
            "pattern": "^[^/].*[^/]$|^$",
            "errorMessage": "Property 'input' must be a valid relative path (no leading or trailing slash)."
          },
          "output": {
            "type": "string",
            "pattern": "^/?[^/].*[^/]$|^/?$",
            "errorMessage": "Property 'output' must be a valid path with no trailing slash."
          },
          "path": {
            "type": "string",
            "pattern": "^[^/].*[^/]$|^$",
            "errorMessage": "Property 'path' must be a valid relative path (no leading or trailing slash)."
          },
          "extensions": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "errorMessage": "Property 'extensions' must be an array of strings (e.g. [ png, gif ])."
          },
          "categories": {
            "type": "array",
            "items": {
              "type": "string",
              "enum": ["image", "document", "video", "audio", "compressed"],
              "errorMessage": "Invalid category value. Allowed values are: image, document, video, audio, compressed."
            },
            "errorMessage": "Property 'categories' must be an array of predefined category strings."
          },
          "optimize": {
            "type": "object",
            "properties": {
              "enabled": {
                "type": "boolean",
                "default": true
              },
              "maxWidth": {
                "type": "integer",
                "minimum": 100,
                "maximum": 8192,
                "default": 1920
              },
              "maxHeight": {
                "type": "integer",
                "minimum": 100,
                "maximum": 8192,
                "default": 1080
              },
              "quality": {
                "type": "number",
                "minimum": 0.1,
                "maximum": 1.0,
                "default": 0.85
              }
            },
            "additionalProperties": false,
            "default": {
              "enabled": true,
              "maxWidth": 1920,
              "maxHeight": 1080,
              "quality": 0.85
            }
          }
        },
        "additionalProperties": false,
        "errorMessage": {
          "required": {
            "input": "Property 'input' is required when 'media' is an object.",
            "output": "Property 'output' is required when 'media' is an object."
          }
        }
      },
      "else": {
        "type": "string",
        "pattern": "^[^/].*[^/]$|^$",
        "errorMessage": "If 'media' is a string, it must be a valid relative path (no leading or trailing slash)."
      },
      "errorMessage": {
        "type": "'media' must be a string (relative path) or an object with 'input' and 'output' attributes."
      }
    },
    "content": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/contentObject"
      },
      "minItems": 1,
      "errorMessage": "Property 'content' must be an array of objects with at least one entry."
    },
    "settings": {
      "type": ["boolean", "null"],
      "enum": [false, null],
      "errorMessage": "Property 'settings' can only be false or null."
    }
  },
  "additionalProperties": false,
  "definitions": {
    "contentObject": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "pattern": "^[a-zA-Z0-9-_]+$",
          "errorMessage": "Property 'name' must be alphanumeric with dashes and underscores."
        },
        "label": {
          "type": "string",
          "errorMessage": "Property 'label' must be a string."
        },
        "description": {
          "type": ["string", "null"],
          "errorMessage": "Property 'description' must be a string if specified."
        },
        "icon": {
          "type": "string",
          "errorMessage": "Property 'icon' must be a string."
        },
        "type": {
          "type": "string",
          "enum": ["collection", "file"],
          "errorMessage": "Property 'type' must be either 'collection' or 'file'."
        },
        "path": {
          "type": "string",
          "pattern": "^[^/].*[^/]$|^$",
          "errorMessage": "Property 'path' must be a valid relative path (no leading or trailing slash)."
        },
        "filename": {
          "type": ["string", "null"],
          "errorMessage": "Property 'filename' must be a string if specified."
        },
        "exclude": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "errorMessage": "Property 'exclude' must be an array of file paths (strings) to exclude."
        },
        "list": {
          "type": ["object", "boolean"],
          "if": {
            "type": "object"
          },
          "then": {
            "type": "object",
            "properties": {
              "min": {
                "type": "integer",
                "minimum": 0,
                "errorMessage": "Property 'min' must be a positive integer (minimum 0)."
              },
              "max": {
                "type": "integer",
                "minimum": 1,
                "errorMessage": "Property 'max' must be a positive integer (minimum 1)."
              }
            },
            "additionalProperties": false
          },
          "else": {
            "type": "boolean",
            "errorMessage": "Property 'list' can be a boolean; 'true' for an array of values, 'false' for a single value."
          },
          "errorMessage": {
            "type": "Property 'list' must be either a boolean or an object with 'min' and 'max' properties."
          }
        },
        "view": {
          "type": ["object", "null"],
          "properties": {
            "fields": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "errorMessage": "Property 'fields' must be an array of strings if specified."
            },
            "primary": {
              "type": ["string", "null"],
              "errorMessage": "Property 'primary' must be a string if specified."
            },
            "sort": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "errorMessage": "Property 'sort' must be an array of strings if specified."
            },
            "search": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "errorMessage": "Property 'search' must be an array of strings if specified."
            },
            "default": {
              "type": ["object", "null"],
              "properties": {
                "search": {
                  "type": ["string", "null"],
                  "errorMessage": "Property 'default.search' must be a string if specified."
                },
                "sort": {
                  "type": ["string", "null"],
                  "errorMessage": "Property 'default.sort' must be a string if specified."
                },
                "order": {
                  "type": ["string", "null"],
                  "enum": ["asc", "desc"],
                  "errorMessage": "Property 'default.order' must be 'asc' or 'desc' if specified."
                }
              },
              "additionalProperties": false
            }
          },
          "additionalProperties": false
        },
        "format": {
          "type": ["string", "null"],
          "enum": ["yaml-frontmatter", "json-frontmatter", "toml-frontmatter", "yaml", "json", "toml", "datagrid", "code", "raw"],
          "errorMessage": "Property 'format' must be one of the specified formats: yaml-frontmatter, json-frontmatter, toml-frontmatter, yaml, json, toml, datagrid, code, raw."
        },
        "delimiters": {
          "type": ["string", "array"],
          "if": {
            "type": "array"
          },
          "then": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "minItems": 2,
            "maxItems": 2,
            "errorMessage": "If specified as an array, 'delimiters' must contain exactly two string values."
          },
          "else": {
            "type": "string",
            "errorMessage": "If specified as a string, 'delimiters' must be a single string value."
          },
          "errorMessage": {
            "type": "Property 'delimiters' must be either a string or an array of 2 strings."
          }
        },        
        "subfolders": {
          "type": ["boolean", "null"],
          "errorMessage": "Property 'subfolders' must be a boolean value if specified."
        },
        "fields": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/fieldObject"
          },
          "minItems": 1,
          "errorMessage": "Property 'fields' must be an array of field objects with at least one element."
        }
      },
      "required": ["name", "type", "path"],
      "additionalProperties": false,
      "errorMessage": {
        "required": {
          "name": "Property 'name' is required.",
          "type": "Property 'type' is required.",
          "path": "Property 'path' is required.",
        },
        "type": "Each content entry must be an object with 'name', 'type' and 'path' attributes."
      }
    },
    "fieldObject": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "pattern": "^[a-zA-Z0-9-_]+$",
          "errorMessage": "Property 'name' must be alphanumeric with dashes and underscores."
        },
        "label": {
          "type": "string",
          "errorMessage": "Property 'label' must be a string."
        },
        "type": {
          "type": "string",
          "enum": ["string", "text", "number", "boolean", "date", "select", "object", "image", "file", "grid", "markdown"],
          "errorMessage": "Property 'type' must be one of the supported field types."
        },
        "required": {
          "type": "boolean",
          "errorMessage": "Property 'required' must be a boolean."
        },
        "layout": {
          "type": "object",
          "properties": {
            "width": {
              "type": "string",
              "enum": ["1/1", "1/2", "1/3", "2/3", "1/4", "3/4"],
              "errorMessage": "Width must be one of: 1/1, 1/2, 1/3, 2/3, 1/4, 3/4"
            },
            "column": {
              "type": "integer",
              "minimum": 0,
              "maximum": 11,
              "errorMessage": "Column must be between 0 and 11"
            },
            "row": {
              "type": "integer",
              "minimum": 0,
              "errorMessage": "Row must be a non-negative integer"
            }
          },
          "required": ["width"],
          "additionalProperties": false,
          "allOf": [
            {
              "if": {
                "properties": { "width": { "const": "1/1" } }
              },
              "then": {
                "properties": { "column": { "const": 0 } }
              }
            },
            {
              "if": {
                "properties": { "width": { "const": "1/2" } }
              },
              "then": {
                "properties": { "column": { "enum": [0, 3, 6, 9] } }
              }
            },
            {
              "if": {
                "properties": { "width": { "const": "1/3" } }
              },
              "then": {
                "properties": { "column": { "enum": [0, 4, 8] } }
              }
            },
            {
              "if": {
                "properties": { "width": { "const": "2/3" } }
              },
              "then": {
                "properties": { "column": { "enum": [0, 4] } }
              }
            },
            {
              "if": {
                "properties": { "width": { "const": "1/4" } }
              },
              "then": {
                "properties": { "column": { "enum": [0, 3, 6, 9] } }
              }
            },
            {
              "if": {
                "properties": { "width": { "const": "3/4" } }
              },
              "then": {
                "properties": { "column": { "enum": [0, 3] } }
              }
            }
          ],
          "errorMessage": {
            "required": {
              "width": "Layout must specify a width"
            },
            "properties": {
              "width": "Invalid width value",
              "column": "Invalid column position for the specified width",
              "row": "Invalid row position"
            }
          }
        },
        "description": {
          "type": ["string", "null"],
          "errorMessage": "Property 'description' must be a string if specified."
        },
        "default": {
          "type": ["null", "boolean", "number", "string", "object", "array"],
          "errorMessage": "Property 'default' must match the specified field type."
        },
        "list": {
          "type": ["object", "boolean"],
          "if": {
            "type": "object"
          },
          "then": {
            "type": "object",
            "properties": {
              "min": {
                "type": "integer",
                "minimum": 0,
                "errorMessage": "Property 'min' must be a positive integer (minimum 0)."
              },
              "max": {
                "type": "integer",
                "minimum": 1,
                "errorMessage": "Property 'max' must be a positive integer (minimum 1)."
              }
            },
            "additionalProperties": false
          },
          "else": {
            "type": "boolean",
            "errorMessage": "Property 'list' can be a boolean; 'true' for an array of values, 'false' for a single value."
          }
        },
        "hidden": {
          "type": ["boolean", "null"],
          "errorMessage": "Property 'hidden' must be a boolean value if specified."
        },
        "pattern": {
          "type": ["object", "string"],
          "if": {
            "type": "object"
          },
          "then": {
            "type": "object",
            "properties": {
              "regex": {
                "type": "string",
                "errorMessage": "Property 'regex' must be a valid regex."
              },
              "message": {
                "type": "string",
                "errorMessage": "Property 'message' must be a string explaining the regex pattern."
              }
            },
            "required": ["regex"],
            "additionalProperties": false,
            "errorMessage": {
              "required": {
                "regex": "Property 'regex' is required when 'pattern' is an object."
              }
            }
          },
          "else": {
            "type": "string",
            "errorMessage": "Property 'pattern' must be a valid regex string if specified."
          }
        },
        "options": {
          "type": ["object", "null"],
          "errorMessage": "Property 'options' must be an object if specified."
        },
        "fields": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/fieldObject"
          },
          "minItems": 1,
          "errorMessage": "Property 'fields' must be an array of nested field objects if specified."
        }
      },
      "required": ["name", "type"],
      "additionalProperties": false,
      "errorMessage": {
        "required": {
          "name": "Property 'name' is required for each field.",
          "type": "Property 'type' is required for each field."
        }
      }
    }
  }
};

export default validationSchema;