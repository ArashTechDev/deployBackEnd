const Joi = require('joi');

const hoursPattern = /^\d{1,2}:\d{2}-\d{1,2}:\d{2}$/;

const createFoodBankSchema = Joi.object({
  name: Joi.string().min(3).required(),
  address: Joi.string().required(),
  city: Joi.string().required(),
  province: Joi.string().required(),
  postalCode: Joi.string().required(),
  contactEmail: Joi.string().email().required(),
  contactPhone: Joi.string().required(),
  operatingHours: Joi.object().pattern(
    Joi.string().valid('mon','tue','wed','thu','fri','sat','sun'),
    Joi.string().pattern(hoursPattern)
  ).required(),
});

const updateFoodBankSchema = Joi.object({
  name: Joi.string().min(3).optional(),
  address: Joi.string().optional(),
  city: Joi.string().optional(),
  province: Joi.string().optional(),
  postalCode: Joi.string().optional(),
  contactEmail: Joi.string().email().optional(),
  contactPhone: Joi.string().optional(),
  operatingHours: Joi.object().pattern(
    Joi.string().valid('mon','tue','wed','thu','fri','sat','sun'),
    Joi.string().pattern(hoursPattern)
  ).optional(),
});

function validateCreateFoodBank(req, res, next) {
  const { error } = createFoodBankSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
}

function validateUpdateFoodBank(req, res, next) {
  const { error } = updateFoodBankSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
}

module.exports = { validateCreateFoodBank, validateUpdateFoodBank };
