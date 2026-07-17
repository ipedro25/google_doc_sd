const Joi = require("joi");

function validate(schema, data) {
  const { error, value } = schema.validate(data);
  if (error) throw new Error(error.details[0].message);
  return value;
}

module.exports = { validate, Joi };
