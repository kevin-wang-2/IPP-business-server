const mongoClient = require("mongodb").MongoClient;
const config = require("../utils/config").readConfigSync();
const mongoPath = "mongodb://" + config["db"]["user"] + ":" + config["db"]["pwd"] + "@" + config["db"]["ip"] + ":" + config["db"]["port"] + "/" + config["db"]["db"]["business"];
const {ObjectID} = require("mongodb");

module.exports = {
    async list() {
        let db = await mongoClient.connect(mongoPath, {useUnifiedTopology: true});
        let colGarage = db.db(config["db"]["db"]["hardware"]).collection("garage");
        let result = await colGarage.find().toArray();
        await db.close()

        return result;
    }
}