const developmentAuthSecret = "littleville-local-development-secret";

export const authSecret = process.env.JWT_SECRET || developmentAuthSecret;
