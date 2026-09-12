# Role Based Auth v2 - Mobile login + Common Validation

## Kya badla pichle version se

1. **Login ab email se nahi, `mobileCode + mobileNo + password` se hota hai.** Email field
   model me hai but optional hai, sirf profile info k liye - authentication me use nahi hota.
2. **Sirf EK super admin hoga.** Koi public `/sing-up` route nahi hai. Super admin
   `seed/createSuperAdmin.js` script se ek hi baar banta hai (agar DB me pehle se
   koi SUPER_ADMIN hai toh script khud skip kar degi, dobara nahi banayegi).
3. **Admin/Collaborator kabhi khud signup nahi karte** - unhe SUPER_ADMIN (ya ADMIN,
   collaborator k case me) `/create-staff` route se banate hain. Wahi unka "signup" hai,
   aur wo bhi mobile number se hi hota hai.
4. **Common validation middleware** - `middleware/validate.middleware.js`. Har controller
   me manually `if (!field) return res.status(400)...` likhne ki zarurat khatam. Bas
   Joi schema banao (`validators/` folder me) aur route pe ek line laga do.

## Folder structure
```
config/db.config.js            -> mongodb connect
constants/roles.constant.js    -> role numbers (1 SUPER_ADMIN, 2 ADMIN, 3 COLLABORATOR)
validators/*.validator.js      -> Joi schemas, ek jagah sab validation rules
middleware/validate.middleware.js -> generic validate(schema) - reuse har route me
middleware/role.middleware.js  -> checkRole(...roles)
helper/authToken.helper.js     -> generateToken / verifyToken / refreshToken
models/users.model.js          -> mobileCode+mobileNo required & unique, role required
controllers/
  auth.controller.js           -> signIn (sabhi roles)
  user.controller.js           -> self-service: profile, change password
  admin.controller.js          -> createStaff, getStaffList (role protected)
  enquiry.controller.js
  dashboard.controller.js
routes/*.route.js               -> har feature ka apna file
routes/index.js                -> AUTO LOADER, kabhi touch nahi karna
seed/createSuperAdmin.js       -> sirf ek hi baar chalta hai, single super admin banata hai
app.js
```

## Naya route add karna ho (index.js touch kiye bina)
```js
// routes/ticket.route.js
const express = require("express");
const router = express.Router();
const helper = require("../helper/authToken.helper");
const validate = require("../middleware/validate.middleware");
const { checkRole } = require("../middleware/role.middleware");
const ROLES = require("../constants/roles.constant");
const Joi = require("joi");

const createTicketSchema = Joi.object({
    subject: Joi.string().required(),
    description: Joi.string().required(),
});

router.post(
    "/ticket/create",
    helper.verifyToken,
    checkRole(ROLES.ADMIN, ROLES.COLLABORATOR),
    validate(createTicketSchema),
    (req, res) => res.json({ ErrorMessage: "success", data: req.body })
);

module.exports = router;
```
File ka naam `*.route.js` se end hona chahiye, bas - `routes/index.js` khud dhoondh
kar mount kar lega. Server console me `[routes] mounted -> ticket.route.js` dikhega.

## Login/signup flow
```
1. npm run seed:super-admin        -> DB me pehla aur AKHRI SUPER_ADMIN banta hai
2. Super admin POST /api/sing-in   -> mobileCode+mobileNo+password se login
3. Super admin POST /api/create-staff (role=ADMIN)        -> naya admin banta hai
4. Us admin ne POST /api/create-staff (role=COLLABORATOR) -> collaborator banta hai
   (admin ko sirf collaborator banane ki permission hai, dusra admin nahi)
5. Sab log POST /api/sing-in se hi login karte hain (mobile number se)
```

## Validation - ab controller me nahi likhna padega
Pehle: har function ke andar `if (!razorpay_payment_id || ...) return res.status(400)...`
Ab: sirf route pe schema attach karo, `req.body` already validated + sanitized milta hai:
```js
router.post("/create-staff", helper.verifyToken, checkRole(...), validate(adminValidator.createStaffSchema), controller.createStaff)
```

## services/singInUp.service.js me zarurat hai in functions ki
(aapki purani file share nahi hui thi, isliye interface yaha likh raha hoon - functions
same rakhne hain, sirf query fields mobile-based karni hain)

```js
duplicatCheck({ mobileCode, mobileNo, isDelete })     // count return kare
signIn({ mobileCode, mobileNo, isDelete })            // ek user document return kare
singUp(param)                                         // naya user create kare, model return kare
getUserDetails(id)
update(id, setData)
updateProfile(id, setData)
createEnquiry(setData)
getEnquiry()
getStaffByCreator(creatorId)  // NAYA -> users.find({ createdBy: creatorId, isDelete: 0 }).select("-password")
```

## Run
```bash
cp .env.example .env      # apni values + SUPER_ADMIN_* daalo
npm install
npm run seed:super-admin  # sirf pehli baar
npm run dev
```
