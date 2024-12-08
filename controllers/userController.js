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
            password: hashedPassword,
            role: req.body.role // Rol parametresi eklendi
        });

        const savedUser = await user.save();
 
        const token = jwt.sign(
            { id: user._id, username: user.username, role: user.role }, // Rol verisi token'e eklendi
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        const responseData = {
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role 
            }
        };

        
        return new Response(responseData, "Kullanıcı başarıyla oluşturuldu").created(res);
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
            { id: user._id, username: user.username, role: user.role }, // Rol verisi token'e eklendi
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        const responseData = {
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role 
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

// Kullanıcı güncelleme
exports.updateUser = async (req, res) => {
    try {
        // İsteği yapan kullanıcının yetkisini kontrol et
        const isAdmin = req.user.role === 'admin';
        const isSameUser = req.user._id.toString() === req.params.id;

        if (!isAdmin && !isSameUser) {
            return new Response(null, "Bu işlem için yetkiniz yok").error401(res);
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return new Response(null, "Kullanıcı bulunamadı").error404(res);
        }

        // Sadece admin rolü değiştirebilir
        if (req.body.role && !isAdmin) {
            return new Response(null, "Rol değiştirme yetkiniz yok").error401(res);
        }

        // Email veya kullanıcı adı değiştiriliyorsa, benzersiz olduğunu kontrol et
        if (req.body.email && req.body.email !== user.email) {
            const emailExists = await User.findOne({ email: req.body.email });
            if (emailExists) {
                return new Response(null, "Bu email adresi zaten kullanımda").error400(res);
            }
        }

        if (req.body.username && req.body.username !== user.username) {
            const usernameExists = await User.findOne({ username: req.body.username });
            if (usernameExists) {
                return new Response(null, "Bu kullanıcı adı zaten kullanımda").error400(res);
            }
        }

        // Şifre değiştiriliyorsa hash'le
        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            req.body.password = await bcrypt.hash(req.body.password, salt);
        }

        // Kullanıcıyı güncelle
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        ).select('-password');

        return new Response(updatedUser, "Kullanıcı başarıyla güncellendi").success(res);
    } catch (error) {
        return new Response(null, error.message).error500(res);
    }
};

// Kullanıcı silme (soft delete)
exports.deleteUser = async (req, res) => {
    try {
        // İsteği yapan kullanıcının yetkisini kontrol et
        const isAdmin = req.user.role === 'admin';
        const isSameUser = req.user._id.toString() === req.params.id;

        if (!isAdmin && !isSameUser) {
            return new Response(null, "Bu işlem için yetkiniz yok").error401(res);
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return new Response(null, "Kullanıcı bulunamadı").error404(res);
        }

        // Admin kendini silemesin
        if (user.role === 'admin' && isSameUser) {
            return new Response(null, "Admin kullanıcısı kendini silemez").error400(res);
        }

        // Soft delete - deletedAt alanını güncelle
        user.deletedAt = new Date();
        await user.save();

        return new Response(null, "Kullanıcı başarıyla silindi").success(res);
    } catch (error) {
        return new Response(null, error.message).error500(res);
    }
};

// Kullanıcı detaylarını getir
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password')
            .where('deletedAt').equals(null);

        if (!user) {
            return new Response(null, "Kullanıcı bulunamadı").error404(res);
        }

        return new Response(user, "Kullanıcı detayları başarıyla getirildi").success(res);
    } catch (error) {
        return new Response(null, error.message).error500(res);
    }
};

// Tüm kullanıcıları getir (sadece admin erişebilir)
exports.getAllUsers = async (req, res) => {
    try {
        // Admin kontrolü
        if (req.user.role !== 'admin') {
            return new Response(null, "Bu işlem için admin yetkisi gerekiyor").error401(res);
        }

        const users = await User.find({ deletedAt: null })
            .select('-password')
            .sort({ createdAt: -1 });

        return new Response(users, "Kullanıcılar başarıyla getirildi").success(res);
    } catch (error) {
        return new Response(null, error.message).error500(res);
    }
};