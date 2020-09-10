const mongoClient = require("mongodb").MongoClient;
const config = require("../utils/config").readConfigSync();
const mongoPath = "mongodb://" + config["db"]["user"] + ":" + config["db"]["pwd"] + "@" + config["db"]["ip"] + ":" + config["db"]["port"] + "/" + config["db"]["db"]["business"];
const {ObjectID} = require("mongodb");

module.exports = {
    async list() {
        let client = await mongoClient.connect(mongoPath, {useUnifiedTopology: true});
        let db = client.db("hardware");

        let droneCol = db.collection("drone");
        let statusCol = db.collection("status");

        let droneList = await droneCol.find({}).toArray();
        for(let i = 0; i < droneList.length; i++) {
            let status = await statusCol.find({drone: droneList[i]._id}).sort({time: -1, _id: -1}).limit(1).toArray();
            if(status.length) {
                droneList[i].status = status[0];
            }
        }

        await client.close();

        return droneList;
    },
    async status(params, query) {
        if(!params.hasOwnProperty("id")) throw {
            code: 400,
            description: "Invalid argument"
        }

        let id;
        try {
            id = ObjectID(params.id);
        } catch(e) {
            throw {
                code: 400,
                description: "Argument should be ObjectID"
            };
        }

        let client = await mongoClient.connect(mongoPath, {useUnifiedTopology: true});
        let db = client.db("hardware");

        let col = db.collection("status");
        let record = col.find({drone: id});
        if(query.limit) record = record.limit(parseInt(query.limit));
        let result = await record.toArray();

        await client.close();

        return result;
    }
}