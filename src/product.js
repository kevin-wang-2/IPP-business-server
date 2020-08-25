const mongoClient = require("mongodb").MongoClient;
const config = require("../utils/config").readConfigSync();
const mongoPath = "mongodb://" + config["db"]["user"] + ":" + config["db"]["pwd"] + "@" + config["db"]["ip"] + ":" + config["db"]["port"] + "/" + config["db"]["db"]["business"];
const {ObjectID, DBRef} = require("mongodb");

module.exports = {
    async post(params, qs, body) {
        if (!body.hasOwnProperty("garage")) throw {
            code: 400,
            description: "Invalid argument"
        };

        let garage;
        try {
            garage = ObjectID(body.garage);
        } catch (e) {
            throw {
                code: 400,
                description: "Invalid argument"
            };
        }

        let db = await mongoClient.connect(mongoPath, {useUnifiedTopology: true});
        let colGarage = db.db(config["db"]["db"]["hardware"]).collection("garage");
        let colProduct = db.db(config["db"]["db"]["business"]).collection("product");

        let garageCnt = await colGarage.find({_id: garage}).count();
        if(garageCnt === 0) throw {
                code: 400,
                description: "No corresponding garage"
            };

        let uid = body.uid;

        let insertRec = await colProduct.insertOne({
            sender: DBRef("user", uid),
            status: "waiting"
        });

        let updateRec = await colGarage.updateOne({_id: garage}, {
            $push: {
                products: DBRef("product", insertRec.insertedId, "business")
            }
        })

        await db.close();

        return updateRec.result;
    },
    async get(params, qs, body) {
        if(!params.hasOwnProperty("id")) throw {
            code: 400,
            description: "Invalid argument"
        };

        let product;
        try {
            product = ObjectID(params.id);
        } catch (e) {
            throw {
                code: 400,
                description: "Invalid argument"
            };
        }

        if(body.uauthority > 0) {
            let db = await mongoClient.connect(mongoPath, {useUnifiedTopology: true});
            let colProduct = db.db(config["db"]["db"]["business"]).collection("product");
            let rec = await colProduct.find({_id: product}).toArray();

            if(!rec.length) throw {
                code: 400,
                description: "No corresponding product"
            };

            return rec[0];
        }
        // TODO: 添加普通用户的
    },
    async delete(params) {
        if(!params.hasOwnProperty("id")) throw {
            code: 400,
            description: "Invalid argument"
        };

        let product;
        try {
            product = ObjectID(params.id);
        } catch (e) {
            throw {
                code: 400,
                description: "Invalid argument"
            };
        }

        let db = await mongoClient.connect(mongoPath, {useUnifiedTopology: true});
        let colGarage = db.db(config["db"]["db"]["hardware"]).collection("garage");
        let colProduct = db.db(config["db"]["db"]["business"]).collection("product");

        let deleteResult = await colProduct.deleteOne({
            _id: product,
            status: "waiting"
        });

        if(deleteResult.deletedCount !== 1) throw {
                code: 400,
                description: "No corresponding product"
            };

        let updateResult = await colGarage.updateOne({"products.$id": product}, {
            $pull: {
                products: {
                    $id: product
                }
            }
        });

        await db.close();

        return updateResult.result;
    }
}