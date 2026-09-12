const bcrypt = require("bcrypt");
const services = require("../services/group.service");

class Controller {
    async create(req, res) {
        try {
            const param = req.body;
            param.createdby = req.user._id;
            const model = await services.create(param);
            if (model) {
                return res.status(200).json({ ErrorCode: 200, ErrorMessage: "Successfully", data: model });
            }
            return res.status(400).json({ ErrorCode: 400, ErrorMessage: "Something went wrong", data: {} });
        } catch (error) {
            console.error("create error:", error);
            return res.status(500).json({ ErrorCode: 500, ErrorMessage: "Something went wrong", data: {} });
        }
    }

    async getAll(req, res) {
        try {
            const setData = {
                limit: req.query.limit ?? 10,
                skip: req.query.skip ?? 0,
                id: req.user._id,
                name: req.query.name ?? ""
            };
            const result = await services.getAll(setData);
            if (result?.data?.length > 0) {
                return res.status(200).json({ ErrorMessage: "Successfully", result });
            }
            return res.status(200).json({ ErrorMessage: "No data found.", data: [] });
        } catch (error) {
            console.error("getAll error:", error);
            return res.status(500).json({ ErrorMessage: "Something went wrong", data: {} });
        }
    }

    async getById(req, res) {
        try {
            const id = req.query.id;
            if (!id) {
                return res.status(400).json({ ErrorMessage: "Id is required", data: {} });
            }
            const model = await services.getById(id);
            if (model) {
                return res.status(200).json({ ErrorMessage: "Successfully", data: model });
            }
            return res.status(404).json({ ErrorMessage: "No data found.", data: {} });
        } catch (error) {
            console.error("getById error:", error);
            return res.status(500).json({ ErrorMessage: "Something went wrong", data: {} });
        }
    }

    async update(req, res) {
        try {
            const id = req.params.id;
            if (!id) {
                return res.status(400).json({ ErrorMessage: "Id is required", data: {} });
            }
            const model = await services.update(id, req.body);
            if (model) {
                return res.status(200).json({ ErrorMessage: "Successfully", data: model });
            }
            return res.status(404).json({ ErrorMessage: "No data found", data: {} });
        } catch (error) {
            console.error("update error:", error);
            return res.status(500).json({ ErrorMessage: "Something went wrong", data: {} });
        }
    }

    async delete(req, res) {
        try {
            const id = req.params.id;
            if (!id) {
                return res.status(400).json({ ErrorMessage: "Id is required", data: {} });
            }
            const model = await services.delete(id, {});
            if (!model) {
                return res.status(404).json({ ErrorMessage: "Invalid id", data: {} });
            }
            await services.deleteContactGroup(id);
            return res.status(200).json({ ErrorMessage: "Successfully", data: model });
        } catch (error) {
            console.error("delete error:", error);
            return res.status(500).json({ ErrorMessage: "Something went wrong", data: {} });
        }
    }

    async groupCount(req, res) {
        try {
            const result = await services.groupCount(req.user._id);
            if (result !== false && result !== null && result !== undefined) {
                return res.status(200).json({ ErrorMessage: "Successfully", data: result });
            }
            return res.status(200).json({ ErrorMessage: "No data found.", data: {} });
        } catch (error) {
            console.error("groupCount error:", error);
            return res.status(500).json({ ErrorMessage: "Something went wrong", data: {} });
        }
    }
}

module.exports = new Controller();