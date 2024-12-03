const Category = require('../models/categoryModel');
const Response = require('../utils/response');

exports.createCategory = async (req, res) => {
    try {
        const existingCategory = await Category.findOne({ name: req.body.name });
        if (existingCategory) {
            return new Response(null, "Bu kategori zaten mevcut").error400(res);
        }

        const category = new Category(req.body);
        await category.save();
        return new Response(category, "Kategori başarıyla oluşturuldu").created(res);
    } catch (error) {
        return new Response(null, error.message).error500(res);
    }
};

exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        return new Response(categories, "Kategoriler başarıyla getirildi").success(res);
    } catch (error) {
        return new Response(null, error.message).error500(res);
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) {
            return new Response(null, "Kategori bulunamadı").error404(res);
        }
        return new Response(null, "Kategori başarıyla silindi").success(res);
    } catch (error) {
        return new Response(null, error.message).error500(res);
    }
};
