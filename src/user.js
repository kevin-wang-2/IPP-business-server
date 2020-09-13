const mongoClient = require("mongodb").MongoClient;
const config = require("../utils/config").readConfigSync();
const mongoPath = "mongodb://" + config["db"]["user"] + ":" + config["db"]["pwd"] + "@" + config["db"]["ip"] + ":" + config["db"]["port"] + "/" + config["db"]["db"]["business"];
const {ObjectID, DBRef} = require("mongodb");

let sha256 = (context) => {
    return crypto.createHash("sha256").update(context + config.auth.salt).digest("base64");
};

module.exports = {
    async post(params, qs, body) {
        if(body.uid) { // 已登录有用户ID
            if(body.uauthority < 800) throw {
                code: 401,
                description: "Cannot create user"
            }
        }

        if(!body.hasOwnProperty("username") || !body.hasOwnProperty("password")) throw {
            code: 400,
            description: "Invalid argument"
        }

        let client = await mongoClient.connect(mongoPath, {useUnifiedTopology: true});
        let db = client.db("business");
        let col = db.collection("user");

        if((await col.find({username: body.username}).count()) === 0) throw {
            code: 400,
            description: "Username already exists"
        }

        await col.insertOne({username: body, password: sha256(body["password"])});

        return {status: "OK"};
    }
}
