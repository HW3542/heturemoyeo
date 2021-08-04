const express = require("express");
const {Users} = require("../models");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const loginCheckMiddleware = require("../middleware/login-check-middleware");
const crypto = require("crypto");
const router = express.Router();

const loginSchema = Joi.object({
    email: Joi.string()
        .required()
        .pattern(
            /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i
        ),
    password: Joi.string()
        .required()
        .pattern(/^(?=.*[a-zA-Z0-9])((?=.*\d)|(?=.*\W)).{6,20}$/),
});

router.route("/")
    .post(loginCheckMiddleware, async (req, res) => {
        try {
            const {email, password} = await loginSchema.validateAsync(req.body);
            const cryptoPass = crypto.createHash('sha512').update(password).digest('base64')

            const user = await Users.findOne({
                where: {email, password: cryptoPass},
            }).then((user) => {
                if (!user) {
                    throw Error("이메일 또는 패스워드가 잘못되었습니다.")
                }
                return user["dataValues"];
            });

            const token = jwt.sign({userId: user.userId}, process.env.SECRET_KEY);
            res.cookie("authorization", token);
            res.send({token});
        } catch (error) {
            console.log(`${req.method} ${req.baseUrl} : ${error.message}`);
            res.status(401).send({
                errorMessage: "요청한 데이터가 올바르지 않습니다.",
            });
        }
    });

router.route('/test')
    .post((req, res) => {
        const token = jwt.sign({userId: 2}, process.env.SECRET_KEY);
        res.cookie("authorization", token);
        res.send({token});
    })

module.exports = router;
