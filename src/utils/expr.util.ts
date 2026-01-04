import jexl from "jexl";

export const evalTemplate = async (
  template: any,
  data: Record<string, any>
): Promise<any> => {
  if (typeof template === "string") {
    // Check for `${...}` syntax for interpolation
    if (template.includes("${")) {
      // If the entire string is a single expression, evaluate it directly
      // This preserves the type of the result (e.g., number, boolean)
      const singleExprMatch = template.match(/^\$\{(.*)\}$/);
      if (singleExprMatch) {
        console.log("Evaluating expression:", singleExprMatch[1]);
        return await jexl.eval(singleExprMatch[1], data);
      }

      // For template strings, replace all occurrences of ${...}
      let result = template;
      const matches = template.match(/\$\{(.*?)\}/g) || [];
      for (const match of matches) {
        const expr = match.substring(2, match.length - 1);
        try {
          const value = await jexl.eval(expr, data);
          result = result.replace(match, String(value));
        } catch (error) {
          console.error(`Error evaluating expression: ${expr}`, error);
          // Keep the original placeholder if evaluation fails
        }
      }
      return result;
    }
    // For plain strings without interpolation, return as is.
    return template;
  } else if (Array.isArray(template)) {
    // If the value is an array, recursively evaluate each element
    return Promise.all(template.map((item) => evalTemplate(item, data)));
  } else if (template && typeof template === "object") {
    // If the value is an object, recursively evaluate each key-value pair
    const output: Record<string, any> = {};
    for (const key in template) {
      output[key] = await evalTemplate(template[key], data);
    }
    return output;
  }
  // For other data types (number, boolean, null, etc.), return as is
  return template;
};
