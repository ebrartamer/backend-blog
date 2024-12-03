const Tag = require('../models/tagModel');
const Response = require('../utils/response');

exports.createTag = async (req, res) => {
    try {
        const existingTag = await Tag.findOne({ name: req.body.name });
        if (existingTag) {
            return new Response(null, "Bu etiket zaten mevcut").error400(res);
        }

        const tag = new Tag(req.body);
        await tag.save();
        return new Response(tag, "Etiket başarıyla oluşturuldu").created(res);
    } catch (error) {
        return new Response(null, error.message).error500(res);
    }
};

exports.getAllTags = async (req, res) => {
    try {
        const tags = await Tag.find();
        return new Response(tags, "Etiketler başarıyla getirildi").success(res);
    } catch (error) {
        return new Response(null, error.message).error500(res);
    }
};

exports.deleteTag = async (req, res) => {
    try {
        const tag = await Tag.findByIdAndDelete(req.params.id);
        if (!tag) {
            return new Response(null, "Etiket bulunamadı").error404(res);
        }
        return new Response(null, "Etiket başarıyla silindi").success(res);
    } catch (error) {
        return new Response(null, error.message).error500(res);
    }
};
