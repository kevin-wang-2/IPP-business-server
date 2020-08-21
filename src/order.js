const mongoClient = require("mongodb").MongoClient;
const config = require("../utils/config").readConfigSync();
const mongoPath = "mongodb://" + config["db"]["user"] + ":" + config["db"]["pwd"] + "@" + config["db"]["ip"] + ":" + config["db"]["port"] + "/" + config["db"]["db"]["business"];
const {ObjectID} = require("mongodb");

module.exports = {
    async post(params, qs, body) {
        /**
         * 这里没有任何真正商业上的流程只是创建了订单
         */
        if(!body.to || !body.product || !body.receiver) throw {
            code: 400,
            description: "Invalid argument"
        };

        let db = await mongoClient.connect(mongoPath, {useUnifiedTopology: true});
        let colGarage = db.db(config["db"]["db"]["hardware"]).collection("garage");
        let colProduct = db.db(config["db"]["db"]["business"]).collection("product");
        let colUser = db.db(config["db"]["db"]["business"]).collection("user");
        let colOrder = db.db(config["db"]["db"]["business"]).collection("order");

        let garFrom, garTo, product, receiver;

        try {
            product = ObjectID(body.product);
            let cnt = await colProduct.find({_id: product, status: "waiting"}).count();
            if(cnt === 0) throw {
                code: 400,
                description: "Invalid product"
            };
        } catch(e) {
            if(e.code) throw e;
            else throw {
                code: 400,
                description: "Argument \"product\" should be ObjectID"
            }
        }

        let rec = await colGarage.find({products: product}).toArray();
        if(rec.length === 0) throw {
            code: 400,
            description: "Product should be in a garage"
        };
        garFrom = rec[0]._id;

        try {
            garTo = ObjectID(body.to);
            let cnt = await colGarage.find({_id: garTo}).count();
            if(cnt === 0) throw {
                code: 400,
                description: "Invalid garage \"to\""
            };
        } catch(e) {
            if(e.code) throw e;
            else throw {
                code: 400,
                description: "Argument \"to\" should be ObjectID"
            }
        }

        try {
            receiver = ObjectID(body.receiver);
            let cnt = await colUser.find({_id: receiver}).count();
            if(cnt === 0) throw {
                code: 400,
                description: "Invalid user \"receiver\""
            };
        } catch(e) {
            if(e.code) throw e;
            else throw {
                code: 400,
                description: "Argument \"receiver\" should be ObjectID"
            }
        }

        let result = colOrder.insertOne({
            from: garFrom,
            to: garTo,
            product,
            sender: body.uid,
            receiver,
            status: "unpaid",
            flight: {
                tasks: [],
                status: "unplanned"
            }
        });

        await db.close();

        return {id: result.insertedId};
    },
    async get(params, qs, body) {
        if(!params.id) throw {
            code: 400,
            description: "Invalid argument"
        };

        let id;
        try {
            id = ObjectID(params.id);
        } catch(e) {
            throw {
                code: 400,
                description: "Argument should be ObjectID"
            };
        }

        let db = await mongoClient.connect(mongoPath, {useUnifiedTopology: true});
        let col = db.db(config["db"]["db"]["business"]).collection("order");
        let result;
        if(body.uauthority < 200)
            result = await col.find({_id: id, $or: [{sender: body.uid}, {receiver: body.uid}]}).toArray();
        else
            result = await col.find({_id: id}).toArray();
        await db.close();

        if(result.length)
            return result[0];
        else throw {
            code: 404,
            description: "No corresponding result"
        };
    },
    async list() {
        let db = await mongoClient.connect(mongoPath, {useUnifiedTopology: true});
        let col = db.db(config["db"]["db"]["business"]).collection("order");
        let result = await col.find({}).toArray();
        await db.close();

        return result;
    },
    async delete(params, qs, body) {
        if(!params.id) throw {
            code: 400,
            description: "Invalid argument"
        };

        let id;
        try {
            id = ObjectID(params.id);
        } catch(e) {
            throw {
                code: 400,
                description: "Argument should be ObjectID"
            };
        }

        let db = await mongoClient.connect(mongoPath, {useUnifiedTopology: true});
        let col = db.db(config["db"]["db"]["business"]).collection("order");
        let colFail = db.db(config["db"]["db"]["business"]).collection("fail_order");
        if(body.uauthority < 200) { // 普通用户逻辑
            let rec = await col.find({_id: id, $or: [{sender: body.uid}, {receiver: body.uid}]}).toArray();
            if(rec.length === 0) throw {
                    code: 400,
                    description: "Order doesn't exist"
                };
            let order = rec[0];
            switch (order.status) {
                case "unpaid":
                    await col.deleteOne({_id: order.id});
                    await db.close();
                    return {success: true};
                case "pending":
                    await col.deleteOne({_id: order.id});
                    let result = await colFail.insertOne({order, reason: "user"});
                    await db.close();
                    return {success: true, failOrder: result.insertedId};
                default:
                    await db.close();
                    return {success: false, code: 0, reason: "order already on board"}
            }
        } else {
            let rec = await col.find({_id: id}).toArray();
            if(rec.length === 0) throw {
                code: 400,
                description: "Order doesn't exist"
            };
            let order = rec[0];
            switch (order.status) {
                case "unpaid":
                case "pending":
                    await col.deleteOne({_id: order.id});
                    let result = await colFail.insertOne({order, reason: "admin"});
                    await db.close();
                    return {success: true, failOrder: result.insertedId};
                default:
                    await db.close();
                    return {success: false, code: 0, reason: "order already on board"}
            }
        }
    }
};