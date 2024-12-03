const User = require('../models/userModels');
const { registerValidation, loginValidation } = require('../validations/userValidations');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Response = require('../utils/response');

exports.register = async (req, res) => {
    try {
        const { error } = registerValidation(req.body);
        if (error) {
            return new Response(null, error.details[0].message).error400(res);
        }

        const [emailExists, usernameExists] = await Promise.all([
            User.findOne({ email: req.body.email }),
            User.findOne({ username: req.body.username })
        ]);

        const errors = [];
        
        if (emailExists) {
            errors.push("Bu email adresi zaten kullanımda");
        }
        
        if (usernameExists) {
            errors.push("Bu kullanıcı adı zaten kullanımda");
        }

        if (errors.length > 0) {
            return new Response(null, errors.join(', ')).error400(res);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        const user = new User({
            username: req.body.username,
            email: req.body.email,
            password: hashedPassword
        });

        const savedUser = await user.save();
        const userData = {
            id: savedUser._id,
            username: savedUser.username,
            email: savedUser.email
        };
        
        return new Response(userData, "Kullanıcı başarıyla oluşturuldu").created(res);
    } catch (error) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            const message = field === 'email' 
                ? "Bu email adresi zaten kullanımda"
                : "Bu kullanıcı adı zaten kullanımda";
            return new Response(null, message).error400(res);
        }
        return new Response(null, error.message).error500(res);
    }
};

exports.login = async (req, res) => {
    try {
        const { error } = loginValidation(req.body);
        if (error) {
            return new Response(null, error.details[0].message).error400(res);
        }

        const user = await User.findOne({ username: req.body.username });
        if (!user) {
            return new Response(null, "Kullanıcı bulunamadı").error404(res);
        }

        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if (!validPassword) {
            return new Response(null, "Geçersiz şifre").error401(res);
        }

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        const responseData = {
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        };

        return new Response(responseData, "Giriş başarılı").success(res);
    } catch (error) {
        return new Response(null, error.message).error500(res);
    }
};

// Tüm kullanıcıları getir
exports.getAllUsers = async (req, res) => {
    try {

        const users = await User.find({ deletedAt: null })
            .select('-password') 
            .sort({ createdAt: -1 }); 

        return new Response(users, "Kullanıcılar başarıyla getirildi").success(res);
    } catch (error) {
        return new Response(null, error.message).error500(res);
    }
};