import { Router, type IRouter } from "express";
import { CreateEarlyAccessSignupBody, CreateEarlyAccessSignupResponse } from "@workspace/api-zod";
import { db, earlyAccessSignupsTable } from "@workspace/db";

const router: IRouter = Router();

router.post("/early-access", async (req, res): Promise<void> => {
  const parsed = CreateEarlyAccessSignupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const firstName = parsed.data.firstName.trim();
  const whatsappNumber = parsed.data.whatsappNumber?.trim() || null;

  if (!firstName) {
    res.status(400).json({ error: "Please enter your first name." });
    return;
  }

  if (whatsappNumber && (whatsappNumber.length < 7 || whatsappNumber.length > 24)) {
    res.status(400).json({ error: "Please enter a valid WhatsApp number." });
    return;
  }

  await db
    .insert(earlyAccessSignupsTable)
    .values({
      firstName,
      email: parsed.data.email.trim().toLowerCase(),
      whatsappNumber,
    })
    .onConflictDoNothing({ target: earlyAccessSignupsTable.email });

  res.status(202).json(
    CreateEarlyAccessSignupResponse.parse({
      message: "You're on the list.",
    }),
  );
});

export default router;
