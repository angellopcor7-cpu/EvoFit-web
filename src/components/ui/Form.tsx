/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { Dispatch, SetStateAction, useRef, useEffect } from "react";
import { Slot } from "@radix-ui/react-slot";
import { z, ZodError, ZodIssue, ZodIssueCode } from "zod";
import styles from "./Form.module.css";

/**
 * Core function for setting up form with types.
 * Note: do not pass a generic type argument, instead have it inferred from the schema value
 */
export function useForm<T extends z.ZodType<any, any>>({
  defaultValues = {},
  schema,
}: {
  defaultValues?: Partial<z.infer<T>>;
  schema: T;
}): {
  values: z.infer<T>;
  defaultValues: Partial<z.infer<T>>;
  setValues: Dispatch<SetStateAction<z.infer<T>>>;
  errors: FormErrors;
  validateField: (path: string, options?: { shallow?: boolean }) => void;
  validateForm: () => boolean;
  setFieldError: (path: string, errorMessage: string) => void;
  handleSubmit: (
    onSubmit: (data: z.infer<T>) => void,
  ) => (e: React.FormEvent) => void;
} {
  const [values, setValues] = React.useState<Record<string, any>>(
    defaultValues as Record<string, any>,
  );
  const [errors, setErrors] = React.useState<FormErrors>({});

  const setFieldError = React.useCallback(
    (path: string, errorMessage: string) => {
      setErrors((prev) => {
        return setValueByPath(prev, path, errorMessage);
      });
    },
    [],
  );

  const isExtraPropertyError = (issue: ZodIssue): boolean => {
    return issue.code === ZodIssueCode.unrecognized_keys;
  };

  const validateForm = React.useCallback((): boolean => {
    if (!schema) return true;
    try {
      makeStrict(schema).parse(values);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof ZodError) {
        const extraPropertyErrors = err.errors.filter(isExtraPropertyError);
        const validationErrors = err.errors.filter(
          (issue) => !isExtraPropertyError(issue),
        );

        if (extraPropertyErrors.length > 0) {
          throw new Error(
            "Extra properties detected in form values:" +
              extraPropertyErrors.map((e) => e.message).join(", ") +
              ". Either update the schema or remove these values",
          );
        }

        const tree: any = {};
        validationErrors.forEach((issue: ZodIssue) => {
          const path = issue.path.join(".");
          const errorMessage =
            typeof issue.message === "string"
              ? issue.message
              : String(issue.message);
          Object.assign(tree, {});
          const tmp = setValueByPath(tree, path, errorMessage);
          Object.assign(tree, tmp);
        });
        setErrors(tree);

        if (validationErrors.length === 0 && extraPropertyErrors.length > 0) {
          throw new Error(
            `Form contains extra properties: ${extraPropertyErrors
              .map((e) => e.message)
              .join(", ")}`,
          );
        }
      }
      console.error("Form validation failed", err);
      return false;
    }
  }, [schema, values]);

  const validateField = React.useCallback(
    (path: string, options?: { shallow?: boolean }) => {
      if (!schema) return;
      const result = schema.safeParse(values);
      setErrors((prev: FormErrors) => {
        let next = { ...prev };

        if (options?.shallow) {
          if (getValueByPath(next, path) !== undefined) {
            next = deleteValueByPath(next, path, { shallow: true });
          }
        } else {
          next = deleteValueByPath(next, path);
        }

        if (!result.success) {
          result.error.errors.forEach((issue) => {
            const ip = issue.path.join(".");

            const shouldIncludeError = options?.shallow
              ? ip === path
              : ip === path || ip.startsWith(path + ".");

            if (shouldIncludeError) {
              const errorMessage =
                typeof issue.message === "string"
                  ? issue.message
                  : String(issue.message);
              next = setValueByPath(next, ip, errorMessage);
            }
          });
        }
        return next;
      });
    },
    [schema, values],
  );

  type Data = z.infer<T>;
  const handleSubmit = React.useCallback(
    (onSubmit: (data: Data) => void) => {
      return (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
          onSubmit(values as Data);
        }
      };
    },
    [validateForm, values],
  );

  const oldValueRef = useRef(values);
  useEffect(() => {
    const diffKeys: string[] = [];
    for (const key of Object.keys(values)) {
      if (
        values[key] !== oldValueRef.current[key] &&
        Array.isArray(values[key]) &&
        Array.isArray(oldValueRef.current[key]) &&
        values[key].length !== oldValueRef.current[key].length
      ) {
        diffKeys.push(key);
      }
    }
    oldValueRef.current = values;
    for (const k of diffKeys) {
      validateField(k, { shallow: true });
    }
  }, [values, validateField]);

  return {
    values,
    errors,
    setValues,
    validateField,
    validateForm,
    setFieldError,
    handleSubmit,
    defaultValues,
  };
}

export function Form<T>(
  props: {
    children: React.ReactNode;
  } & FormContextValue<T>,
) {
  const {
    children,
    values,
    errors,
    setValues,
    validateField,
    validateForm,
    setFieldError,
  } = props;
  return (
    <FormContext.Provider
      value={{
        values,
        errors,
        setValues,
        validateField,
        validateForm,
        setFieldError,
      }}
    >
      {children}
    </FormContext.Provider>
  );
}

