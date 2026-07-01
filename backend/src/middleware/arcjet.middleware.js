import aj from "../lib/arcjet.js";
import { isSpoofedBot } from "@arcjet/inspect";

export const arcjetProtection = async (req, res, next) => {
  try {
    const decision = await aj.protect(req);

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return res.status(429).json({
          message: "Rate limit exceeded, Please try again later.",
        });
      } 
      
      else if (decision.reason.isBot()) {
        return res.status(403).json({
          message: "Bot traffic is not allowed",
        });
      } 
      
      else {
        return res.status(403).json({
          message: "Request denied by Arcjet",
        });
      }
    }

    if (decision.results?.some(isSpoofedBot)) {
      return res.status(403).json({
        message: "Suspicious bot traffic detected",
        error: "Spoofed bot detected",
      });
    }

    next();
  } catch (error) {
    console.log("Arcjet Protection Error:", error);
    next();
  }
};

export default arcjetProtection;