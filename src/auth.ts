import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";
import "dotenv/config";

const mongodbUrl = process.env.MONGODB_URL!
const client = new MongoClient(mongodbUrl);
const db = client.db('curalinkhakathon');

export const auth = betterAuth({
    database: mongodbAdapter(db, {
        client
    }),
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,

        },
    },
    emailAndPassword: {
        enabled: true,
    },
    trustedOrigins: ['http://localhost:5173'],
    
});

