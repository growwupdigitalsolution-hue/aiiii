// COMMON VALIDATION MIDDLEWARE
// ------------------------------------------------------------
// Har controller me manually "if (!field) return res.status(400)..."
// likhne ki zarurat nahi. Bas ek Joi schema banao (validators/ folder)
// aur route me ek line laga do:
//
//   router.post("/sing-in", validate(authValidator.signInSchema), controller.signIn)
//
// Jaha bhi validate chahiye (body/params/query), bas source badal do:
//   validate(schema)              -> default req.body check karega
//   validate(schema, "params")    -> req.params check karega
//   validate(schema, "query")     -> req.query check karega
// ------------------------------------------------------------

const validate = (schema, source = "body") => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[source], {
            abortEarly: false,   // sab errors ek sath dikhao, sirf pehli nahi
            stripUnknown: true,  // schema me na likhi hui extra fields hata do
        });

        if (error) {
            const message = error.details.map((d) => d.message).join(", ");
            return res.status(400).json({
                "ErrorMessage": message,
                "data": {}
            });
        }

        req[source] = value; // sanitized/validated value wapas assign
        next();
    };
};

module.exports = validate;
