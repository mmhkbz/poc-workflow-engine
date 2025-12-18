import jexl from "jexl";

const template = { refId: "variables.refId" };

const body = {
  variables: {
    refId: "UPLOAD01",
    outputs: { first_approval: { remark: "Rejected", isApproved: true } },
    request: { path: "/uploads/test.csv", fileName: "test_new.csv" },
  },
};

// Recursively evaluate template expressions
const evalTemplate = async (
  template: any,
  data: Record<string, any>
): Promise<any> => {
  if (typeof template === "string") {
    // If the value is a JEXL string, evaluate it
    return await jexl.eval(template, data);
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
  // For other data types (number, boolean, etc.), return as is
  return template;
};

// Main evaluation
(async () => {
  const evaluatedResult = await evalTemplate(template, body);
  console.log(JSON.stringify(evaluatedResult, null, 2));
})();