export const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { name: string }
>(({ name, className, ...props }, ref) => {
  const id = React.useId();
  return (
    <FormItemContext.Provider value={{ id, name }}>
      <div
        ref={ref}
        className={`${styles.formItem} ${className || ""}`}
        {...props}
      />
    </FormItemContext.Provider>
  );
});
FormItem.displayName = "FormItem";

export const FormLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => {
  const { formItemId, error } = useFormField();
  return (
    <label
      ref={ref}
      className={`${styles.formLabel} ${error ? styles.error : ""} ${className || ""}`}
      htmlFor={formItemId}
      {...props}
    />
  );
});
FormLabel.displayName = "FormLabel";

export const FormControl = React.forwardRef<
  any,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ className, ...props }, ref) => {
  const { formItemId, error, formMessageId, onBlur } = useFormField();
  return (
    <Slot
      ref={ref}
      id={formItemId}
      className={`${styles.formControl} ${error ? styles.error : ""} ${className || ""}`}
      aria-invalid={!!error}
      aria-describedby={error ? formMessageId : undefined}
      onBlur={onBlur}
      {...props}
    />
  );
});
FormControl.displayName = "FormControl";

export const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField();
  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={`${styles.formDescription} ${className || ""}`}
      {...props}
    />
  );
});
FormDescription.displayName = "FormDescription";

export const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { formMessageId, error } = useFormField();
  const body = error ? error.message : children;
  if (!body) return null;
  return (
    <p
      ref={ref}
      id={formMessageId}
      className={`${styles.formMessage} ${className || ""}`}
      {...props}
    >
      {body}
    </p>
  );
});
FormMessage.displayName = "FormMessage";

type FormErrors = {
  [key: string]: string | FormErrors;
};

type FormContextValue<T> = {
  values: T;
  errors: FormErrors;
  setValues: React.Dispatch<React.SetStateAction<T>>;
  validateField: (path: string, options?: { shallow?: boolean }) => void;
  validateForm: () => boolean;
  setFieldError: (path: string, errorMessage: string) => void;
};

const FormContext = React.createContext<FormContextValue<any> | undefined>(
  undefined,
);

function useFormContext(): FormContextValue<any> {
  const ctx = React.useContext(FormContext);
  if (!ctx) throw new Error("useFormContext must be inside <Form>");
  return ctx;
}

type FieldCtx = { id: string; name: string };
const FormItemContext = React.createContext<FieldCtx | null>(null);

function useFormField() {
  const form = useFormContext();
  const ctx = React.useContext(FormItemContext);
  if (!ctx)
    throw new Error(
      "<FormLabel> and <FormControl> must live inside <FormItem>",
    );

  const { id, name } = ctx;
  const errorValue = getValueByPath(form.errors, name);
  const errorMsg = typeof errorValue === "string" ? errorValue : undefined;
  return {
    id,
    name,
    error: errorMsg ? { message: errorMsg } : undefined,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    onBlur: () => form.validateField(name),
    validateShallow: () => form.validateField(name, { shallow: true }),
  };
}

function getValueByPath(obj: any, path: string): any {
  const keys = path.split(".");
  let current = obj;
  for (const key of keys) {
    if (current == null) return undefined;
    if (/^\d+$/.test(key) && Array.isArray(current)) {
      current = current[+key];
    } else {
      current = current[key];
    }
  }
  return current;
}

function setValueByPath(obj: any, path: string, value: any): any {
  const keys = path.split(".");
  const lastKey = keys.pop()!;
  const newObj = { ...obj };
  let pointer = newObj;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const nextKey = keys[i + 1];
    if (pointer[key] == null) {
      pointer[key] = /^\d+$/.test(nextKey) ? [] : {};
    } else if (Array.isArray(pointer[key])) {
      pointer[key] = [...pointer[key]];
    } else if (typeof pointer[key] === "object") {
      pointer[key] = { ...pointer[key] };
    }
    pointer = pointer[key];
  }

  if (/^\d+$/.test(lastKey) && Array.isArray(pointer)) {
    pointer[+lastKey] = value;
  } else {
    pointer[lastKey] = value;
  }

  return newObj;
}

function deleteValueByPath(
  obj: any,
  path: string,
  options?: { shallow?: boolean },
): any {
  const keys = path.split(".");
  const last = keys.pop()!;
  let pointer = obj;
  const parents: Array<{ parent: any; key: string }> = [];

  for (const key of keys) {
    if (pointer[key] == null) {
      return obj;
    }
    parents.push({ parent: pointer, key });
    pointer = pointer[key];
  }

  if (pointer && typeof pointer === "object" && last in pointer) {
    if (options?.shallow) {
      if (typeof pointer[last] === "string") {
        delete pointer[last];
      } else if (
        typeof pointer[last] === "object" &&
        !Array.isArray(pointer[last])
      ) {
        if ("message" in pointer[last]) {
          delete pointer[last].message;
        }
      }
    } else {
      delete pointer[last];
    }
  }

  if (!options?.shallow) {
    for (let i = parents.length - 1; i >= 0; i--) {
      const { parent, key } = parents[i];
      const val = parent[key];
      const isEmptyObj =
        val && !Array.isArray(val) && Object.keys(val).length === 0;
      const isEmptyArr = Array.isArray(val) && val.length === 0;
      if (isEmptyObj || isEmptyArr) {
        delete parent[key];
      }
    }
  }

  return obj;
}

function makeStrict(schema: z.ZodSchema) {
  if (schema instanceof z.ZodObject) {
    return schema.strict();
  }
  return schema;
}
