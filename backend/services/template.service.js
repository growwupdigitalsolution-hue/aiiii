// services/template.service.js
const templateModel = require("../models/templates.model");

const saveTemplateRecord = async (data) => templateModel.create(data);

const updateTemplateRecord = async (templateId, data) =>
    templateModel.findOneAndUpdate({ templateId }, data, { new: true });

const findByTemplateId = async (templateId) =>
    templateModel.findOne({ templateId, isDeleted: 0 });

// list API me merge karne ke liye - ek hi query se saare matching records
const findManyByTemplateIds = async (templateIds) =>
    templateModel.find({ templateId: { $in: templateIds }, isDeleted: 0 });

const softDeleteTemplate = async (templateId) =>
    templateModel.findOneAndUpdate({ templateId }, { isDeleted: 1 });

module.exports = {
    saveTemplateRecord,
    updateTemplateRecord,
    findByTemplateId,
    findManyByTemplateIds,
    softDeleteTemplate
};