import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { AuthSchemaModel } from "./Models/UserModel";
import { NewsletterModel, QueryModel } from "./Models/OtherModels";
const app = express();
app.use(express.json());

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: mongoose.Types.ObjectId;
        role: string;
      };
    }
  }
}


const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ error: "Authorization header missing" });

  const token = authHeader.split(" ")[1];
  if (!token)
    return res.status(401).json({ error: "Token missing" });

  try {
    const decoded = jwt.verify(
      token,
      process.env.YOUR_SECRET_KEY as string
    ) as any;

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};


const requireRole =
  (roles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };



app.get("/dashboard", verifyToken, async (req: Request, res: Response) => {
  const user = await AuthSchemaModel.findById(req.user!.userId)
    .select(
      "name email bio userimg facebook github linkedin instagram role"
    )
    .lean();

  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

app.get(
  "/admin/users",
  verifyToken,
  requireRole(["superadmin"]),
  async (_req: Request, res: Response) => {
    const users = await AuthSchemaModel.find()
      .select("name email role createdAt")
      .lean();

    res.json(users);
  }
);

app.put(
  "/admin/make-admin/:email",
  verifyToken,
  requireRole(["superadmin"]),
  async (req: Request, res: Response) => {
    await AuthSchemaModel.updateOne(
      { email: req.params.email },
      { role: "admin" }
    );
    res.json({ message: "User promoted to admin" });
  }
);

app.put(
  "/admin/make-client/:email",
  verifyToken,
  requireRole(["superadmin"]),
  async (req: Request, res: Response) => {
    await AuthSchemaModel.updateOne(
      { email: req.params.email },
      { role: "client" }
    );
    res.json({ message: "User demoted to client" });
  }
);


app.post(
  "/getNewsletters",
  verifyToken,
  requireRole(["admin", "superadmin"]),
  async (_req: Request, res: Response) => {
    const newsletters = await NewsletterModel.find().lean();
    res.json(newsletters);
  }
);


app.post(
  "/createUser",
  verifyToken,
  requireRole(["admin", "superadmin"]),
  async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await AuthSchemaModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await AuthSchemaModel.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    res.status(201).json({ message: "User created successfully" });
  }
);


app.post("/sendQuery", async (req: Request, res: Response) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  await QueryModel.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    message: message.trim(),
    read: false,
  });

  res.status(201).json({ message: "Query sent successfully" });
});


app.get(
  "/getQueries",
  verifyToken,
  requireRole(["admin", "superadmin"]),
  async (_req: Request, res: Response) => {
    const queries = await QueryModel.find().lean();
    res.json(queries);
  }
);


app.get(
  "/getQueries/:id",
  verifyToken,
  requireRole(["admin", "superadmin"]),
  async (req: Request, res: Response) => {
    const query = await QueryModel.findById(req.params.id).lean();

    if (!query) {
      return res.status(404).json({ error: "Query not found" });
    }

    res.json(query);
  }
);


app.get(
  "/query-read/:id",
  verifyToken,
  requireRole(["admin", "superadmin"]),
  async (req: Request, res: Response) => {
    const query = await QueryModel.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    ).lean();

    if (!query) {
      return res.status(404).json({ error: "Query not found" });
    }

    res.json({ message: "Query marked as read" });
  }
);

export default app;